window.App = Ember.Application.create();

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
