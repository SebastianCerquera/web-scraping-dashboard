// https://openstreetmap.be/en/projects/howto/openlayers.html

$(document).ready(function () {
   var attribution = new ol.control.Attribution({
        collapsible: false
   });
    
   var map = new ol.Map({
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
   window.map = map;


   var createHeatmapLayer = function(interestPoints){
       var source = new ol.source.Vector({
           features: []
       });
        
       var vector = new ol.layer.Heatmap({
           source: source,
           blur: parseInt(10, 10),
           radius: parseInt(10, 10),
           weight: function (feature) {
               console.log(feature);
             return 1;
           }
       });
       
       interestPoints.places.forEach(function(point){
          feature = new ol.Feature({
              geometry: new ol.geom.Point(ol.proj.fromLonLat([point.lon, point.lat]))
          });
          source.addFeature(feature);
       });

       return vector;       
   }
    
   var createFeaturesLayer = function(interestPoints){
       var source = new ol.source.Vector({
           features: []
       });
        
       var style = new ol.style.Style({
           image: new ol.style.Icon({src: interestPoints.icon})
         });
        
       var vector = new ol.layer.Vector({
           source: source,
           style: style
       });

       interestPoints.places.forEach(function(point){
          feature = new ol.Feature({
              geometry: new ol.geom.Point(ol.proj.fromLonLat([point.lon, point.lat]))
          });
          source.addFeature(feature);
       });

       return vector;
   };

   var getViewPortBounds = function(map){
       coordinates = map.getView().calculateExtent()
       coordinates_top = [coordinates[0], coordinates[1]]
       coordinates_bottom = [coordinates[2], coordinates[3]]
       coordinates_top = ol.proj.transform(coordinates_top, 'EPSG:3857', 'EPSG:4326')
       coordinates_bottom = ol.proj.transform(coordinates_bottom, 'EPSG:3857', 'EPSG:4326')
       return coordinates_top.concat(coordinates_bottom)
   }

   // https://gis.stackexchange.com/questions/252946/what-are-the-possible-listeners-and-event-types-for-an-openlayers-map-ol-map
   map.on('click', function (e) {});

   var success = function(data){
       var finalHTML = buildBody(data, buildCoordinate);
       $('tbody').html(finalHTML);

       $('#map').hide()
       
       $('#RESULTS').css("height", "55%");
       $('#RESULTS').show();
   }
       
   $('#ESTADISTICAS').hide()
   $('#HOME').hide()
   $('#RESULTS').hide()

   // https://openstreetmap.be/en/projects/howto/openlayers.html
   var bounds = getViewPortBounds(map)


   /*
     Los resultados del API se estan quemando, debido a la natiraleza de la data no es necesario desplegar el servidor
     en cada ocasion, como el resultado es el mismo se guardo una copia en el repo y esta se sirve de forma estatica.
   */ 
   var getCityPath = function(path){
      var url = new URL(window.location.href);
      var city = url.searchParams.get("city"); 
      return 'data/' + city + '/external/all.json';
   };

   window.interestPointLayers = {};
    
   $.get(getCityPath()).always(function(data){
       var results = data.results.reduce(function(a, b){return Object.assign({}, a, b);});

       Object.keys(results).forEach(function(key){
           var vector = createFeaturesLayer({
               icon: 'images/icons/iconoairport.png', 
               places: results[key]
           });

           window.interestPointLayers[key] = vector;

           vector = createHeatmapLayer({
               places: results[key]
           });
           
           map.addLayer(vector);
       });
   });

   $('.btn-realtor').on('click', function(e){
       var button = this;
       var vector = interestPointLayers[this.id];
       if ( $(this).hasClass('btn-primary') ){
           map.addLayer(vector);
           $(this).removeClass('btn-primary');
           $(this).addClass('btn-success')
       }else {
           map.removeLayer(vector);
           $(this).removeClass('btn-success')           
           $(this).addClass('btn-primary');           
       }
   });
    
});

