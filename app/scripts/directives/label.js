'use strict';

angular.module('app-directives').directive('label', ['$timeout', function ($timeout) {
  return {
    restrict: 'E',
    link: function ($scope, el, attrs, controller) {
      $timeout(function () {
        App.funcs.parseLabel(el);
      }, 0, false);
    }
  };
}]);
