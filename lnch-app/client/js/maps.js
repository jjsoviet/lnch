var map;
var directionsService;
var directionsDisplay;
var service;
var currentPos;
var currentDest;
var circle;
var infoWindow;
var markers = [];

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
        strokeColor: '#FF795D',
        strokeOpacity: 0.4,
        strokeWeight: 3,
        fillColor: '#FFFFFF',
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

            map.setCenter(pos);
            circle.setMap(map);
            circle.setCenter(pos);
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

function updateDistance(val) {
    document.querySelector('#distanceOutput').value = val;

    circle.setRadius(val * 1609.34);

    if (val > 6)
        map.setZoom(12);
    else if (6 >= val && val > 3)
        map.setZoom(13);
    else if (3 >= val && val >= 1)
        map.setZoom(15);
    else
        map.setZoom(15);
}

function updatePrice(val) {
    var output = "";

    for (var i = 0; i < val; i++) {
        output += "$";
    }

    document.querySelector('#priceOutput').value = output;
}


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

            circle.setRadius(distance * 1609.34);

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

            service.nearbySearch(request, callback);
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    }
}

function clearMarker() {
    if (markers.length > 0) {
        for (var i = 0; i < markers.length; i++) {
            this.markers[i].setMap(null);
        }

        this.markers = new Array();
        infoWindow.setMap(null);
    }
}

function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        createMarker(results[Math.floor(Math.random() * results.length)]);
    }
}

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

            var title = document.getElementById('resTitle');
            title.innerText = place.name;

            var address = document.getElementById('resAddr');
            address.innerText = place.vicinity;

            var img = document.getElementById('resImg');

            if (place.photos != null) {
                img.innerHTML = "<img src=\"" + place.photos[0].getUrl({ 'maxWidth': 400, 'maxHeight': 300 }) + "\"></img>";
            }

            var phone = document.getElementById('resPhone');
            phone.innerText = (details.formatted_phone_number || "None");

            var website = document.getElementById('resWebsite');
            website.innerHTML = "<a href=\"" + (details.website || "None") + "\"\>Go to Website >></a>";

            var price = document.getElementById('resPrice');
            price.innerText = "";
            if (place.price_level != NaN && place.price_level >= 0) {
                for (var i = 0; i < place.price_level * 1; i++)
                    price.innerText += "$";
            }

            var rating = document.getElementById('resRating');
            rating.innerHTML = place.rating + " &#9733;";

            calculateAndDisplayRoute(marker.getPosition());
        }
    });
}

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

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}
