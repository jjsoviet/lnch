import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

if (Meteor.isClient) {

  Template.formsection.helpers({
    foodChoices: [
      { choice: "Barbecue" },
      { choice: "Dimsum" },
      { choice: "Pizza" },
      { choice: "Sushi" },
      { choice: "Steak" }
    ],

    distances: [
      { distance: 1, title: "One" },
      { distance: 2, title: "Two" },
      { distance: 3, title: "Three" },
      { distance: 4, title: "Four" },
      { distance: 5, title: "Five" }
    ]
  });
}
