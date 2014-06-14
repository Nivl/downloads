'use strict';

angular.module('app-directives').directive('showList', function () {
  return {
    restrict: 'E',
    templateUrl: 'partials/directives/showList.html'
  };
});