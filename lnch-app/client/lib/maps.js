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
var currOrientation = "";

//Orientation Event Listener
window.addEventListener('orientationchange', () => {

  //Check for orientation
  Meteor.mapfunctions.checkOrientation();

  //Trigger a resize event and zoom, then check for offset
  if (currentPos != null && currOrientation != "") {
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currentPos);
    map.setZoom(12);
    map.panBy(50, -50);

    setTimeout(Meteor.mapfunctions.calculateOffset(), 300);
  }
}, false);


//Maps API Main Functions
Meteor.mapfunctions = {
  //Check orientation
  checkOrientation: () => {
    var isPortrait = window.matchMedia("(orientation: portrait)");
    currOrientation = isPortrait.matches ? "Portrait" : "Landscape";
  },

  //Initialize Google Maps
  initMap: (mapInput) => {
    map = mapInput;
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

    //Try HTML5 geolocation
    if (navigator.geolocation)
        Meteor.mapfunctions.tryGeolocation(map);
    else
        Meteor.mapfunctions.displayModal(true);
  },

  //Attempt to get user location
  tryGeolocation: (map) => {
    navigator.geolocation.getCurrentPosition((position) => {
        let pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        currentPos = pos;
        let distance = document.getElementById('distance').value;

        //Set center and draw a circle around the designated radius
        map.setCenter(new google.maps.LatLng(currentPos));
        circle.setMap(map);
        circle.setCenter(currentPos);
        circle.setRadius(distance * 1609.34);
    }, () => {
        Meteor.mapfunctions.displayModal(true);
    });
  },

  //Initiate search of destination
  search: () => {
    if (navigator.geolocation) {
        Meteor.mapfunctions.clearMarker();

        navigator.geolocation.getCurrentPosition((position) => {
            let pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            let distance = document.getElementById('distance').value;
            let category = document.getElementById('category');
            let region = document.getElementById('region');

            //Build the place search request
            let request = {
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
        }, () => {
            Meteor.mapfunctions.displayModal(true);
        });
    }
  },

  //Remove previous markers from Map
  clearMarker: () => {
      if (markers.length > 0) {
          for (let i = 0; i < markers.length; i++)
              markers[i].setMap(null);
          markers = new Array();
      }
  },

  //Place marker on Map
  createMarker: (place) => {
      if (place.reference == null || place == null)
          return;

      let request = { reference: place.reference };

      service.getDetails(request, (details, status) => {
          if (details) {
              //Draw start and end markers
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

              //Display the map route
              Meteor.mapfunctions.populateData(place, details, start, end);
              Meteor.mapfunctions.calculateAndDisplayRoute(place.geometry.location);
          }
      });
  },

  //Display result data
  populateData: (place, details, start, end) => {
    $('.slide-info').css('margin-left', '-30vw');
    $('.slide-down-info').css('bottom', '-30vh');

    //Initialize info objects
    let title = document.getElementById('resTitle');
    let address = document.getElementById('resAddr');
    let phone = document.getElementById('resPhone');
    let website = document.getElementById('resWebsite');
    let price = document.getElementById('resPrice');
    let rating = document.getElementById('resRating');

    //Save the origin and destination IDs
    navOrigin = currentPos.lat + ',' + currentPos.lng;
    navDest = place.name;
    navDestID = details.place_id;

    setTimeout(() => {
      title.innerText = "";
      address.innerText = "";
      rating.innerHTML = "";
      phone.innerText = "";
      website.innerHTML = "";
    }, 100)

    //Display relevant information
    setTimeout(() => {
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

      Meteor.mapfunctions.calculateOffset();
    }, 600);

    price.innerText = "";
    if (place.price_level != NaN && place.price_level >= 0) {
        for (var i = 0; i < place.price_level * 1; i++)
            price.innerText += "$";
    }
  },

  //Display the driving route
  calculateAndDisplayRoute: (dest) => {
      let request = {
          origin: currentPos,
          destination: dest,
          travelMode: 'DRIVING'
      };

      directionsService.route(request, (response, status) => {
          if (status === 'OK')
            directionsDisplay.setDirections(response);
          else
            window.alert('Directions request failed due to ' + status);
      });
  },

  //Callback function, gets random location result
  callback: (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK)
          Meteor.mapfunctions.createMarker(results[Math.floor(Math.random() * results.length)]);
      else
          Meteor.mapfunctions.displayModal(false);
  },

  //Display a modal on search/geolocation failure
  displayModal: (geoError) => {
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

  //Calculate UI offset values to shift map markers
  calculateOffset: () => {
    //Check for non-null marker values
    if (start == null || end == null)
      return;

    //Make sure it doesn't zoom out too much
    if (map.getZoom() <= 10)
      return;

    //Initialize values to be used for determining offset
    let width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    let startCoords = Meteor.mapfunctions.convertToPoint(start);
    let endCoords = Meteor.mapfunctions.convertToPoint(end);
    let infoPos = $('#resAddr').offset().top + 300;
    let launchPos = window.innerHeight - $('#navigate').height() - 50;
    let widthPos = Math.max($('#resAddr').width(), $('#resTitle').width()) + 50;

    //Offset conditions for portrait and landscape mode
    if (currOrientation == "Portrait")
      Meteor.mapfunctions.calculatePortraitOffset(startCoords, endCoords, infoPos, launchPos, map);
    else
      Meteor.mapfunctions.calculateLandscapeOffset(startCoords, endCoords, widthPos, width, map);
  },

  //Portrait offset determination
  calculatePortraitOffset: (startCoords, endCoords, infoPos, launchPos, map) => {
    var startOffset = 0;
    var endOffset = 0;

    if (startCoords.y <= infoPos)
      startOffset = (startCoords.y - infoPos);
    if (endCoords.y <= infoPos)
      endOffset = (endCoords.y - infoPos);

    var offset = Math.min(startOffset, endOffset);

    map.panBy(0, offset);

    if (startCoords.y - offset > launchPos || endCoords.y - offset >= launchPos) {
      map.setZoom(map.getZoom() - 1);
      Meteor.mapfunctions.calculateOffset();
    }
  },

  //Landscape offset determination
  calculateLandscapeOffset: (startCoords, endCoords, widthPos, width, map) => {
    var startOffset = 0;
    var endOffset = 0;

    if (startCoords.x <= widthPos)
        startOffset = (startCoords.x - widthPos);
    if (endCoords.x <= widthPos)
        endOffset = (endCoords.x - width);

    var offset = Math.min(startOffset, endOffset);

    map.panBy(offset, 0);

    if (startCoords.x - offset >= width - 100 || endCoords.x - offset >= width - 100 || startCoords.y < 100 || endCoords.y < 100) {
      map.setZoom(map.getZoom() - 1);
      Meteor.mapfunctions.calculateOffset();
    }
  },

  //Convert marker positions to actual pixel values
  convertToPoint: (marker) => {
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
  launchMaps: () => {
    var baseURL = "https://www.google.com/maps/dir/?api=1";
    var originURL = "&origin=" + navOrigin;
    var destURL = "&destination=" + navDest + "&destination_place_id=" + navDestID;
    var actionsURL = "&travelmode=driving";
    var fullURL = baseURL + originURL + destURL + actionsURL;

    var tab = window.open(fullURL, '_blank');
    tab.focus();
  }
};
