# LNCH

## Table of Contents
- [What is it?](#what-is-it)
- [How does it work?](#how-does-it-work)
- [Screenshots](#screenshots)
- [Issues](#issues)
  - [High Priority](#high-priority)
  - [Medium Priority](#medium-priority)
  - [Low Priority](#low-priority)
- [Updates](#updates)


## What is it?
LNCH is a food randomizer web application built on [Meteor.JS](https://www.meteor.com/) and using the [Google Maps JS API](https://developers.google.com/maps/documentation/javascript/adding-a-google-map), and designed to be very simple to use. Current design uses Alvaro Trigo's [fullPage.js](https://github.com/alvarotrigo/fullPage.js/) framework.

Ever wondered where you'd want to go for lunch on your break or when friends are asking you out? Leave the decision making to this application - simply set a general food genre and maximum distance from your location, and it will pick a place for you.

## How does it work?
LNCH has only two main parameters that users must provide: a food genre (barbecue, sushi, etc.) and a set maximum radius from the current current location. The app then "randomly" picks an eatery based on those criteria, and you can either navigate to it or reroll for a different place. 

Should one decide on a place to eat, pressing on the LNCH! button launches either the Google Maps application if installed on the phone, or a new tab on the browser with the correct Google Maps coordinates.

And since LNCH is location dependent, it is required for the user to provide it location permissions in order to determine his/her location. 

## Screenshots
### Splash Section 
![Splash 1](/lnch-app/public/screenshots/Splash_01.png?raw=true)
![Splash 2](/lnch-app/public/screenshots/Splash_02.png?raw=true)

###Search Results Section
![Result 1](/lnch-app/public/screenshots/Result_01.png?raw=true)
![Result 2](/lnch-app/public/screenshots/Result_02.png?raw=true)

## Issues
### High Priority
- [ ] Adjusting the map view upon orientation change or window resize is still janky; the current algorithm tries to pan and zoom out the map when start and end markers get overlapped by UI elements or go out of the viewport, and it's still imperfect - see the current [calculateOffset() function](lnch-app/client/lib/maps.js) for this.
### Medium Priority
- [x] UI elements not adjusting according to mobile device orientation, must be something with the CSS media queries.
- [ ] Images loading on the splash page take a while to load due to resolution, causing the transition between images disconnected; may need to implement something like lazy loading.
### Low Priority
- [x] Some UI designs not fully fleshed out or look bad on mobile, such as modal popups and slide animations.
- [x] May need to implement image results for the selected eateries, still not sure where to place them on the viewport.


## Updates
### November 15, 2017
Been a while since I've posted updates, I'll have to be more consistent in announcing new features/fixes. Anyway, as of this date I've been implementing some updates to the application. Some of those are:
- The JavaScript files now use ES6/ES2015 syntax such as block level variables and arrow functions
- Orientation calculation has been improved, now works more consistently for mobile devices
- Some UI quirks like popup modals have been improved and hopefully fixed

I've decided against adding another UI element, which is the image for the resulting establishment. It will take too much space in the viewport and will be especially cramped on mobile.
