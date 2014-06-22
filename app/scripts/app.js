
angular.module('app', ['app-controllers', 'app-directives', 'app-filters', 'ui.bootstrap']);
angular.module('app-factories', ['ngResource']);
angular.module('app-controllers', ['app-factories']);
angular.module('app-directives', []);
angular.module('app-filters', []);

require('scripts/factories/*');
require('scripts/controllers/*');
require('scripts/filters/*');
require('scripts/directives/*');
