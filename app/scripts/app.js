
angular.module('app', ['app-controllers', 'app-directives', 'app-filters', 'ui.bootstrap']);
angular.module('app-controllers', []);
angular.module('app-directives', []);
angular.module('app-filters', []);

require('scripts/controllers/*');
require('scripts/filters/*');
require('scripts/directives/*');

require('scripts/custom');