var searchMapping = {
    'villavicencio_search': 'villavicencio',
    'fusagasuga_search': 'fusagasuga',
    'manizales_search': 'manizales'
};

var searchHandler = function(element){
    window.location = '/city.html?city=' + searchMapping[element.id];
};

$('#villavicencio_search').on('click', searchHandler);
$('#fusagasuga_search').on('click', searchHandler);
$('#manizales_search').on('click', searchHandler);
