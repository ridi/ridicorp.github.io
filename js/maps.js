function initialize() {

  // Create an array of styles.
  var styles = [];



  // Create a new StyledMapType object, passing it the array of styles,
  // as well as the name to be displayed on the map type control.
  var styledMap = new google.maps.StyledMapType(styles,
    {name: "Styled Map"});
    
    var LatLng = new google.maps.LatLng(37.5042023, 127.0468607);

  // Create a map object, and include the MapTypeId to add
  // to the map type control.
  var mapOptions = {
    scrollwheel: true,
    navigationControl: false,
    disableDefaultUI: true,
    zoom: 16,
    center: LatLng,
    mapTypeControlOptions: {
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
    }
  };
  
  var map = new google.maps.Map(document.getElementById('map_canvas'),
    mapOptions);

  //Associate the styled map with the MapTypeId and set it to display.
  map.mapTypes.set('map_style', styledMap);
  map.setMapTypeId('map_style');
  
    var mapMarkerImg = new google.maps.MarkerImage("../img/marker.png");
    var mapMarker = new google.maps.Marker({
      position: LatLng,
      map: map,
      icon: mapMarkerImg
  });
  
}
