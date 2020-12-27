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
     window.map = map;


      var createHeatmapLayer = function(interestPoints, weight){
         var source = new ol.source.Vector({
             features: []
         });
         
         var vector = new ol.layer.Heatmap({
             source: source,
             blur: 50,
             radius: 20,
             weight: function (feature) {
               return weight;
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
         
     $('#ESTADISTICAS').hide()
     $('#HOME').hide()
     $('#RESULTS').hide()
   
     // https://openstreetmap.be/en/projects/howto/openlayers.html
     var bounds = getViewPortBounds(map)
   
   
     /*
       Los resultados del API se estan quemando, debido a la natiraleza de la data no es necesario desplegar el servidor
       en cada ocasion, como el resultado es el mismo se guardo una copia en el repo y esta se sirve de forma estatica.
     */
     window.interestPointLayers = {};
      
     $.get(getCityPath()).always(function(data){
         var results = data.results.reduce(function(a, b){return Object.assign({}, a, b);});
   
         var counter = 1;
         Object.keys(results).forEach(function(key){
             var point = results[key];
             point['weigth'] = counter;
             counter++;
             
             var vector = createFeaturesLayer({
                 icon: iconPaths[key],
                 places: point
             });
   
             window.interestPointLayers[key] = vector;
   
             vector = createHeatmapLayer({
                 places: point
             }, point['weigth']);
             
             map.addLayer(vector);
         });
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

