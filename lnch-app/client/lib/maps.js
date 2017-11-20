//Google Maps Variables
let map;
let service;
let currentPos;
let currentDest;
let circle;
let startpin;
let endpin;
let navOrigin;
let navDest;
let navDestID;
let start;
let end;
let markers = [];
let directionsService;
let directionsDisplay;

//Orientation Event Listener
window.addEventListener('orientationchange', () => {

  //Trigger a resize event and zoom, then check for offset
  if (currentPos != null && Meteor.mapfunctions.checkOrientation() != "") {
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
    let isPortrait = window.matchMedia("(orientation: portrait)");
    return isPortrait.matches ? "Portrait" : "Landscape";
  },

  //Initialize Google Maps
  initMap: (mapInput) => {
    map = mapInput;

    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);

    //Initialize directions service to remove markers and windows, set line color to black
    directionsDisplay.setOptions({
      suppressMarkers: true,
      suppressInfoWindows: true,
      polylineOptions: { strokeColor: '#000', strokeOpacity: 1.0 }
    });

    //Set custom markers
    startpin = new google.maps.MarkerImage('/img/startpin.png');
    endpin = new google.maps.MarkerImage('/img/endpin.png');

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
        Meteor.mapfunctions.displayModal("Location Services Error", "Couldn't use geolocation on your device. Please enable location services and try again.");
  },

  //Attempt to get user location
  tryGeolocation: (map) => {
    navigator.geolocation.getCurrentPosition((position) => {
        currentPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        //Get distance value from user input
        let distance = document.getElementById('distance').value;

        //Set center and draw a circle around the designated radius
        map.setCenter(new google.maps.LatLng(currentPos));
        circle.setMap(map);
        circle.setCenter(currentPos);
        circle.setRadius(distance * 1609.34);
    }, () => {
        Meteor.mapfunctions.displayModal("Geolocation Error", "Couldn't find your location. Refresh this page and try again.");
    });
  },

  //Initiate search of destination
  search: () => {
    if (navigator.geolocation) {
        Meteor.mapfunctions.clearMarker();

        navigator.geolocation.getCurrentPosition((position) => {
            currentPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            let distance = document.getElementById('distance').value;
            let category = document.getElementById('category');
            let region = document.getElementById('region');

            //Build the place search request
            let request = {
                location: currentPos,
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
            Meteor.mapfunctions.displayModal("Search Error", "Couldn't find your location. Refresh this page and try again.");
        });
    }
  },

  //Remove previous markers from Map
  clearMarker: () => {
      if (markers.length > 0) {
          for (let i = 0; i < markers.length; i++)
              markers[i].setMap(null);
          markers = [];
      }
  },

  //Place marker on Map
  createMarker: (place) => {
      if (place.reference == null || place == null)
          return;

      let request = { reference: place.reference };

      service.getDetails(request, (result, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          Meteor.mapfunctions.displayModal("Result Error", "Couldn't retrieve the search result. Refresh this page and try again.");
        }
          if (result) {
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
              Meteor.mapfunctions.populateData(place, result, start, end);
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

      price.innerText = "";
      if (place.price_level != NaN && place.price_level >= 0) {
          for (let i = 0; i < place.price_level * 1; i++)
              price.innerText += "$";
      }

      Meteor.mapfunctions.calculateOffset();
    }, 600);
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
            Meteor.mapfunctions.displayModal("Directions Error", "Couldn't provide directions for this route. Refresh this page and try again.");
      });
  },

  //Callback function, gets random location result
  callback: (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK)
          Meteor.mapfunctions.createMarker(results[Math.floor(Math.random() * results.length)]);
      else
          Meteor.mapfunctions.displayModal("No Place Found", "Cannot find a place matching your parameters. Please try again.");
  },

  //Display a modal on search/geolocation failure
  displayModal: (...args) => {
    $('.slide-info').css('margin-left', '-30vw');
    $('.slide-down-info').css('bottom', '-30vh');

    $('#modal').css('z-index', '999');
    $('#modal').css('opacity', '1');

    if (args && args.length == 2) {
      $('#modalTitle').text(args[0]);
      $('#modalDetails').text(args[1]);
    }

    $('#modalClose').text("Retry");
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
    if (Meteor.mapfunctions.checkOrientation() == "Portrait" && width <= 768)
      Meteor.mapfunctions.calculatePortraitOffset(startCoords, endCoords, infoPos, launchPos, map);
    else
      Meteor.mapfunctions.calculateLandscapeOffset(startCoords, endCoords, widthPos, width, map);
  },

  //Portrait offset determination
  calculatePortraitOffset: (startCoords, endCoords, infoPos, launchPos, map) => {
    let startOffset = 0;
    let endOffset = 0;

    if (startCoords.y <= infoPos)
      startOffset = (startCoords.y - infoPos);
    if (endCoords.y <= infoPos)
      endOffset = (endCoords.y - infoPos);

    let offset = Math.min(startOffset, endOffset);

    map.panBy(0, offset);

    if (startCoords.y - offset > launchPos || endCoords.y - offset >= launchPos) {
      map.setZoom(map.getZoom() - 1);
      Meteor.mapfunctions.calculateOffset();
    }
  },

  //Landscape offset determination
  calculateLandscapeOffset: (startCoords, endCoords, widthPos, width, map) => {
    let startOffset = 0;
    let endOffset = 0;

    if (startCoords.x <= widthPos)
        startOffset = (startCoords.x - widthPos);
    if (endCoords.x <= widthPos)
        endOffset = (endCoords.x - width);

    let offset = Math.min(startOffset, endOffset);

    map.panBy(offset, 0);

    if (startCoords.x - offset >= width - 100 || endCoords.x - offset >= width - 100 || startCoords.y < 100 || endCoords.y < 100) {
      map.setZoom(map.getZoom() - 1);
      Meteor.mapfunctions.calculateOffset();
    }
  },

  //Convert marker positions to actual pixel values
  convertToPoint: (marker) => {
    map = GoogleMaps.maps.foodMap.instance;

    let scale = Math.pow(2, map.getZoom());
    let nw = new google.maps.LatLng(
        map.getBounds().getNorthEast().lat(),
        map.getBounds().getSouthWest().lng()
    );

    let worldCoordinateNW = map.getProjection().fromLatLngToPoint(nw);
    let worldCoordinate = map.getProjection().fromLatLngToPoint(marker.getPosition());
    let pixelOffset = new google.maps.Point(
        Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
        Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
    );

    return pixelOffset;
  },

  //Launch an external Google Maps navigation instance
  launchMaps: () => {
    let baseURL = "https://www.google.com/maps/dir/?api=1";
    let originURL = "&origin=" + navOrigin;
    let destURL = "&destination=" + navDest + "&destination_place_id=" + navDestID;
    let actionsURL = "&travelmode=driving";
    let fullURL = baseURL + originURL + destURL + actionsURL;

    let tab = window.open(fullURL, '_blank');
    tab.focus();
  }
};
