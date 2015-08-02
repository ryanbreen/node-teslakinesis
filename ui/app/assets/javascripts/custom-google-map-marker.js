function CustomMarker(latlng, map, div) {
  this.latlng = latlng; 
  this.div = div;
  this.map = map;
  this.setMap(map); 
}

CustomMarker.prototype = new google.maps.OverlayView();

CustomMarker.prototype.draw = function() {
  
  var self = this;
  
  var div = this.div;

  //console.log(self.map);

  var recalculate_overlay = function() {
  
    var point = self.getProjection().fromLatLngToContainerPixel(self.latlng);
    //var point = self.getProjection().fromLatLngToDivPixel(self.latlng);
    //console.log(point);
  
    if (point) {
      div.style.position = 'absolute';
      div.style.cursor = 'pointer';
      div.style.left = (point.x - 5) + 'px';
      div.style.top = (point.y - 6) + 'px';
    }
  };

  // Wait for idle map
  google.maps.event.addListener(this.map, 'idle', recalculate_overlay);
  google.maps.event.addListener(this.map, 'bounds_changed', recalculate_overlay);
  google.maps.event.addListener(window, 'load', recalculate_overlay);
};

CustomMarker.prototype.remove = function() {
  if (this.div) {
    this.div.parentNode.removeChild(this.div);
    this.div = null;
  } 
};

CustomMarker.prototype.getPosition = function() {
  return this.latlng; 
};