//Initialize variables
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
var markers = [];

//Initialize the Map and ask for current location
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 15
    });

    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    directionsDisplay.setOptions( { suppressMarkers: true });

    //Set custom markers
    startpin = new google.maps.MarkerImage('/img/startpin.png');
    endpin = new google.maps.MarkerImage('/img/endpin.png');

    service = new google.maps.places.PlacesService(map);
    infoWindow = new google.maps.InfoWindow;
    circle = new google.maps.Circle({
        strokeColor: '#FF970D',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        fillColor: '#FFF',
        fillOpacity: 0.5
    });

    markers = [];

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
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
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

//Search with given parameters
function search() {
    if (navigator.geolocation) {
        clearMarker();

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
            service.nearbySearch(request, callback);
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    }
}

//Remove previous markers from Map
function clearMarker() {
    if (markers.length > 0) {
        for (var i = 0; i < markers.length; i++)
            this.markers[i].setMap(null);

        this.markers = new Array();
        infoWindow.setMap(null);
    }
}

//Draw the circle
function getCircle(magnitude) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'blue',
        fillOpacity: .2,
        scale: Math.pow(2, magnitude) / 2,
        strokeColor: 'white',
        strokeWeight: .5
    };
}

//Place marker on Map
function createMarker(place) {
    if (place.reference == null || place == null)
        return;

    var request = { reference: place.reference };
    infoWindow = new google.maps.InfoWindow;

    google.maps.event.addListenerOnce(map, 'idle', function () {
        jQuery('.gm-style-iw').prev('div').remove();
    });

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
            this.markers.push(start);
            this.markers.push(end);

            populateData(place, details);

            calculateAndDisplayRoute(place.geometry.location);
        }
    });
}

//Display result data
function populateData(place, details) {
  $('.slide-info').css('margin-left', '-30vw');

  //Initialize info objects
  var title = document.getElementById('resTitle');
  var address = document.getElementById('resAddr');
  var phone = document.getElementById('resPhone');
  var website = document.getElementById('resWebsite');
  var price = document.getElementById('resPrice');
  var rating = document.getElementById('resRating');

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
  }, 600);


  price.innerText = "";
  if (place.price_level != NaN && place.price_level >= 0) {
      for (var i = 0; i < place.price_level * 1; i++)
          price.innerText += "$";
  }
}

//Display the driving route
function calculateAndDisplayRoute(dest) {
    directionsService.route({
        origin: currentPos,
        destination: dest,
        travelMode: 'DRIVING'
    }, function (response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
            map.setCenter(dest);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

//Callback function, gets random location result
function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK)
        createMarker(results[Math.floor(Math.random() * results.length)]);
}

//Alert user for location error
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}
