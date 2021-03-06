"use strict";

var schoolID = getURLParameter("schoolID");
var studentID = getURLParameter("studentID");
var typeID = getURLParameter("typeID") || getURLParameter("reportType");
var speed = getURLParameter("speed") || 1000;

var longWest = -119.754263;
var longEast = -119.736166;
var longDiff = Math.abs(longWest - longEast);
var latNorth = 36.81675;
var latSouth = 36.808592;
var latDiff = Math.abs(latNorth - latSouth);
var reportMode = "me";
var userBuildingID = null;

var mapWidth = 2200;
var mapHeight = 1700;

var svgNS = "http://www.w3.org/2000/svg";
var svg = {};

var opacity = 1;

function initSVG() {
  svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 " + mapWidth + " " + mapHeight);
  // lawn
  var grass = document.createElementNS(svgNS, "polygon");
  grass.setAttribute(
    "points",
    "0,0 " + mapWidth + ",0 " + mapWidth + "," + mapHeight + " 0," + mapHeight
  );
  grass.setAttribute("style", "fill:#006600;stroke:#006600;stroke-width:1;");
  svg.appendChild(grass);
}

function getURLParameter(name) {
  return (
    decodeURIComponent(
      (new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(
        location.search
      ) || [null, ""])[1].replace(/\+/g, "%20")
    ) || null
  );
}

var getJSON = function(url, callback) {
  if (typeof url !== "undefined" && url.includes("https")) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "json";
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
  }
};

function sendReport(_buildingID) {

  let shooterBuildingID = null;

  if (reportMode === "me") {
    userBuildingID = _buildingID;
  }
  else {
    shooterBuildingID = _buildingID;
  }

  var reportURL =
    "https://fast.esns.life/sendreport.php?schoolID=" +
    schoolID +
    "&perpBuildingID=" +
    shooterBuildingID +
    "&userBuildingID=" +
    userBuildingID +
    "&typeID=" +
    typeID +
    "&studentID=" +
    studentID +
    "&redirect=" +
    0;

  getJSON(reportURL, function(err, data) {
    if (err !== null) {
      alert("Something went wrong: " + err);
    } else {
      console.log("Report submitted: " + schoolID + " at " + _buildingID);
    }
  });
}

function drawCircleFromLatLong(x, y, radius) {
  createCircle(x, y, radius * 5);
}

function getCircleColor(radius) {
  if (radius >= 100) {
    return "red";
  } else if (radius >= 50) {
    return "orange";
  } else {
    return "yellow";
  }
}

function minRadius(radius) {
  if (radius < 20) {
    return 20;
  }
  return radius;
}

function createCircle(x, y, radius) {
  var myCircle = document.createElementNS(svgNS, "circle");
  myCircle.setAttribute("cx", x);
  myCircle.setAttribute("cy", y);
  myCircle.setAttribute("r", minRadius(radius));
  myCircle.setAttribute("stroke", "black");
  myCircle.setAttribute("fill-opacity", "0.5");
  myCircle.setAttribute("fill", getCircleColor(radius));
  svg.appendChild(myCircle);
}

function createPoly(bgcolor, _points, buildingID) {
  var link = document.createElementNS("http://www.w3.org/2000/svg", "a");
  link.setAttribute("xlink:href", "#");
  link.setAttribute("onclick", "sendReport(" + buildingID + ")");
  svg.appendChild(link);

  var myPoly = document.createElementNS(svgNS, "polygon");
  myPoly.setAttribute("points", _points);
  myPoly.setAttribute(
    "style",
    "fill:" + bgcolor + ";stroke:black;stroke-width:1;fill-opacity:" + opacity
  );
  link.appendChild(myPoly);
}

var alreadyChecking = false;

function checkReports() {
  alreadyChecking = true;
  getJSON(
    "https://fast.esns.life/services/getcompiledreportsfast_api.php?schoolID=" +
      schoolID,
    function(err, data) {
      if (err !== null) {
        alert("Something went wrong: " + err);
      } else {
        initSVG();
        if (typeof data[0] !== "undefined") {
          initSVG();
          // we draw the buildings below...
          opacity = 1;
          drawBuildings();

          // ... the circles ..
          for (var i = 0; i < data.length; i++) {
            drawCircleFromLatLong(data[i].x, data[i].y, data[i].c);
          }
          // ..and above
          opacity = 0;
          drawBuildings();
          drawMap();
        } else {
          opacity = 1;
          drawBuildings();
          drawMap();
          console.log("No data");
        }

        alreadyChecking = false;
      }
    }
  );
}

function drawMap() {
  //var html = document.body.innerHTML;
  //var newHTML = html;

  var XMLS = new XMLSerializer();
  var svgStr = XMLS.serializeToString(svg);
  var svgStr2 = svgStr.replace(/ns\d+:/g, "");
  svgStr2 = svgStr2.replace(/:ns188284/g, "");
  //document.body.innerHTML = newHTML;

  document.getElementById("mapcontainer").innerHTML = svgStr2;
}

function drawBuildings() {
  var points = "";

  // w = width h = height - these are corners of the buildings
  for (var i = 0; i < buildings.length; i++) {
    points += buildings[i].w + "," + buildings[i].h + " ";

    // end poly e== 1 means endpoint
    if (buildings[i].e === "1") {
      createPoly("#d9d9d9", points, buildings[i].b);
      points = "";
    }
  }
}

var buildings = {};

// default run mode
getJSON(
  "https://fast.esns.life/services/getallstructuredimensions_api.php?schoolID=" +
    schoolID,
  function(err, data) {
    if (err !== null) {
      alert("Something went wrong: " + err);
    } else {
      buildings = data;
      checkReports();
      var gatherReports = setInterval(checkReports, speed);
    }
  }
);
