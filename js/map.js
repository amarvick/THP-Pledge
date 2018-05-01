$( document ).ready(()=> {
 
var map = L.map('map', { zoomSnap: 0.1, zoomControl: false});
map.dragging.disable();
map.doubleClickZoom.disable();
setDefaultZoom();
// Add zoom to top right
L.control.zoom({position:'topright'}).addTo(map);

var tileLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  minZoom: 4.5,
  maxZoom: 19
});
var districtLayer = new L.GeoJSON.AJAX("data/districts.geojson");
var stateLayer = new L.GeoJSON.AJAX("data/states.geojson");
tileLayer.addTo(map);
stateLayer.bindTooltip(showStateTooltip).addTo(map);

fullData$.subscribe(data => {
  // Add choropleth coloring to layers
  stateLayer.options = { style: setStateStyle };
  districtLayer.options = { style: setDistrictStyle };
});

// Zoom in/out when clicking on a state
stateLayer.on('click', function(e) {
  map.fitBounds(e.layer.getBounds());
});
districtLayer.on('click', function(e) {
  setDefaultZoom();
});

// Hide district layer and restrict dragging unless we're zoomed in
map.on('zoomend', function() {
  if (map.getZoom() < (calculateZoom() + 1)){
    map.dragging.disable();
    if (map.hasLayer(districtLayer)) {
        map.removeLayer(districtLayer);
    }
  } else {
    map.dragging.enable();
    if (!map.hasLayer(districtLayer)) {
      map.addLayer(districtLayer);
    }
  }
});

// Helper functions
function calculateZoom() {
  var sw = screen.width;

  return sw >= 1700 ? 4.7 :
         sw >= 1600 ? 4.3 :
                      4.5 ;
}

function setDefaultZoom() {
  map.setView([37.8, -96], calculateZoom());
}

function setStateStyle(feature) {
  return {
    fillColor: fillStateColor(feature),
    weight: 2,
    opacity: 0.5,
    color: '#ccc77a',
    fillOpacity: 1
  };
}

function fillStateColor(feature) {
  if (stateNameToAbrv[feature.properties.name] in dataByState) {
    let count = dataByState[stateNameToAbrv[feature.properties.name]].length;
    return count === 1 ? '#cbc9e2' :
           count === 2 ? '#9e9ac8' :
           count === 3 ? '#756bb1' :
                         '#54278f'
  }
  return '#f2f0f7';
}

function showStateTooltip(layer) {
  let name = layer.feature.properties.name;
  var tooltip = '<h4>' + name + '</h4>'
  if (stateNameToAbrv[name] in dataByState) {
    dataByState[stateNameToAbrv[name]].forEach(person => {
      tooltip += '<h6>' + person.name + ' (' + person.state + '-' + person.district + ', ' + (person.incumbent ? 'incumbent' : 'candidate') + 
                 ') has' + (person.pledged ? '' : 'not') + ' taken the town hall pledge.</h6>';
    });
  }
  tooltip += '<h6><em>(Please click for more information)</em></h6>'
  return tooltip;
}


function setDistrictStyle(state) {
  return {
    // fillColor: fillColor(state),
    weight: 3,
    opacity: 1,
    color: '#ffffff',
    fillOpacity: 0
  };
}

});