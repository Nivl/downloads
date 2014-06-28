'use strict';

window.App = {
  funcs: {},
  Shows: {
    v: {},
    f: {}
  }
};

angular.module('app', ['app-controllers', 'app-directives', 'app-filters', 'ui.bootstrap'])
  .config(function ($resourceProvider) {
    $resourceProvider.defaults.stripTrailingSlashes = false;
  });

angular.module('app-factories', ['ngResource']);
angular.module('app-controllers', ['app-factories']);
angular.module('app-directives', []);
angular.module('app-filters', []);


require('scripts/forms');
require('scripts/factories/*');
require('scripts/controllers/*');
require('scripts/filters/*');
require('scripts/directives/*');
