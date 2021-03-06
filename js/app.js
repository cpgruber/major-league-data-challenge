var mlb = {
  svgAtt:{
    width:parseFloat(d3.select('.svgContain').style('width')),
    height:500,
    margins:{
      left:60,
      right:50,
      top:20,
      bottom:50
    }
  },
  page:{
    hitters:{},
    pitchers:{}
  },
  getPageComponents:function(set){
    this.page[set].div = d3.select('#'+set);
    this.page[set].svg = this.page[set].div.select('.svgContain').append('svg')
      .attr('height',this.svgAtt.height).attr('width',this.svgAtt.width);
    this.page[set].fieldInput = this.page[set].div.select('.clicker');
    this.page[set].timeInput = this.page[set].div.selectAll('input.time');
    this.page[set].statsInput = this.page[set].div.selectAll('input.stats');
    this.page[set].displayName = this.page[set].div.select('.dispName');
    this.page[set].compName = this.page[set].div.select('.compName');

    this.page[set].xScale = d3.scale.linear()
      .range([this.svgAtt.margins.left,this.svgAtt.width-this.svgAtt.margins.right]);
    this.page[set].xScale_inv = d3.scale.linear()
      .domain([this.svgAtt.margins.left,this.svgAtt.width-this.svgAtt.margins.right]);
    this.page[set].yScale = d3.scale.linear()
      .range([(this.svgAtt.height-this.svgAtt.margins.bottom),this.svgAtt.margins.top]);

    this.page[set].xAxis = this.page[set].svg.append('svg:g').attr('class','xaxis')
      .attr('transform','translate(0,'+(this.svgAtt.height-this.svgAtt.margins.bottom)+')');
    this.page[set].yAxis = this.page[set].svg.append('svg:g').attr('class','yaxis')
      .attr('transform','translate('+(this.svgAtt.margins.left)+',0)');

    this.page[set].xAxisLabel = this.page[set].svg.append('text').attr('class','axisTitle')
      .attr('transform','translate('+(this.svgAtt.width/2)+','+(this.svgAtt.height-10)+')');
    this.page[set].yAxisLabel = this.page[set].svg.append('text').attr('class','axisTitle')
      .attr('transform','translate('+(20)+','+(this.svgAtt.height/2)+')rotate(-90)');

    this.svgAtt.lineFx = d3.svg.line().interpolate('cardinal');
    this.page.xAxis = d3.svg.axis().orient('bottom').tickFormat(d3.format('d'));
    this.page.yAxis = d3.svg.axis().orient('left');
  },
  buildTooltip:function(set){
    this.page[set].tooltip = this.page[set].svg.append('g')
      .attr('class','tooltip').style('visibility','hidden');
    this.page[set].tooltip.append('line').attr('x1',0).attr('x2',0)
      .style('stroke','black').style('stroke-width',1);
    this.page[set].tooltip.append('circle').attr('r',20).attr('class','mainC');
    this.page[set].tooltip.append('circle').attr('r',3.5).attr('class','lineC');
    this.page[set].tooltip.append('text').attr('dy',8);
  },
  playerData:{
    hitters:[],
    pitchers:[]
  },
  getData:function(set){
    var that = this;
    var data = this.playerData[set];
    for (var i=0;i<10;i++){
      d3.csv('data/'+set+'/player'+i+'.csv')
        .row(function(d) {
          var da;
          if (set == 'hitters'){
            da = {
              player:d.Player,team:d.Tm,year:+d.Year,hits:+d.H,doubles:+d['2B'],triples:+d['3B'],RBI:+d.RBI,HR:+d.HR,runs:+d.R,TB:+d.TB,AB:+d.AB,slug:+d.SLG,BA:+d.BA,BB:+d.BB,IBB:+d.IBB,SB:+d.SB,CS:+d.CS,K:+d.SO,G:+d.G,OPS:+d.OPS,WAR:+d.WAR
            }
          }else{
            da = {
              player:d.Player,team:d.Tm,year:+d.Year,wins:+d.W,losses:+d.L,ERA:+d.ERA,hits:+d.H,IP:+d.IP,ER:+d.ER,HR:+d.HR,K:+d.SO,WHIP:+d.WHIP,H9:+d.H9,BB:+d.BB,IBB:+d.IBB,HR9:+d.HR9,BB9:+d.BB9,K9:+d.SO9,KpW:+d['SO/W'],WAR:+d.WAR
            }
          }
          return da;
        })
        .get(function(error, rows) {
          var cumulative = JSON.parse(JSON.stringify(rows));
          var playerData = {seasonal:rows,cumulative:cumulative};
          data.push(playerData);
          if (data.length === 10){
            that.makeChart(that.formatData(set),set);
          }
        });
    }
  },
  formatData(set){
    var that = this;
    var data = this.playerData[set];
    this.makeButtons(data,that,set);
    this.calculateCumulative(data,that,set);
    return data;
  },
  makeChart:function(data,set){
    this.page[set].players = this.page[set].svg.selectAll('.player').data(data).enter().append('g')
      .attr('class', function(d){return 'player '+d.player});
    this.page[set].lines = this.page[set].players.append('path')
    this.changeChart(set);
    this.buildTooltip(set);
  },
  changeChart:function(set){
    var field = this.getField(set);
    var stats = this.getStats(set);
    var time = this.getTime(set);

    var xLabel = (time=='time')?'Year':'Career Season';
    var yLabel = this.page[set].fieldInput.select('[value='+field+']').text();

    var y = this.getYdomain(set,stats,field);
    var x = this.getXdomain(set,time);

    var yAxis = this.page.yAxis.scale(y);//.tickFormat(d3.format('s'));
    var xAxis = this.page.xAxis.scale(x);

    var sFields = ['hits','RBI','runs', 'K','ER'];
    if (sFields.indexOf(field)!== -1){
      yAxis.tickFormat(d3.format('s'));
    }else{
      yAxis.tickFormat(null);
    }

    var lineFx = this.svgAtt.lineFx
      .defined(function(d) {return (d[field]/1 || d[field]==0);})
      .y(function(d) {return y(d[field])})
      .x(function(d,i) {return x((time=='career')?i+1:d.year)})

    this.page[set].svg.selectAll('.player').select('path')
      .transition().duration(500).attr('d', function(d){return lineFx(d[stats])});

    this.page[set].div.select('.yaxis').transition().duration(500).call(yAxis);
    this.page[set].div.select('.xaxis').transition().duration(500).call(xAxis);

    this.page[set].xAxisLabel.text(xLabel);
    this.page[set].yAxisLabel.text(yLabel);

  },
  getSelectedPlayer:function(set){
    var player;
    var clicked = this.page[set].div.select('.clicked');
    if (clicked[0][0]){
      player = clicked.attr('player');
    }
    return player;
  },
  getXdomain:function(set,time){
    var player = this.getSelectedPlayer(set);
    var min,max;
    if (player){
      this.page[set].svg.select('g.player.'+player).each(function(d){
        if (time == 'career'){
          min = 0;
          max = d.seasonal.length;
        }else{
          min = d.seasonal[0].year - 1;//just to give a little buffer on the left side
          max = d.seasonal[d.seasonal.length-1].year;
        }
      })
    }else{
      if (time == 'career'){
        min = 0;
        max = d3.max(this.playerData[set], function(d){return d.seasonal.length});
      }else{
        min = d3.min(this.playerData[set], function(d) {return d.seasonal[0].year;});
        max = d3.max(this.playerData[set], function(d) {return d.seasonal[d.seasonal.length-1].year;});
      }
    }
    var x = this.page[set].xScale.domain([min,max]);
    this.page[set].xScale_inv.range([min,max]);
    return x;
  },
  getYdomain:function(set,stats,field){
    var fieldMax = d3.max(this.playerData[set], function(d) {
      return d3.max(d[stats], function(e){
        return e[field];
      });
    });
    if (field == 'WAR'){
      var fieldMin = d3.min(this.playerData[set], function(d) {
        return d3.min(d[stats], function(e){
          return e[field];
        });
      });
    }else{
      var fieldMin = 0;
    }
    var y = this.page[set].yScale.domain([fieldMin,fieldMax]);
    return y;
  },
  getField:function(set){
    return this.page[set].div.select('.clicker').node().value;
  },
  getStats:function(set){
    return this.page[set].div.select('input.stats:checked').node().value;
  },
  getTime:function(set){
    return this.page[set].div.select('input.time:checked').node().value;
  },
  bindPlayerButtonsMouse:function(set){
    var that = this;
    this.page[set].div.selectAll('.playerBtn')
      .on('mouseover',function(){
        var player = d3.select(this).attr('player');
        that.buttonHover(player,set);
      })
      .on('mousemove',function(){
        var player = d3.select(this).attr('player');
        that.buttonHover(player,set);
      })
      .on('mouseout',function(){
        that.chartReset(set);
      });
  },
  makeButtons(data,that,set){
    data.forEach(function(dp){
      var guy = dp.seasonal[0].player;
      dp.player = guy;
      var name = guy.replace('_',' ');
      dp.display = name;
      var btn = that.page[set].div.select('.playerList').append('div')
        .attr('class','playerBtn').attr('player',guy)
        .on('click',function(){
          var clicked = d3.select(this).attr('class').split(" ")[1];
          var clickedBtn = that.page[set].div.select('.clicked')[0][0];
          var compareBtn = that.page[set].div.select('.compare')[0][0];
          //this is an ugly function, works in a pinch
          if (clicked=='clicked'){
            if (compareBtn){
              var comparePlayer = that.page[set].div.select('.playerBtn.compare').attr('player');
              that.page[set].svg.selectAll('g.'+comparePlayer).style('opacity',0.05)
                .selectAll('path').style('stroke','black');
            }
            that.page[set].compName.text('');
            that.page[set].compName.style('display','none');
            that.page[set].timeInput[0][0].disabled=false;
            that.page[set].div.selectAll('.playerBtn').attr('class','playerBtn');
            that.changeChart(set);
            that.bindPlayerButtonsMouse(set);
            that.page[set].svg.on('mousemove',null).on('mouseover',null).on('mouseout',null);
            return;
          }
          if (clicked=='compare'){
            that.page[set].timeInput[0][0].disabled=false;
            d3.select(this).attr('class','playerBtn');
            that.page[set].svg.select('g.'+guy).style('opacity',0.05)
              .selectAll('path').style('stroke','black');
            that.page[set].compName.text('');
            that.page[set].compName.style('display','none');
            return;
          }
          if (clickedBtn && !compareBtn){
            d3.select(this).attr('class','playerBtn compare');
            that.page[set].svg.selectAll('g.'+guy).style('opacity',0.55)
              .selectAll('path').style('stroke','red');
            that.page[set].compName.text(guy.replace("_"," "));
            that.page[set].compName.style('display','block');
            //wonky force layout to career compare
          that.page[set].timeInput[0][0].disabled=true;
            that.page[set].timeInput[0][1].click();
          }
          if (compareBtn){
            var comparePlayer = that.page[set].div.select('.playerBtn.compare').attr('player');
            that.page[set].svg.selectAll('g.'+comparePlayer).style('opacity',0.05)
              .selectAll('path').style('stroke','black');
            that.page[set].div.selectAll('.playerBtn.compare').attr('class','playerBtn');
            d3.select(this).attr('class','playerBtn compare');
            that.page[set].svg.selectAll('g.'+guy).style('opacity',0.55)
              .selectAll('path').style('stroke','red');
            that.page[set].compName.text(guy.replace("_"," "));
            //wonky force layout to career compare
            that.page[set].timeInput[0][0].disabled=true;
            that.page[set].timeInput[0][1].click();
          }
          if (!clickedBtn && !compareBtn){
            that.page[set].timeInput[0][0].disabled=false;
            that.page[set].div.selectAll('.playerBtn').attr('class','playerBtn');
            d3.select(this).attr('class','playerBtn clicked');
            that.buttonHover(guy,set);
            that.page[set].div.selectAll('.playerBtn')
              .on('mouseover',null).on('mousemove',null).on('mouseout',null);
            that.changeChart(set);
            that.page[set].svg
              .on('mouseover',function(){
                that.toolHov(guy,set);
              })
              .on('mousemove',function(){
                that.toolHov(guy,set);
              })
              .on('mouseout',function(){
                that.toolUnhov(set);
              })
            }
          });
      btn.append('img').attr("src",'images/'+guy+'.png').attr('alt',guy);
      btn.append('p').text(name);
    })
    that.bindPlayerButtonsMouse(set);
  },
  buttonHover: function(player,set){
     this.page[set].div.selectAll('g.player').style('opacity',0.05);
     this.page[set].div.selectAll('g.player.'+player).style('opacity',1);
     this.page[set].displayName.text(player.replace("_"," "));
  },
  chartReset: function(set){
    this.page[set].div.selectAll('.playerBtn').attr('class','playerBtn');
    this.page[set].div.selectAll('g.player').style('opacity',0.6);
    this.page[set].displayName.text('');
  },
  toolHov: function(player,set){
    var field = this.getField(set);
    var time = this.getTime(set);
    var stats = this.getStats(set);
    var data = this.playerData[set].filter(function(b){return b.player == player})[0];

    var left = d3.event.offsetX;
    var year = d3.round(this.page[set].xScale_inv(left),0);
    var top = d3.event.offsetY;
    var dispYear = (time=='time')?year:(year==1)?'R':'y'+year;

    var xLeft = this.page[set].xScale(year);
    var yData = (time == 'time')?data[stats].filter(function(b){return b.year == year})[0]:
      data[stats][year-1];

    if (yData){
      var team = yData.team.split(",");
      var teamInfo = palette[team[0]];
      if (!teamInfo){
        return;
      }
      var teamName = dispYear + ' - ' + teamInfo.name;
      if (team.length>1){
        teamName += ' and ' + palette[team[1]].name;
      }

      this.page[set].div.select('.teamName').text(teamName);
      var yTop = this.page[set].yScale(yData[field]);
      var mid = this.page[set].yScale.domain()[1]/2;
      cTop = (yData[field]>mid)?100:-100;
      if (yTop){
        this.page[set].tooltip.style('visibility','visible')
          .attr('transform','translate('+xLeft+','+yTop+')');
        this.page[set].tooltip.selectAll('*').attr('transform','translate(0,'+cTop+')');
        this.page[set].tooltip.select('line').attr('y1',0).attr('y2',cTop*(-1))
        this.page[set].tooltip.select('.mainC')
          .style('fill',teamInfo.fill).style('stroke',teamInfo.stroke)
          .attr('transform','translate(0,'+cTop+')');
        this.page[set].tooltip.select('.lineC').attr('transform','translate(0,0)');
      }
      var dataDisp = d3.round(yData[field],3);
      if (yData[field]/1 || yData[field] == 0){
        this.page[set].tooltip.select('text').text(dataDisp)
          .style('fill',teamInfo.text);
      }
    }else{
      this.page[set].tooltip.style('visibility','hidden')
    }
  },
  toolUnhov: function(set){
    this.page[set].tooltip.style('visibility','hidden');
    this.page[set].div.select('.teamName').text('');
  },
  calculateCumulative(data,that,set){
    data.forEach(function(dp){
      var cumulative = dp.cumulative;
      if (set == 'hitters'){
        var hits=0,doubles=0,triples=0,RBI=0,HR=0,R=0,AB=0,TB=0,OPS=0,WAR=0;
        for (var b=0;b<cumulative.length;b++){
          var thisData = cumulative[b];
          //do this to preserve breaks for missed seasons; could also remove record, but would then
          //have to loop through backwards and search for nulls
          if (typeof thisData.hits !== 'number'){
            thisData.hits = 'null';
            thisData.doubles = 'null';
            thisData.triples = 'null';
            thisData.RBI = 'null';
            thisData.HR = 'null';
            thisData.runs = 'null';
            thisData.BA = 'null';
            thisData.slug = 'null';
            thisData.OPS = 'null';
            thisData.WAR = 'null';
            continue;
          }
          hits += thisData.hits;
          doubles += thisData.doubles;
          triples += thisData.triples;
          RBI += thisData.RBI;
          HR += thisData.HR;
          R += thisData.runs;
          AB += thisData.AB;
          TB += thisData.TB;
          OPS += thisData.OPS;
          WAR += thisData.WAR;
          thisData.hits = hits;
          thisData.doubles = doubles;
          thisData.triples = triples;
          thisData.RBI = RBI;
          thisData.HR = HR;
          thisData.runs = R;
          thisData.AB = AB;
          thisData.BA = (hits/AB);
          thisData.slug = (TB/AB);
          thisData.OPS = OPS/(b+1);
          thisData.WAR = WAR;
        }
      }else{
        var hits=0,wins=0,losses=0,K=0,HR=0,ER=0,BB=0,IP=0,WAR=0;
        for (var b=0;b<cumulative.length;b++){
          var thisData = cumulative[b];
          hits += thisData.hits;
          wins += thisData.wins;
          losses += thisData.losses;
          K += thisData.K;
          HR += thisData.HR;
          ER += thisData.ER;
          BB += thisData.BB;
          IP += thisData.IP;
          WAR += thisData.WAR;
          thisData.hits = hits;
          thisData.wins = wins;
          thisData.losses = losses;
          thisData.K = K;
          thisData.HR = HR;
          thisData.ER = ER;
          thisData.BB = BB;
          thisData.ERA = 9*(ER/IP);
          thisData.WHIP = (BB+hits)/IP;
          thisData.WAR = WAR;
        }
      }
    })
  },
  bindEvents:function(set){
    var that = this;
    this.page[set].fieldInput.on('change',function(){
      that.changeChart(set);
    });
    this.page[set].timeInput.on('change',function(){
      that.changeChart(set);
    });
    this.page[set].statsInput.on('change',function(){
      that.changeChart(set);
    });
  },
  initViz:function(){
    this.getPageComponents('hitters');
    this.getData('hitters');
    this.bindEvents('hitters');

    this.getPageComponents('pitchers');
    this.getData('pitchers');
    this.bindEvents('pitchers');
  }
}
mlb.initViz();
