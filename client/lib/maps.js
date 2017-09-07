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
var infoWindow;
var navOrigin;
var navDest;
var navDestID;
var markers = [];

Meteor.mapfunctions = {
  initMap: function(m) {
    map = m;
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    directionsDisplay.setOptions( { suppressMarkers: true });

    //Set custom markers
    startpin = new google.maps.MarkerImage('/img/startpin.png');
    endpin = new google.maps.MarkerImage('/img/endpin.png');
    markers = [];

    //Set map services
    service = new google.maps.places.PlacesService(map);
    infoWindow = new google.maps.InfoWindow;
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

        infoWindow = new google.maps.InfoWindow;
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
          infoWindow.setMap(null);
      }
  },

  //Draw the circle
  getCircle: function(magnitude) {
      return {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: 'blue',
          fillOpacity: .2,
          scale: Math.pow(2, magnitude) / 2,
          strokeColor: 'white',
          strokeWeight: .5
      };
  },

  //Place marker on Map
  createMarker: function(place) {
      if (place.reference == null || place == null)
          return;

      var request = { reference: place.reference };
      infoWindow = new google.maps.InfoWindow;

      service.getDetails(request, function (details, status) {
          if (details) {
              //Draw the markers for start and end
              var start = new google.maps.Marker({
                  map: map,
                  icon: startpin,
                  position: currentPos,
                  animation: google.maps.Animation.DROP
              });

              var end = new google.maps.Marker({
                  map: map,
                  icon: endpin,
                  position: place.geometry.location,
                  animation: google.maps.Animation.DROP
              });

              markers.push(start);
              markers.push(end);

              Meteor.mapfunctions.populateData(place, details);

              Meteor.mapfunctions.calculateAndDisplayRoute(place.geometry.location);
          }
      });
  },

  //Display result data
  populateData: function(place, details) {
    $('.slide-info').css('margin-left', '-30vw');
    $('.slide-down-info').css('margin-bottom', '-10vh');

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
      $('.slide-down-info').css('margin-bottom', '0');
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
          if (status === 'OK') {
              directionsDisplay.setDirections(response);
              map = GoogleMaps.maps.foodMap.instance
              map.setCenter(dest);
          } else {
              window.alert('Directions request failed due to ' + status);
          }
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
    $('.slide-down-info').css('margin-bottom', '-10vh');

    $('#modal').css('opacity', '1');

    if (geoError == true) {
      $('#modalTitle').text("Geolocation Error");
      $('#modalDetails').text("Couldn't find your location. Refresh this page and try again.")
    } else {
      $('#modalTitle').text("No Place Found");
      $('#modalDetails').text("Cannot find a place matching your parameters. Please try again.");
    }
  },

  //Launch an external Google Maps navigation instance
  launchMaps: function() {
    var baseURL = "https://www.google.com/maps/dir/?api=1";
    var originURL = "&origin=" + navOrigin;
    var destURL = "&destination=" + navDest + "&destination_place_id=" + navDestID;
    var actionsURL = "&travelmode=driving&dir_action=navigate";
    var fullURL = baseURL + originURL + destURL + actionsURL;

    console.log(fullURL);

    var tab = window.open(fullURL, '_blank');
    tab.focus();
  }
};
