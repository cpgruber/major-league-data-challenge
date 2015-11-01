// $(document).on('ready',function(){

var mlb = {
  svgAtt:{
    width:parseFloat(d3.select('.eight.columns').style('width')),
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
  },
  page:{
    hitters:{},
    pitchers:{}
  },
  getPageComponents:function(){
    this.page.hitters.div = d3.select('#hitting');
    this.page.pitchers.div = d3.select('#pitching');
    this.page.hitters.svg = this.page.hitters.div.append('svg')
      .attr('height',this.svgAtt.height).attr('width',this.svgAtt.width);
    this.page.pitchers.svg = this.page.pitchers.div.append('svg')
      .attr('height',this.svgAtt.height).attr('width',this.svgAtt.width);

    this.page.hitters.tip = this.page.hitters.svg.append('g').style('visibility','hidden');
    this.page.hitters.tip.append('line').attr('x1',0).attr('x2',0).style('stroke-width',1).style('stroke','black');
    this.page.hitters.tip.append('circle').attr('r',15).attr('fill','white');
    this.page.hitters.tip.append('text').attr('text-anchor','middle').attr('dy',7.5);

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
  makeChart(data,set){
    var players = this.page[set].svg.selectAll('.player').data(data).enter().append('g')
      .attr('class', function(d){return 'player '+d.player});
    var lines = players.append('path')
      .style('fill','none').style('stroke-width',3).style('stroke-opacity',0.5).style('stroke','green');
  },
  makeButtons(data,that,set){
    data.forEach(function(dp){
      var guy = dp.seasonal[0].player;
      dp.player = guy;
      var name = guy.replace('_',' ');
      dp.display = name;
      var btn = that.page[set].div.select('.playerList').append('div')
        .attr('class','playerBtn').attr('player',guy);
      btn.append('img').attr("src",'images/'+guy+'.png').attr('alt',guy);
      btn.append('p').text(name);
    })
  },
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
  }
}
mlb.getPageComponents();
mlb.getData('hitters');
mlb.getData('pitchers');



// });
