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
    // this.page.hitSvg = this.page.hitDiv.append('svg')
    //   .attr('height',this.svgAtt.height).attr('width',this.svgAtt.width);
    // this.page.pitchSvg = this.page.pitchDiv.append('svg')
    //   .attr('height',this.svgAtt.height).attr('width',this.svgAtt.width);
  }
}
mlb.getPageComponents();



// });
