import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './lib/maps.js';
import './main.html';

//API Key
//AIzaSyAGLwBMoMdTphOdniyoL-YTBACYc01BwNo

//Load Maps API
Meteor.startup(function() {
    GoogleMaps.load({ v: '3', key: 'AIzaSyAGLwBMoMdTphOdniyoL-YTBACYc01BwNo', libraries: 'geometry,places' });
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

  search: function() {
    search();
  },
});

Template.formsection.onCreated(function() {
  GoogleMaps.ready('foodMap', function(map) {
    Meteor.mapfunctions.initMap(GoogleMaps.maps.foodMap.instance);
  })
});

Template.formsection.events({
  'change #category' : function(event, template) {
    event.preventDefault();

    var section = template.$('#titleSection')[0];
    var selector = template.$('#category')[0];
    var selection = selector.options[selector.selectedIndex].text;

    section.style.backgroundImage = "url('/img/" + selection + ".jpg')";

    console.log(section);
  },

  "mousedown #launch": function(event, template) {
    $.fn.fullpage.setAllowScrolling(false);
    Meteor.mapfunctions.search();
  },

  "mousedown #location": function(event, template) {
    Meteor.mapfunctions.tryGeolocation(GoogleMaps.maps.foodMap.instance);
  }
});

Template.mapsection.helpers({
  mapOptions: function() {
    if (GoogleMaps.loaded()) {
      return {
        center: new google.maps.LatLng(-34.397, 150.644),
        zoom: 15
      };
    }
  }
});

Template.mapsection.events({
  "mousedown #reroll": function(event, template) {
    Meteor.mapfunctions.search();
  },

  "mousedown #navigate": function(event, template) {
    Meteor.mapfunctions.launchMaps();
  },

  "mousedown #modalClose": function(event, template) {
    $('#modal').css("opacity", "0");
  },

  "mousedown #back": function(event, template) {
    $.fn.fullpage.setAllowScrolling(true);
  }
});
