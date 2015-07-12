// jshint devel:true


var classifyField = {
  party: {
    '새누리당' : {
      color : '#da532c'
    },
    '새정치민주연합' : {
      color : '#2d89ef'
    },
    '정의당' : {
      color : '#fde396  '
    },
    '무소속' : {
      color : '#572b97'
    }
  },
  고등학교 : {
    lineColor : '#00a300'
  },
  대학교 : {
    lineColor : '#fd96b0'
  },
  대학원 : {
    lineColor : '#2b5797'
  },
  doctor : {
    lineColor : '#7e3878'
  },
  local : {

  }
}



function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}



// function for handling zoom event


$(window).ready(function(){


  $.get('./converted.txt',function(res){

    var rawData = JSON.parse(res);

    var nodes = [];
    for(var i = 0 ; i < rawData.length ; i++)
    {
      var raw = rawData[i];
      var redefineRaw = {}
      redefineRaw.name = raw.name;
      redefineRaw.id = i;//guid();
      redefineRaw.party = raw.party;
      redefineRaw.local = raw.local;

      for(var idx in raw.properties)
      {
        var property = raw.properties[idx];

        redefineRaw[property.type] = property.name;
      }
      nodes.push(redefineRaw);
    }


    //data classification
    var classifiedDataMap = {};

    for(var fieldName in classifyField)
    {
      var filter = d3.nest().key(function(d){
        return d[fieldName];
      });
      var result = filter.entries(nodes);
      result = result.filter(function(value){
        return value.key!='undefined';
      })
      classifiedDataMap[fieldName] = result;
    }


    //gen links
    var links = [];
    for(var fieldName in classifiedDataMap)
    {
      if(fieldName=='party')
        continue;

      var classifiedData = classifiedDataMap[fieldName];

      for(var idx in classifiedData)
      {
        var linkName = classifiedData[idx].key;

        var linkResources = classifiedData[idx].values;

        if(linkResources.length < 2)
          continue;

        for(var i = 0 ; i < linkResources.length ; i++)
        {
          for(var j = 0 ; j < linkResources.length ; j++)
          {
            if(i==j)
              continue;
            var link = {
              source : linkResources[i].id,
              target : linkResources[j].id,
              name : linkName,
              type : fieldName
            };

            links.push(link);
          }
        }
      }
    }

    var linkCountMap = {};
    for(var i = 0 ; i < links.length ; i++){
      var s = links[i].source;
      var tType = links[i].type;
      var t = links[i].target;

      var key = s+","+ t;

      if(linkCountMap[t+","+s])
      {
        links.splice(i,1);
        i--;
        continue;
      }

      if(!linkCountMap[key]) {
        linkCountMap[key] = []
      }

      linkCountMap[key].push(tType);
    }



    var w = 1200,
      h = 600;

    window.rawData = rawData;
    window.classifiedDataMap = classifiedDataMap;
    window.nodes = nodes;
    window.links = links;

    //draw force

    function zoomHandler() {
      d3.select(this).attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function zoomed() {
      container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    var zoomListener = d3.behavior.zoom()
      .scaleExtent([0.2, 2.4])
      .on("zoom", zoomHandler);

    var force = d3.layout.force()
      .nodes(nodes)
      .links(links)
      .size([w, h])
      .friction(0.1)
      .linkDistance(2000)
      .chargeDistance(-2000)
      .charge(-500)

    window.force = force;


    var margin = {top: -5, right: -5, bottom: -5, left: -5},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    var zoom = d3.behavior.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", zoomed);


    var svg = d3.select(".container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
      .call(zoom);

    var rect = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "#f0f0f0")
      .style("pointer-events", "all");


    var container = svg.append("g");

        var link = container
          .append('g')
          .selectAll('.link')
          .data(links)
          .enter().append('path')
          .attr('class', 'link')
          .attr('stroke-width', 1)
          .attr('id',function(d){
            return "link-"+d.source+"-"+ d.target+"-"+ d.name+"-"+ d.type ;
          });

        var node = container
          .append('g')
          .selectAll(".circle")
          .data(force.nodes())
          .enter().append("svg:g")

        node.append('svg:circle')
          .attr("r", 24)
          .attr("stroke", '#ffffff')
          .attr("stroke-width", 2)
          .attr("class", "circle")
          .attr('id',function(d){
            return "node-"+d.id;
           })
          .call(force.drag)
          .on('click',function(d){
              var nodesIds = [];
              var linkIds = [];


              var clicked = $(this).attr('clicked');




              for(var idx in links)
              {
                var link = links[idx];

                if(link.source.id == d.id || link.target.id == d.id)
                {

                  if(clicked==undefined)
                  {
                    d3.select(this)
                      .transition().duration(400)
                      .attr('r',80)
                      .attr('stroke','#fdfd96')
                      .attr('stroke-width',16);

                    container.select("circle[id^='node-"+link.target.id+"']")
                      .transition().duration(400)
                      .attr('r',80)
                      .attr('stroke','#111')
                      .attr('stroke-width',16);

                    container.select("text[id^='label-"+link.target.id+"']")
                      .transition().duration(400)
                      .style("font-size",'500%')

                    container.select("circle[id^='node-"+link.source.id+"']")
                      .transition().duration(400)
                      .attr('r',80)
                      .attr('stroke','#111')
                      .attr('stroke-width',16);

                    container.select("text[id^='label-"+link.source.id+"']")
                      .transition().duration(400)
                      .style("font-size",'500%')

                    container.select("path[id^='link-"+link.source.id+"-"+link.target.id+"']")
                      .transition().duration(400)
                      .attr('stroke-width',10)

                    container.select("path[id^='link-"+link.target.id+"-"+link.source.id+"']")
                      .transition().duration(400)
                      .attr('stroke-width',10)

                  }
                  else{
                    d3.select(this)
                      .transition().duration(400)
                      .attr('r',24)
                      .attr('stroke','#ffffff')
                      .attr("stroke-width", 2)

                    container.select("circle[id^='node-"+link.target.id+"']")
                      .transition().duration(400)
                      .attr('r',24)
                      .attr('stroke','#ffffff')
                      .attr("stroke-width", 2)

                    container.select("text[id^='label-"+link.target.id+"']")
                      .transition().duration(400)
                      .style("font-size",'75%')


                    container.select("circle[id^='node-"+link.source.id+"']")
                      .transition().duration(400)
                      .attr('r',24)
                      .attr('stroke','#ffffff')
                      .attr("stroke-width", 2)

                    container.select("text[id^='label-"+link.source.id+"']")
                      .transition().duration(400)
                      .style("font-size",'75%')

                    container.select("path[id^='link-"+link.source.id+"-"+link.target.id+"']")
                      .transition().duration(400)
                      .attr('stroke-width',1)

                    container.select("path[id^='link-"+link.target.id+"-"+link.source.id+"']")
                      .transition().duration(400)
                      .attr('stroke-width',1)



                  }

                }
              }


            if(clicked==undefined)
            {
              d3.select(this)
                .transition().duration(400)
                .attr('r',80)
                .attr('stroke','#fdfd96')
                .attr('stroke-width',16);




              container.select("text[id^='detail-"+d.id+"']")
                .transition().duration(400)
                .style("display",'block')

              container.select("text[id^='label-"+d.id+"']")
                .transition().duration(400)
                .style("font-size",'400%')

              $(this).attr('clicked',true);
            }
            else{
              d3.select(this)
                .transition().duration(400)
                .attr('r',24)
                .attr('stroke','#ffffff')
                .attr("stroke-width", 2)


              container.select("text[id^='detail-"+d.id+"']")
                .transition().duration(400)
                .style("display",'none')


              container.select("text[id^='label-"+d.id+"']")
                .transition().duration(400)
                .style("font-size",'75%')

              $(this).removeAttr('clicked');
            }



            console.log(arguments)

           });


        node.append('svg:text')
          .attr("class", "label")
          .text(function(d){
            return d.name;
          })
          .attr('id',function(d){
            return "label-"+d.id;
          });

        var detail = node.append('svg:text')
          .attr("class", "detail")
          .style('font-size',"100%")
          .style('display','none')
          .attr('id',function(d){
            return "detail-"+d.id;
          });

        detail.append('tspan')
          .attr('x',0)
          .attr('y',20)
          .text(function(d){
            var detail = "고등학교 : "+d['고등학교']

            return detail;
          })
          .attr('id',function(d){
            return "detail0-"+d.id;
          });

        detail.append('tspan')
          .attr('x',0)
          .attr('y',20*2)
          .text(function(d){
            var detail = "대학교 : "+d['대학교']+"\n"

            return detail;
          })
          .attr('id',function(d){
            return "detail1-"+d.id;
          });

        detail.append('tspan')
          .attr('x',0)
          .attr('y',20*3)
          .text(function(d){
            var detail = "대학원 : "+d['대학원']+"\n"

            return detail;
          })
          .attr('id',function(d){
            return "detail2-"+d.id;
          });




    force.on('tick', function() {

          node
            .attr('transform', function(d) { return "translate("+d.x+","+ d.y+")"; })

          node.selectAll('.circle').style('fill',function(d){
            return classifyField.party[d.party].color
          })


          link.attr('d',function(d){
            var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);

            var linkCount = linkCountMap[d.source.id + "," + d.target.id];
            var idx = 0;

            if(linkCount.length > 1)
            {
              for(var i = 0 ; i < linkCount.length ; i++)
              {

                if(linkCount[i] == d.type)
                {
                  idx = i;
                  break;
                }
              }
            }

            dr = dr/(1 + (1/(linkCount.length*2)) * ( idx + 1));

            if(linkCount.length == 1)
            {
              return "M" + d.source.x + "," + d.source.y +
                "L" + d.target.x + "," + d.target.y;
            }
            else if(idx%2==0)
            {
              return "M" + d.source.x + "," + d.source.y +
                "A" + dr + "," + dr + " 0 0 1," + d.target.x + "," + d.target.y +
                "A" + dr + "," + dr + " 0 0 0," + d.source.x + "," + d.source.y;
            }
            else{
              return "M" + d.target.x + "," + d.target.y +
                "A" + dr + "," + dr + " 0 0 1," + d.source.x + "," + d.source.y +
                "A" + dr + "," + dr + " 0 0 0," + d.target.x + "," + d.target.y;
            }
          })


            link.attr('x1', function(d) {return d.source.x; })
           .attr('y1', function(d) { return d.source.y; })
           .attr('x2', function(d) { return d.target.x; })
           .attr('y2', function(d) { return d.target.y; });

          link.style('stroke',function(d){ return classifyField[d.type].lineColor})
        });


    force.start();

    window.force = force;

  })
})










