import { Template } from 'meteor/templating';
import { Reactivelet } from 'meteor/reactive-var';
import './lib/maps.js';
import './main.html';

//API Key
//AIzaSyAGLwBMoMdTphOdniyoL-YTBACYc01BwNo

//Load Maps API
Meteor.startup(() => {
  //Load the Google Maps instance
  GoogleMaps.load({ v: '3', key: 'AIzaSyAGLwBMoMdTphOdniyoL-YTBACYc01BwNo', libraries: 'geometry,places' });

  //Default to the Title section on Refresh
  location.hash = "#titlePage";

  //Query for orientation
  Meteor.mapfunctions.checkOrientation();
});

//Template Helpers
Template.formsection.helpers({
  foodChoices: [
    { choice: "Barbecue", terms: "barbecue, bbq, grill"},
    { choice: "Burger", terms: "burger"},
    { choice: "Dessert", terms: "cake, yogurt, ice cream" },
    { choice: "Dimsum", terms: "chinese, dimsum" },
    { choice: "Gyro", terms: "gyro, mediterranean" },
    { choice: "Pasta", terms: "pasta, italian"},
    { choice: "Pancake", terms: "pancake, waffle, breakfast" },
    { choice: "Pizza", terms: "pizza, pizzeria" },
    { choice: "Ramen", terms: "ramen, noodle, japanese" },
    { choice: "Salad", terms: "salad, organic" },
    { choice: "Sushi", terms: "sushi, japanese" },
    { choice: "Steak", terms: "steak, steakhouse" },
    { choice: "Taco", terms: "taco, mexican" },
  ],

  distances: [
    { distance: 1, title: "One" },
    { distance: 3, title: "Three" },
    { distance: 5, title: "Five" },
    { distance: 10, title: "Ten" },
    { distance: 20, title: "Twenty" }
  ],

  search: () => {
    Meteor.mapfunctions.search();
  },
});

Template.formsection.onCreated(() => {
  GoogleMaps.ready('foodMap', function(map) {
    Meteor.mapfunctions.initMap(GoogleMaps.maps.foodMap.instance);
  })
});

Template.formsection.onRendered = () => {
    $.fn.fullpage.setAllowScrolling(false);
}

Template.formsection.events({
  'change #category' : (event, template) => {
    event.preventDefault();

    let section = template.$('#titleSection')[0];
    let selector = template.$('#category')[0];
    let selection = selector.options[selector.selectedIndex].text;

    section.style.backgroundImage = "url('/img/" + selection + ".jpg')";
  },

  "mousedown #launch": (event, template) => {
    $.fn.fullpage.setAllowScrolling(false);
    Meteor.mapfunctions.search();
  },

  "mousedown #location": (event, template) => {
    Meteor.mapfunctions.tryGeolocation(GoogleMaps.maps.foodMap.instance);
  }
});

Template.mapsection.helpers({
  mapOptions: () => {
    if (GoogleMaps.loaded()) {
      return {
        center: new google.maps.LatLng(-34.397, 150.644),
        zoom: 15
      };
    }
  }
});

Template.mapsection.events({
  "mousedown #reroll": (event, template) => {
    Meteor.mapfunctions.search();
  },

  "mousedown #navigate": (event, template) => {
    Meteor.mapfunctions.launchMaps();
  },

  "mousedown #modalClose": (event, template) => {
    $('#modal').css('z-index', '-1');
    $('#modal').css("opacity", '0');
    $.fn.fullpage.setAllowScrolling(true);
    location.hash = "#titlePage";
  },

  "mousedown #back": (event, template) => {
    $.fn.fullpage.setAllowScrolling(true);
    $('#modal').css('z-index', '-1');
    $('#modal').css('opacity', '0');
  }
});
