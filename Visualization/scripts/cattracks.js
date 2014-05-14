d3.cattracks = function() {
  var cattracks = {},
      points = [],
      paths = {},
      width = 1400,
      height = 894,
      timeHeight = 100,
      svg = d3.select("#main").append("svg").attr("width", width).attr("height", height+timeHeight+30),
      index = 0,
      timescale = d3.time.scale(),
      duration = 1000;

  cattracks.points = function(_) {
    if (!arguments.length) return points;
    points = _;

    // create timescale
    timescale
      .domain([points[0]["time"], points[points.length-1]["time"]])
      .range([15, width-15]);

    var xAxis = d3.svg.axis()
      .scale(timescale)
      .orient("bottom");
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height+timeHeight) + ")")
      .call(xAxis);

    // mark times that have data + make them clickable
    d3.select("#main svg").selectAll("rect.valid-time")
      .data(points)
      .enter()
      .append("rect")
      .attr("class","valid-time")
      .attr("height", timeHeight + "px")
      .attr("width", "1px")
      .attr("x", function(d) {
        return timescale(d["time"]);
      })
      .attr("y", height)
      .on("click", function(d, i) {
        if (index >= points.length) {
          index = i;
          cattracks.runAnimation();
        }
        else index = i;
      });

    return cattracks;
  };

  cattracks.paths = function(_) {
    if (!arguments.length) return paths;
    paths = _;

    // append paths
    $.each(paths, function(start, obj) {
      $.each(obj, function(end, val) {
        if (end != "location") {
          d3.select("svg").append("path")
            .attr("d", val)
            .attr("id", start + "-" + end)
            .attr("stroke", "#000")
            .attr("stroke-width", 0)
            .attr("fill", "none");
        } else {
          var coords = val.split(",");
          d3.select("svg").append("text")
            .attr("x", coords[0])
            .attr("y", coords[1])
            .text(start);

          // append roundtrip path
          d3.select("svg").append("path")
            .attr("d", "m " + val + " z")
            .attr("id", start + "-" + start);
        }
      });
    });
    return cattracks;
  };

  cattracks.runAnimation = function(_) {
    // remove old
    d3.selectAll("circle.cat").remove();
    d3.select("#timeMarker").remove();

    // place time marker
    var timeMarker = svg.append("rect")
      .attr("id", "timeMarker")
      .attr("width", "5px")
      .attr("height", timeHeight)
      .attr("transform", "translate(" + timescale(points[index]["time"]) + "," + height + ")");

    // place cat markers
    var oranges = svg.append("circle")
      .attr("id", "oranges")
      .attr("class", "cat")
      .attr("r", 7)
      .attr("transform", "translate(" + paths[points[index]["oranges"]]["location"] + ")");

    var greyest = svg.append("circle")
      .attr("id", "greyest")
      .attr("class", "cat")
      .attr("r", 7)
      .attr("transform", "translate(" + paths[points[index]["greyest"]]["location"] + ")");
  
    transition();
  
    function transition() {
      index++;
      if (index >= points.length) return;

      // update time marker
      timeMarker.transition()
        .duration(duration)
        .attr("transform",  "translate(" + timescale(points[index]["time"]) + "," + height + ")");

      // update cat markers
      var pathId = "#" + points[index-1]["oranges"] + "-" + points[index]["oranges"];
      oranges.transition()
        .duration(duration)
        .attrTween("transform", translateAlong(d3.select(pathId).node()))   

      pathId = "#" + points[index-1]["greyest"] + "-" + points[index]["greyest"];
      greyest.transition()
        .duration(duration)
        .attrTween("transform", translateAlong(d3.select(pathId).node()))
        .each("end", transition); // do next transition until last timestamp
    }
    
    function translateAlong(path) {
      var l = path.getTotalLength();
      return function(i) {
        return function(t) {
          var p = path.getPointAtLength(t * l);
          return "translate(" + p.x + "," + p.y + ")"; // Move marker
        }
      }
    }
  };

  return cattracks;
};
