import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

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
  ]
});

Template.formsection.events({
  'change #category' : function(event, template) {
    event.preventDefault();

    var section = template.$('#titleSection')[0];
    var selector = template.$('#category')[0];
    var selection = selector.options[selector.selectedIndex].text;

    section.style.backgroundImage = "url('/img/" + selection + ".jpg')";

    console.log(section);
  }
})
