var mlb = {
  svgAtt:{
    width:parseFloat(d3.select('.svgContain').style('width')),
    height:500,
    margins:{
      left:50,
      right:50,
      top:20,
      bottom:20
    }
  },
  buildScales:function(){
    this.svgAtt.xScale = d3.scale.linear()
      .range([this.svgAtt.margins.left,this.svgAtt.width-this.svgAtt.margins.right]);
    this.svgAtt.xScale_inv = d3.scale.linear()
      .domain([this.svgAtt.margins.left,this.svgAtt.width-this.svgAtt.margins.right]);
    this.svgAtt.yScale = d3.scale.linear()
      .range([(this.svgAtt.height-this.svgAtt.margins.bottom),this.svgAtt.margins.top]);
    this.svgAtt.lineFx = d3.svg.line().interpolate('linear');
    this.page.xAxis = d3.svg.axis().orient('bottom').tickFormat(d3.format('d'));
    this.page.yAxis = d3.svg.axis().orient('left');
  },
  page:{
    hitters:{},
    pitchers:{}
  },
  getPageComponents:function(set){
    this.page[set].div = d3.select('#'+set);
    this.page[set].svg = this.page[set].div.select('.svgContain').append('svg')
      .attr('height',this.svgAtt.height).attr('width',this.svgAtt.width);
    this.page[set].fieldInput = this.page[set].div.select('#clicker');
    this.page[set].timeInput = this.page[set].div.selectAll('input.time');
    this.page[set].statsInput = this.page[set].div.selectAll('input.stats');

    this.page[set].xAxis = this.page[set].svg.append('svg:g').attr('class','xaxis')
      .attr('transform','translate(0,'+(this.svgAtt.height-this.svgAtt.margins.bottom)+')');
    this.page[set].yAxis = this.page[set].svg.append('svg:g').attr('class','yaxis')
      .attr('transform','translate('+(this.svgAtt.margins.left)+',0)');

    this.buildScales();
  },
  playerData:{
    hitters:[],
    pitchers:[]
  },
  getData:function(set){
    var that = this;
    var data = this.playerData[set];
    for (var i=0;i<10;i++){
      d3.csv(set+'/player'+i+'.csv')
        .row(function(d) {
          var da;
          if (set == 'hitters'){
            da = {
              player:d.Player,year:+d.Year,hits:+d.H,doubles:+d['2B'],triples:+d['3B'],RBI:+d.RBI,HR:+d.HR,runs:+d.R,
              TB:+d.TB,AB:+d.AB,slug:+d.SLG,BA:+d.BA,BB:+d.BB,IBB:+d.IBB,SB:+d.SB,CS:+d.CS,K:+d.SO,G:+d.G,OPS:+d.OPS
            }
          }else{
            da = {
              player:d.Player,year:+d.Year,wins:+d.W,losses:+d.L,ERA:+d.ERA,hits:+d.H,IP:+d.IP,ER:+d.ER,HR:+d.HR,K:+d.SO,
              WHIP:+d.WHIP,H9:+d.H9,BB:+d.BB,IBB:+d.IBB,HR9:+d.HR9,BB9:+d.BB9,K9:+d.SO9,KpW:+d['SO/W']
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
    this.calculateCumulative(data,that);
    return data;
  },
  makeChart:function(data,set){
    this.page[set].players = this.page[set].svg.selectAll('.player').data(data).enter().append('g')
      .attr('class', function(d){return 'player '+d.player});
    this.page[set].lines = this.page[set].players.append('path')
      .style('fill','none').style('stroke-width',3).style('stroke-opacity',0.5).style('stroke','green');
    this.changeChart(set);
  },
  changeChart:function(set){
    var field = this.getField(set);
    var stats = this.getStats(set);
    var time = this.getTime(set);

    var y = this.getYdomain(set,stats,field);
    var x = this.getXdomain(set,time);

    var yAxis = this.page.yAxis.scale(y);
    var xAxis = this.page.xAxis.scale(x);

    var lineFx = this.svgAtt.lineFx
      .defined(function(d) { return d[field] >= 0; })
      .y(function(d) {return y(d[field])})
      .x(function(d,i) {return x((time=='career')?i:d.year)})

    this.page[set].svg.selectAll('.player').select('path')
      .transition().duration(500).attr('d', function(d){return lineFx(d[stats])});

    this.page[set].div.select('.yaxis').transition().duration(500).call(yAxis);
    this.page[set].div.select('.xaxis').transition().duration(500).call(xAxis);
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
          min = 1;
          max = d.seasonal.length;
        }else{
          min = d.seasonal[0].year;
          max = d.seasonal[d.seasonal.length-1].year;
        }
      })
    }else{
      if (time == 'career'){
        min = 1;
        max = d3.max(this.playerData[set], function(d){return d.seasonal.length});
      }else{
        min = d3.min(this.playerData[set], function(d) {return d.seasonal[0].year;});
        max = d3.max(this.playerData[set], function(d) {return d.seasonal[d.seasonal.length-1].year;});
      }
    }
    var x = this.svgAtt.xScale.domain([min,max]);
    this.svgAtt.xScale_inv.range([min,max]);
    return x;
  },
  getYdomain:function(set,stats,field){
    var fieldMax = d3.max(this.playerData[set], function(d) {
      return d3.max(d[stats], function(e){
        return e[field];
      });
    });
    var y = this.svgAtt.yScale.domain([0,fieldMax]);
    return y;
  },
  getField:function(set){
    return this.page[set].div.select('#clicker').node().value;
  },
  getStats:function(set){
    return this.page[set].div.select('input.stats:checked').node().value;
  },
  getTime:function(set){
    return this.page[set].div.select('input.time:checked').node().value;
  },
  makeButtons(data,that,set){
    data.forEach(function(dp){
      var guy = dp.seasonal[0].player;
      dp.player = guy;
      var name = guy.replace('_',' ');
      dp.display = name;
      var btn = that.page[set].div.select('.playerList').append('div')
        .attr('class','playerBtn').attr('player',guy)
        //perhaps move this to bind events?
        .on('mouseover',function(){
          var player = d3.select(this).attr('player');
          that.buttonHover(player,set);
        })
        .on('mousemove',function(){
          var player = d3.select(this).attr('player');
          that.buttonHover(player,set);
        })
        .on('click',function(){
          var clicked = d3.select(this).attr('class').split(" ")[1];
          if (clicked){
            d3.select(this).attr('class','playerBtn');
            that.changeChart(set);
            return;
          }
          //that.page[set].clicked = classes[0];
          that.page[set].div.selectAll('.playerBtn').attr('class','playerBtn');
          d3.select(this).attr('class','playerBtn clicked');
          that.page[set].div.selectAll('.playerBtn')
            .on('mouseover',null).on('mousemove',null).on('mouseout',null);
          that.changeChart(set);
        })
        .on('mouseout',function(){
          that.chartReset(set);
        });
      btn.append('img').attr("src",'images/'+guy+'.png').attr('alt',guy);
      btn.append('p').text(name);
    })
  },
  buttonHover: function(player,set){
     this.page[set].div.selectAll('g.player').style('opacity',0.1);
     this.page[set].div.selectAll('g.player.'+player).style('opacity',1);
  },
  chartReset: function(set){
    this.page[set].div.selectAll('.playerBtn').attr('class','playerBtn');
    this.page[set].div.selectAll('g.player').style('opacity',1);
  },
  // clickPlayer: function(player,set){
  //
  // },
  // toolHov: function(){
  //   var player = hitDiv.select('.playerBtn.clicked').attr('player');
  //   var data = hitData.filter(function(b){return b.player == player})[0];
  //   var field = hitDiv.select('#clicker').node().value;
  //   var time = hitDiv.select('input[name="optradio1"]:checked').node().value;
  //   var set  = hitDiv.select('input[name="optradio2"]:checked').node().value;
  //
  //   var left = d3.event.offsetX;
  //   var year = d3.round(xInv(left),0);
  //   var top = d3.event.offsetY;
  //
  //   var xLeft = x(year);
  //   var yData = (time == 'time')?data[set].filter(function(b){return b.year == year})[0]:
  //   data[set][year-1];
  //
  //   if (yData){
  //     var yTop = y(yData[field]);
  //     var mid = y.domain()[1]/2;
  //     cTop = (yData[field]>mid)?100:-100;
  //     //y2 = (yData[field]>mid)?100:-100;
  //     if (yTop){
  //       hitTip.style('visibility','visible')
  //         .attr('transform','translate('+xLeft+','+yTop+')');
  //       hitTip.selectAll('*').attr('transform','translate(0,'+cTop+')');
  //       hitTip.select('line').attr('y1',0).attr('y2',cTop*(-1))
  //       //hitTip.select('circle').attr('transform','translate(0,'+cTop+')');
  //     }
  //     //hitTip.select('line').attr('y1',yTop).attr('y2',y(yData[field]))
  //   }else{
  //     hitTip.style('visibility','hidden')
  //   }
  //   hitTip.select('text').text(d3.round(yData[field],3));
  // },
  // toolUnhov: function(){
  //   hitTip.style('visibility','hidden');
  // },
  calculateCumulative(data,that,set){
    data.forEach(function(dp){
      var cumulative = dp.cumulative;
      if (set == 'hitting'){
        var hits=0,doubles=0,triples=0,RBI=0,HR=0,R=0,AB=0,TB=0,OPS=0;
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
        }
      }else{
        var hits=0,wins=0,losses=0,K=0,HR=0,ER=0,BB=0,IP=0;
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
          thisData.hits = hits;
          thisData.wins = wins;
          thisData.losses = losses;
          thisData.K = K;
          thisData.HR = HR;
          thisData.ER = ER;
          thisData.BB = BB;
          thisData.ERA = 9*(ER/IP);
          thisData.WHIP = (BB+hits)/IP;
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
    // var thisDiv = this.page[set].div;
    // var thisSvg = this.page[set].svg;
    // thisDiv.selectAll('.playerBtn').on('click',function(){
    //   var clickedClasses = d3.select(this).attr('class').split(" ");
    //   //hitDiv.selectAll('g.player').on('mousemove',null).on('mouseover',null).on('mouseout',null);
    //   thisSvg.on('mousemove',null).on('mouseover',null).on('mouseout',null);
    //   if (clickedClasses.indexOf('clicked') !== -1){
    //     thisDiv.selectAll('.playerBtn').attr('class','playerBtn')
    //       .on('mouseover', function(){
    //         var player = d3.select(this).attr('player');
    //         that.buttonHover(player);
    //       })
    //       .on('mousemove', function(){
    //         var player = d3.select(this).attr('player');
    //         that.buttonHover(player);
    //       })
    //       .on('mouseout', that.chartReset);
    //       // hitTip.style('visibility','hidden');
    //       // var time  = hitDiv.select('input[name="optradio1"]:checked').node().value;
    //       // timeChange(time);
    //   }else{
    //     thisDiv.selectAll('.playerBtn').attr('class','playerBtn');
    //     d3.select(this).attr('class','playerBtn clicked');
    //     thisDiv.selectAll('.playerBtn').on('mousemove',null).on('mouseover',null).on('mouseout',null);
    //     var player = d3.select(this).attr('player');
    //     // hitTip.style('visibility','hidden');
    //     // buttonHover(player);
    //     // clickPlayer(player);
    //   }
    // });
  },
  initViz:function(){
    this.getPageComponents('hitters');
    this.getData('hitters');

    this.getPageComponents('pitchers');
    this.getData('pitchers');

    this.bindEvents('hitters');
    this.bindEvents('pitchers');

  }
}
mlb.initViz();
