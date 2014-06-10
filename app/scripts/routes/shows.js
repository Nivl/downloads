'use strict';

App.ShowsRoute = Ember.Route.extend({
  model: function () {
    return this.store.find('show');
  }
});

// Faire une action fetchData qui load et fill les données