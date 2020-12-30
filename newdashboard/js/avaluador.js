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

    var features = {
        'lat': 0.0,
        'lon': 0.0,
        'surface': 0.0,
        'rooms': 0,
        'baths': 0,
        'garages': 0,
        'admon': 0.0,
        'estrato': 0,
        'antiguedad': 4
    };
    

     var source = new ol.source.Vector({
         features: []
     });
      
     var vector = new ol.layer.Vector({
         source: source,
     });
     map.addLayer(vector); 
      
     // https://gis.stackexchange.com/questions/252946/what-are-the-possible-listeners-and-event-types-for-an-openlayers-map-ol-map
     map.on('click', function (e) {
         if(source.getFeatures().length < 1){    
             var feature = new ol.Feature({
                 geometry: new ol.geom.Point(ol.proj.fromLonLat(ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326')))
             });
             source.addFeature(feature);
             
             window.coordinates = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
         }
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
    
    $('#explorador').attr('href', '/pantalla2.html?city=' + getCity() + '&property_type=' +
                          getPropertyType() + '&post_type=' + getPostType() + '&heatmap=conteo');

    $('#eval_regressor').on('click', function(e){
        var formData = new FormData($('#avaluador')[0])
        for (var pair of formData.entries()) {
            features[pair[0]] = pair[1];
        }

        features['lat'] = window.coordinates[1];
        features['lon'] = window.coordinates[0];
        
        features["rooms"] = parseInt(features["rooms"]);
        features["antiguedad"] = parseInt(features["antiguedad"]);
        features["baths"] = parseInt(features["baths"]);
        features["admon"] = parseFloat(features["admon"]);
        features["garages"] = parseInt(features["garages"]);
        features["surface"] = parseFloat(features["surface"]);
        features["estrato"] = parseInt(features["estrato"]);

        $.ajax({
          type: "POST",
          url: '/manizales/posts/apartamentos/arriendo/model',
          data: JSON.stringify(features),
          success: function(data){
              console.log(data)
          },
          contentType: 'application/json'
        });
    });

});     
