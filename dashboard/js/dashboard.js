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

   var icon = new ol.style.Icon({src: 'images/icons/iconembajada.png'})
    
   var style = new ol.style.Style({
       image: icon
     });
    
   var vector = new ol.layer.Vector({
       source: source,
       style: style
   });
   map.addLayer(vector);
   window.mysource = source;

   /**
   var draw = new ol.interaction.Draw({
       source: source,
       type: 'Circle',
   });
   */

   var getViewPortBounds = function(map){
       coordinates = map.getView().calculateExtent()
       coordinates_top = [coordinates[0], coordinates[1]]
       coordinates_bottom = [coordinates[2], coordinates[3]]
       coordinates_top = ol.proj.transform(coordinates_top, 'EPSG:3857', 'EPSG:4326')
       coordinates_bottom = ol.proj.transform(coordinates_bottom, 'EPSG:3857', 'EPSG:4326')
       return coordinates_top.concat(coordinates_bottom)
   }
    
   // https://gis.stackexchange.com/questions/252946/what-are-the-possible-listeners-and-event-types-for-an-openlayers-map-ol-map
   map.on('click', function (e) {       
       // https://openstreetmap.be/en/projects/howto/openlayers.html
       bounds = getViewPortBounds(map)

       $.get('data/manizales/external/all.json').always(function(data){
           results = data.results.reduce(function(a, b){return Object.assign({}, a, b);});

           point = results.school[0]
            
           feature = new ol.Feature({
               geometry: new ol.geom.Point(ol.proj.fromLonLat([point.lon, point.lat]))
           });
           mysource.addFeature(feature);           
       });
       
       //map.addInteraction(draw);
   });

   var success = function(data){
       var finalHTML = buildBody(data, buildCoordinate);
       $('tbody').html(finalHTML);

       $('#map').hide()
       
       $('#RESULTS').css("height", "55%");
       $('#RESULTS').show();

       //payload = JSON.stringify(coordinates)
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


   /**
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

       $.get('data/schools_villavicencio.json').always(success)
   });
   */
    
   $('#ESTADISTICAS').hide()
   $('#HOME').hide()
   $('#RESULTS').hide()
    
});

