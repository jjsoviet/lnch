//Initialize variables
var map;
var directionsService;
var directionsDisplay;
var service;
var currentPos;
var currentDest;
var circle;
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

            var request = {
                location: pos,
                radius: distance * 1609.34,
                type: ['restaurant', 'eatery', 'food'],
                name: [category.options[category.selectedIndex].value],
                keyword: [category.options[category.selectedIndex].value],
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
    if (place.reference == null)
        return;

    var request = { reference: place.reference };
    infoWindow = new google.maps.InfoWindow;

    google.maps.event.addListenerOnce(map, 'idle', function () {
        jQuery('.gm-style-iw').prev('div').remove();
    });

    service.getDetails(request, function (details, status) {
        if (details) {
            var marker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
                animation: google.maps.Animation.DROP
            });
            this.markers.push(marker);

            populateData(place, details);

            calculateAndDisplayRoute(marker.getPosition());
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
    address.innerText = place.vicinity;
    rating.innerHTML = place.rating + " <span>&#9733;</span>";
    phone.innerText = (details.formatted_phone_number || "None");
    website.innerHTML = "<a href=\"" + (details.website || "#") + "\"\>Go to Website <i class='material-icons'>keyboard_arrow_right</i></a>";

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
