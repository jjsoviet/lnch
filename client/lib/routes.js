//Home Route
FlowRouter.route( '/', {
  action: function() {
    BlazeLayout.render('applicationLayout', {
      main: 'home'
    })
  },
  name: 'home'
});
