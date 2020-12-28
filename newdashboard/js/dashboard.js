// https://openstreetmap.be/en/projects/howto/openlayers.html

$(document).ready(function () {
     var attribution = new ol.control.Attribution({
          collapsible: false
     });
     
     var getCity = function(){
        var url = new URL(window.location.href);
        var city = url.searchParams.get("city"); 
        return city;
     };

     var getPropertyType = function(){
        var url = new URL(window.location.href);
        return url.searchParams.get("property_type");
     };

     var getPostType = function(){
        var url = new URL(window.location.href);
        return url.searchParams.get("post_type");
     };

     var getHeatmapConf = function(){
        var url = new URL(window.location.href);
        return url.searchParams.get("heatmap");
     };
    
    /*
     * This is cached file of the API endpoint, the results actually but it was cheap to develop the API.
     * 
     * mkdir -p data/manizales/external/
     * curl -XGET localhost:8000/manizales/external/all > data/manizales/external/all.json
     *  
     * mkdir -p data/villavicencio/external/
     * curl -XGET localhost:8000/villavicencio/external/all > data/villavicencio/external/all.json
     *  
     * mkdir -p data/fusagasuga/external/
     * curl -XGET localhost:8000/fusagasuga/external/all > data/fusagasuga/external/all.json
     * 
     */    
     var getCityPath = function(){
        return 'data/' + getCity() + '/external/all.json';
     };

     /*
      * 
      * for city in "manizales" "fusagasuga" "villavicencio"; do
      *    for property_type in "apartamentos" "casas"; do
      *        for post_type in "arriendo" "venta"; do
      *            mkdir -p  $city/posts/$property_type/$post_type/
      *            curl -XGET localhost:8000/$city/posts/$property_type/$post_type/all > $city/posts/$property_type/$post_type/all.json
      *        done
      *    done
      * done
      * 
      */
    var getPostPath = function(property_type, post_type){
         return '/data/' + getCity() + '/posts/' + property_type + '/' + post_type + '/all.json';
     };
        
     var coordinates_bounds = {
          'manizales': {
              'lat': {
                  'center': 5.061856,
                  'lower': 5.017395,
                  'upper': 5.119305
              },
              'lon':{
                  'center': -75.49892,
                  'lower': -75.556431,
                  'upper': -75.410519
              }
          },
          'fusagasuga': {
              'lat': {
                  'center': 4.332970,
                  'lower': 5.017395,
                  'upper': 5.119305
              },
              'lon':{
                  'center': -74.37222,
                  'lower': -75.556431,
                  'upper': -75.410519
              }
          },
          'villavicencio': {
              'lat': {
                  'center': 4.132035,
                  'lower': 5.017395,
                  'upper': 5.119305
              },
              'lon':{
                  'center': -73.6299223,
                  'lower': -75.556431,
                  'upper': -75.410519
              }
          }
     };
      
     var iconPaths = {
        'airport': 'images/icons/iconoparkamusement.png',
        'amusement_park': 'images/icons/iconoparkamusement.png',
        'bank': 'images/icons/iconobank.png',
        'church': 'images/icons/iconochurch.png',
        'hospital': 'images/icons/iconohospital.png',
        'library': 'images/icons/iconobookstore.png',
        'local_government_office': 'images/icons/iconlocalgovernmenteoffice.png',
        'park': 'images/icons/iconopark.png',
        'police': 'images/icons/iconpolice.png',
        'restaurant': 'images/icons/iconrestaurant.png',
        'school': 'images/icons/iconoschool.png',
        'secondary_school': 'images/icons/iconschoolsecundary.png',
        'shopping_mall': 'images/icons/iconmall.png',
        'university': 'images/icons/iconouniversity.png'
     };
     
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
              center: ol.proj.fromLonLat([coordinates_bounds[getCity()]['lon']['center'], coordinates_bounds[getCity()]['lat']['center']]),
              maxZoom: 18,
              zoom: 14
          })
     });

     var defaultFeaturesBuilder = function(source){
         return function(point){
             feature = new ol.Feature({
                 geometry: new ol.geom.Point(ol.proj.fromLonLat([point.lon, point.lat]))
             });
             source.addFeature(feature);
         };
     };
  
     var createHeatmapLayer = function(interestPoints, featuresBuilder, weight){
          var source = new ol.source.Vector({
              features: []
          });
  
         var builder = featuresBuilder(source);
         interestPoints.forEach(builder);
  
          var vector = new ol.layer.Heatmap({
              source: source,
              blur: 10,
              radius: 5,
              weight: weight
          });
    
          return vector;       
     };

     var createNoWeightHeatmapLayer = function(interestPoints){
         return createHeatmapLayer(
             interestPoints,
             defaultFeaturesBuilder,
             function(feature){
                 return 500;
             }
         );
     };


     var defaultFeaturesBuilder = function(source){
         return function(point){
             feature = new ol.Feature({
                 geometry: new ol.geom.Point(ol.proj.fromLonLat([point.lon, point.lat]))
             });
             source.addFeature(feature);
         };
     };
    
     var createWeightedHeatmapLayer = function(interestPoints){
         return createHeatmapLayer(interestPoints, function(feature){
             return 1;
         });
     };
    
    
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
         
     $('#ESTADISTICAS').hide()
     $('#HOME').hide()
     $('#RESULTS').hide()
   
     // https://openstreetmap.be/en/projects/howto/openlayers.html
     var bounds = getViewPortBounds(map)
   
   
     /*
       Los resultados del API se estan quemando, debido a la natiraleza de la data no es necesario desplegar el servidor
       en cada ocasion, como el resultado es el mismo se guardo una copia en el repo y esta se sirve de forma estatica.
     */
     var interestPointLayers = {};


     $.get(getCityPath()).always(function(data){
         var results = data.results.reduce(function(a, b){return Object.assign({}, a, b);});
         Object.keys(results).forEach(function(key){
             var point = results[key];             
             var vector = createFeaturesLayer({
                 icon: iconPaths[key],
                 places: point
             });
   
             interestPointLayers[key] = vector;
         });
     });
    
    $.get(getPostPath(getPropertyType(), getPostType())).always(function(data){
          var results = data.results;

          /*
          var counter = 1;
          results.forEach(function(point){
              point['weigth'] = counter;
              counter++;                 
          });
          */

          var vector = createNoWeightHeatmapLayer(results);
          map.addLayer(vector);
      });

     $('#ventas_arriendos').text(getPostType().toUpperCase())
     $('#ventas_arriendos').on('click', function(e){
         var url = new URL(window.location.href);
         
         if($(this).text() === "VENTA"){
             url.searchParams.set("post_type", "arriendo")
             $(this).text("ARRIENDO");
         } else {
             url.searchParams.set("post_type", "venta")
             $(this).text("VENTA");
         }
         
         window.location.href = url.href;        
     });



     $('#precio_conteos').text(getHeatmapConf().toUpperCase())    
     $('#precio_conteos').on('click', function(e){
         var url = new URL(window.location.href);
         
         if($(this).text() === "PRECIO"){
             url.searchParams.set("heatmap", "conteo")
             $(this).text("CONTEO");
         } else {
             url.searchParams.set("heatmap", "precio")
             $(this).text("PRECIO");
         }

         window.location.href = url.href;         
     });
    
     $('#casas_apartamentos').text(getPropertyType().toUpperCase())    
     $('#casas_apartamentos').on('click', function(e){
         var url = new URL(window.location.href);
  
         if($(this).text() === "CASAS"){
             url.searchParams.set("property_type", "apartamentos")
             $(this).text("APARTAMENTOS");
         } else {
             url.searchParams.set("property_type", "casas")
             $(this).text("CASAS");
         }
  
         window.location.href = url.href;
     });
    
     $('a.btn').on('click', function(e){
         var button = this;
         var vector = interestPointLayers[this.id];
         if ( $(this).hasClass('btn') ){
             map.addLayer(vector);
             $(this).removeClass('btn');
             $(this).addClass('btn-seleccion')
         }else {
             map.removeLayer(vector);
             $(this).removeClass('btn-seleccion')           
             $(this).addClass('btn');           
         }
     });
    
});

