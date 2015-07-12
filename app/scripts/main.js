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

function zoomHandler() {
  console.log(d3.event.translate,d3.event.scale )
  d3.select(this).attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

var zoomListener = d3.behavior.zoom()
  .scaleExtent([0.2, 2])
  .on("zoom", zoomHandler);

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



    var w = 800,
      h = 600;

    window.nodes = nodes;
    window.links = links;

    //draw force



    var force = d3.layout.force()
      .nodes(nodes)
      .links(links)
      .size([1200, h])
      .linkDistance(w/4)
      .charge(-300)

    var rootGroup = d3.select(".container").append("svg:svg")
      .attr("width", w)
      .attr("height", h)
      .append('g')
      .call(zoomListener);

    var link = rootGroup.selectAll('.link')
      .data(links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('stroke-width', 1);


    var node = rootGroup.append("svg:g")
      .selectAll("circle")
      .data(force.nodes())
      .enter().append("svg:g")

    node.append('svg:circle')
      .attr("r", 24)
      .attr("stroke", '#ffffff')
      .attr("stroke-width", 2)
      .attr("class", "circle")
      .call(force.drag);

    node.append('svg:text')
      .attr("class", "label")
      .text(function(d){
        return d.name;
      })


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


      /*
       link.attr('x1', function(d) {return d.source.x; })
       .attr('y1', function(d) { return d.source.y; })
       .attr('x2', function(d) { return d.target.x; })
       .attr('y2', function(d) { return d.target.y; });
       */

      link.style('stroke',function(d){ return classifyField[d.type].lineColor})
    });

    force.start();

    window.force = force;

  })
})










