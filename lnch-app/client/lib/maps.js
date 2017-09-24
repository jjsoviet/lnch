//Google Maps Variables
var map;
var directionsService;
var directionsDisplay;
var service;
var currentPos;
var currentDest;
var circle;
var startpin;
var endpin;
var navOrigin;
var navDest;
var navDestID;
var start;
var end;
var markers = [];

//Orientation Event Listener
window.addEventListener('orientationchange', function() {
  console.log("Orientation changed");

  if (currentPos != null) {
    map.setZoom(9);
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currentPos);

    setTimeout(function(){
       Meteor.mapfunctions.calculateOffset();
    }, 200);
  }
}, false);


//Maps API Main Functions
Meteor.mapfunctions = {
  initMap: function(m) {
    map = m;
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    directionsDisplay.setOptions({
      suppressMarkers: true,
      suppressInfoWindows: true,
      polylineOptions: { strokeColor: '#000', strokeOpacity: 1.0 }
    });

    //Set custom markers
    startpin = new google.maps.MarkerImage('/img/startpin.png');
    endpin = new google.maps.MarkerImage('/img/endpin.png');
    markers = [];

    //Set map services
    service = new google.maps.places.PlacesService(map);
    circle = new google.maps.Circle({
        strokeColor: '#FF970D',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        fillColor: '#FFF',
        fillOpacity: 0.5
    });

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        Meteor.mapfunctions.tryGeolocation(map);
    } else {
        // Browser doesn't support Geolocation
        Meteor.mapfunctions.displayModal(true);
    }
  },

  //Attempt to get user location
  tryGeolocation: function(map) {
    console.log("Attempting geolocation");

    navigator.geolocation.getCurrentPosition(function (position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        currentPos = pos;
        var distance = document.getElementById('distance').value;

        map.setCenter(new google.maps.LatLng(currentPos));
        circle.setMap(map);
        circle.setCenter(currentPos);
        circle.setRadius(distance * 1609.34);
    }, function () {
        Meteor.mapfunctions.displayModal(true);
    });
  },

  //Initiate search of destination
  search: function() {
    if (navigator.geolocation) {
        Meteor.mapfunctions.clearMarker();

        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            var distance = document.getElementById('distance').value;
            var category = document.getElementById('category');
            var region = document.getElementById('region');

            //Build the Place Search request
            var request = {
                location: pos,
                radius: distance * 1609.34,
                type: 'restaurant',
                keyword: [category.options[category.selectedIndex].value, 'restaurant', 'eatery'],
                minprice: 0,
                maxprice: 4,
                rankBy: google.maps.places.RankBy.PROMINENCE
            };

            circle.setRadius(distance * 1609.34);
            service.nearbySearch(request, Meteor.mapfunctions.callback);
        }, function () {
            Meteor.mapfunctions.displayModal(true);
        });
    }
  },

  //Remove previous markers from Map
  clearMarker: function() {
      if (markers.length > 0) {
          for (var i = 0; i < markers.length; i++)
              markers[i].setMap(null);

          markers = new Array();
      }
  },

  //Place marker on Map
  createMarker: function(place) {
      if (place.reference == null || place == null)
          return;

      var request = { reference: place.reference };

      service.getDetails(request, function (details, status) {
          if (details) {
              //Draw the markers for start and end
              start = new google.maps.Marker({
                  map: map,
                  icon: startpin,
                  position: currentPos,
                  animation: google.maps.Animation.DROP
              });

              end = new google.maps.Marker({
                  map: map,
                  icon: endpin,
                  position: place.geometry.location,
                  animation: google.maps.Animation.DROP
              });

              markers.push(start);
              markers.push(end);

              Meteor.mapfunctions.populateData(place, details, start, end);
              Meteor.mapfunctions.calculateAndDisplayRoute(place.geometry.location);
          }
      });
  },

  //Display result data
  populateData: function(place, details, start, end) {
    $('.slide-info').css('margin-left', '-30vw');
    $('.slide-down-info').css('bottom', '-30vh');

    //Initialize info objects
    var title = document.getElementById('resTitle');
    var address = document.getElementById('resAddr');
    var phone = document.getElementById('resPhone');
    var website = document.getElementById('resWebsite');
    var price = document.getElementById('resPrice');
    var rating = document.getElementById('resRating');

    //Save the origin and destination IDs
    navOrigin = currentPos.lat + ',' + currentPos.lng;
    navDest = place.name;
    navDestID = details.place_id;

    setTimeout(function() {
      title.innerText = "";
      address.innerText = "";
      rating.innerHTML = "";
      phone.innerText = "";
      website.innerHTML = "";
    }, 100)

    setTimeout(function() {
      title.innerText = place.name;
      address.innerText = details.formatted_address;
      rating.innerHTML = place.rating + " <span>&#9733;</span>";

      if (details.formatted_phone_number)
        phone.innerHTML = "<a href=\"tel:" + details.formatted_phone_number + "\"\>" + details.formatted_phone_number;
      else
        phone.innerText = "Phone Unavailable";

      if (details.website)
        website.innerHTML = "<a target=\"_blank\" href=\"" + details.website + "\"\>Go to Website <i class='material-icons'>keyboard_arrow_right</i></a>";
      else
        website.innerText = "Website Unavailable";

      $('#infobar').css('opacity', '1');
      $('.slide-info').css('margin-left', '0');
      $('.slide-down-info').css('bottom', '0');

      setTimeout(function() {
        Meteor.mapfunctions.calculateOffset();
      }, 0);
    }, 600);

    price.innerText = "";
    if (place.price_level != NaN && place.price_level >= 0) {
        for (var i = 0; i < place.price_level * 1; i++)
            price.innerText += "$";
    }
  },

  //Display the driving route
  calculateAndDisplayRoute: function(dest) {
      directionsService.route({
          origin: currentPos,
          destination: dest,
          travelMode: 'DRIVING'
      }, function (response, status) {
          if (status === 'OK')
            directionsDisplay.setDirections(response);
          else
            window.alert('Directions request failed due to ' + status);
      });
  },

  //Callback function, gets random location result
  callback: function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK)
          Meteor.mapfunctions.createMarker(results[Math.floor(Math.random() * results.length)]);
      else
          Meteor.mapfunctions.displayModal(false);
  },

  //Display a modal on search/geolocation failure
  displayModal: function(geoError) {
    $('.slide-info').css('margin-left', '-30vw');
    $('.slide-down-info').css('bottom', '-30vh');

    $('#modal').css('z-index', '999');
    $('#modal').css('opacity', '1');

    if (geoError == true) {
      $('#modalTitle').text("Geolocation Error");
      $('#modalDetails').text("Couldn't find your location. Refresh this page and try again.")
    } else {
      $('#modalTitle').text("No Place Found");
      $('#modalDetails').text("Cannot find a place matching your parameters. Please try again.");
      $('#modalClose').text("Retry");
    }
  },

  calculateOffset: function() {
    if (start == null || end == null)
      return;

    var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    var startOffset = 0;
    var endOffset = 0;
    var offset = 0;
    var startCoords = Meteor.mapfunctions.convertToPoint(start);
    var endCoords = Meteor.mapfunctions.convertToPoint(end);
    var isPortrait = (window.matchMedia("(orientation: portrait)").matches);
    var infoPos = $('#resWebsite').offset().top + 200;
    var launchPos = window.innerHeight - $('#navigate').height() - 50;
    var widthPos = Math.max($('#resAddr').width(), $('#resTitle').width()) + 30;

    //Check if one of markers is covered by the info bar
    if (true) {
      //Offset conditions for portrait and lanscape mode
      if (isPortrait) {
        if (startCoords.y <= infoPos)
          startOffset = (startCoords.y - infoPos);
        if (endCoords.y <= infoPos)
          endOffset = (endCoords.y - infoPos);
      } else {
      if (startCoords.x <= widthPos)
          startOffset = (startCoords.x - widthPos);
        if (endCoords.x <= widthPos)
          endOffset = (endCoords.x - width);
      }

      //Use the least offset value
      offset = Math.min(startOffset, endOffset);

      //Pan the existing maps overlay using the offset
      setTimeout(function() {
        map = GoogleMaps.maps.foodMap.instance;

        if (isPortrait)
          map.panBy(0, offset);
        else
          map.panBy(offset, 0);

        //Recheck if offset is overshot
        if (offset != 0) {
          //Makes sure it doesn't zoom out too much
          if (map.getZoom() <= 5)
            return;

          if (!isPortrait) {
            if (startCoords.x - offset >= width - 30 || endCoords.x - offset >= width - 30 || startCoords.y < 50 || endCoords.y < 50) {
              map.setZoom(map.getZoom() - 1);
              Meteor.mapfunctions.calculateOffset();
            }
          }

          if (startCoords.y - offset >= launchPos || endCoords.y - offset >= launchPos) {
            map.setZoom(map.getZoom() - 1);
            Meteor.mapfunctions.calculateOffset();
          }
        }
      }, 100);
    }
  },

  //Convert marker positions to actual pixel values
  convertToPoint: function(marker) {
    map = GoogleMaps.maps.foodMap.instance;
    var scale = Math.pow(2, map.getZoom());
    var nw = new google.maps.LatLng(
        map.getBounds().getNorthEast().lat(),
        map.getBounds().getSouthWest().lng()
    );
    var worldCoordinateNW = map.getProjection().fromLatLngToPoint(nw);
    var worldCoordinate = map.getProjection().fromLatLngToPoint(marker.getPosition());
    var pixelOffset = new google.maps.Point(
        Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
        Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
    );

    return pixelOffset;
  },

  //Launch an external Google Maps navigation instance
  launchMaps: function() {
    var baseURL = "https://www.google.com/maps/dir/?api=1";
    var originURL = "&origin=" + navOrigin;
    var destURL = "&destination=" + navDest + "&destination_place_id=" + navDestID;
    var actionsURL = "&travelmode=driving";
    var fullURL = baseURL + originURL + destURL + actionsURL;

    console.log(fullURL);

    var tab = window.open(fullURL, '_blank');
    tab.focus();
  }
};
