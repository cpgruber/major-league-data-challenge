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
  },
  playerData:{
    hitters:[],
    pitchers:[]
  },
  dataTemplates:{
    hitters:function(d){
      return {
        player:d.Player,year:+d.Year,hits:+d.H,doubles:+d['2B'],triples:+d['3B'],RBI:+d.RBI,HR:+d.HR,runs:+d.R,
        TB:+d.TB,AB:+d.AB,slug:+d.SLG,BA:+d.BA,BB:+d.BB,IBB:+d.IBB,SB:+d.SB,CS:+d.CS,K:+d.SO,G:+d.G,OPS:+d.OPS
      }
    },
    pitchers:function(d){
      return {
        player:d.Player,year:+d.Year,wins:+d.W,losses:+d.L,ERA:+d.ERA,hits:+d.H,IP:+d.IP,ER:+d.ER,HR:+d.HR,K:+d.SO,
        WHIP:+d.WHIP,H9:+d.H9,BB:+d.BB,IBB:+d.IBB,HR9:+d.HR9,BB9:+d.BB9,K9:+d.SO9,KpW:+d['SO/W']
      }
    }
  },
  getData:function(set){
    var that = this;
    var data = this.playerData[set];
    for (var i=0;i<10;i++){
      d3.csv(set+'/player'+i+'.csv')
        .row(function(d) {
          return that.dataTemplates[set];
        })
        .get(function(error, rows) {
          var cumulative = JSON.parse(JSON.stringify(rows));
          var playerData = {seasonal:rows,cumulative:cumulative};
          data.push(playerData);
          if (data.length === 10){
            console.log(data);
            //makeHitters();
            //makeChart()
          }
        })
    }
  }
}
mlb.getPageComponents();



// });
