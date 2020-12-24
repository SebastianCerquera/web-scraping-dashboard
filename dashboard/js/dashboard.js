// https://openstreetmap.be/en/projects/howto/openlayers.html

$(document).ready(function () {
   var attribution = new ol.control.Attribution({
        collapsible: false
   });
    
   map = new ol.Map({
        controls: ol.control.defaults({attribution: false}).extend([attribution]),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM({
                    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    maxZoom: 18
                })
            })
        ],
        target: 'map',
        view: new ol.View({
            center: ol.proj.fromLonLat([-73.6299223, 4.132035]),
            maxZoom: 18,
            zoom: 14
        })
   });

   var source = new ol.source.Vector({
       features: []
   });
    
   var vector = new ol.layer.Vector({
       source: source,
   });
   map.addLayer(vector); 

   var draw = new ol.interaction.Draw({
       source: source,
       type: 'Circle',
   });

   // https://gis.stackexchange.com/questions/252946/what-are-the-possible-listeners-and-event-types-for-an-openlayers-map-ol-map
   map.on('dblclick', function (e) {
       map.addInteraction(draw);
   });

   var success = function(data){
       var finalHTML = buildBody(data, buildCoordinate);
       $('tbody').html(finalHTML);

       /*
       $('#map').css("height", "40%");
       $('#map').css("width", "40%");
       $('#map').css("float", "right");
       */
       $('#map').hide()
       
       $('#RESULTS').css("height", "55%");
       $('#RESULTS').show();

       //payload = JSON.stringify(coordinates)
   }
    
   var filter_publications = function(coordinates){
       $.get('data/schools_villavicencio.json').always(success)
   }

   var buildrow = function(entry){
       var template = "<tr><th scope=\"col\">%Superficie%</th><th scope=\"col\">%Precio%</th><th scope=\"col\">%Estrato%</th><th scope=\"col\">%Administracion%</th></tr>";
        
       template = template.replace(/%Superficie%/, entry['surface']);
       template = template.replace(/%Precio%/, entry['surface']);
       template = template.replace(/%Estrato%/, entry['surface']);
       template = template.replace(/%Administracion%/, entry['surface']);
    
       return template;
   }

   var buildCoordinate = function(entry){
       var template = "<tr><th scope=\"col\">%cluster_longitude%</th><th scope=\"col\">%cluster_latitude%</th></tr>";
        
       template = template.replace(/%cluster_longitude%/, entry['cluster_longitude']);
       template = template.replace(/%cluster_latitude%/, entry['cluster_latitude']);
    
       return template;
   }
   
   var buildBody = function(data, rowBuilder){
      var results = data['results']["schools"], i = 0, finalHTML = "";
      for(; i<results.length; i++)
          finalHTML = finalHTML + rowBuilder(results[i])
      return finalHTML;
   }

    
   // https://stackoverflow.com/questions/39216136/how-to-catch-event-after-drawend-added-to-source-in-ol3
   // https://stackoverflow.com/questions/50926971/how-to-remove-interaction-in-openlayers
   // https://stackoverflow.com/questions/39216136/how-to-catch-event-after-drawend-added-to-source-in-ol3 
   search_bounds = []
   draw.on('drawend', function (e) {
       map.removeInteraction(draw)

       var feature = e.feature;
       var geometry = feature.values_.geometry

       // https://stackoverflow.com/questions/30504313/how-to-get-coordinates-of-a-user-drawn-circle-in-openlayers-3
       var polygon = ol.geom.Polygon.fromCircle(geometry);
       var coordinates = polygon.getCoordinates()
       coordinates = coordinates[0]

       var i;
       for(i=0; i<coordinates.length; i++)
           search_bounds.push(ol.proj.transform(coordinates[i], 'EPSG:3857', 'EPSG:4326'));

       filter_publications(search_bounds)
   });
    
   $('#ESTADISTICAS').hide()
   $('#HOME').hide()
   $('#RESULTS').hide()
    
});

