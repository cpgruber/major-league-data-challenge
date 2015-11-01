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
  }
  page:{},
  getPageComponents:function(){
    this.page.hitDiv = d3.select('#hitting');
    this.page.pitchDiv = d3.select('#pitching');
    this.page.hitSvg = this.page.hitDiv.append('svg')
      .attr('height',this.svgAtt.height).attr('width',this.svgAtt.width);
    this.page.pitchSvg = this.page.pitchDiv.append('svg')
      .attr('height',this.svgAtt.height).attr('width',this.svgAtt.width);

    this.page.hitTip = this.page.hitSvg.append('g').style('visibility','hidden');
    this.page.hitTip.append('line').attr('x1',0).attr('x2',0).style('stroke-width',1).style('stroke','black');
    this.page.hitTip.append('circle').attr('r',15).attr('fill','white');
    this.page.hitTip.append('text').attr('text-anchor','middle').attr('dy',7.5);

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
            that.makeChart(set);
          }
        })
    }
  },
  makeChart(set){
    var that = this;
    var data = this.playerData[set];
    this.makeButtons(data,that);
    this.calculateCumulative(data,that);
  },
  makeButtons(data,that){
    data.forEach(function(dp){
      var guy = dp.seasonal[0].player;
      dp.player = guy;
      var name = guy.replace('_',' ');
      dp.display = name;
      var btn = that.page.hitDiv.select('.playerList').append('div')
        .attr('class','playerBtn').attr('player',guy);
      btn.append('img').attr("src",'images/'+guy+'.png').attr('alt',guy);
      btn.append('p').text(name);
    })
  },
  calculateCumulative(data,that){
    data.forEach(function(dp){
      var cumulative = dp.cumulative;
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
    })
  }
}
mlb.getPageComponents();



// });
