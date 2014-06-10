window.App = Ember.Application.create();
App.ApplicationAdapter = DS.FixtureAdapter.extend();

Ember.TextSupport.reopen({
    attributeBindings: ['required']
  });

require('scripts/controllers/*');
require('scripts/store');
require('scripts/models/*');
require('scripts/routes/*');
require('scripts/views/*');
require('scripts/router');

require('scripts/custom');
