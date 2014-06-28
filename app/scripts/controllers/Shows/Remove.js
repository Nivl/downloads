'use strict';

var v = App.Shows.v;
var f = App.Shows.f;

angular.module('app-controllers').controller('RemoveShowController', ['$scope', '$modalInstance', '$http', 'show', function RemoveShowController($scope, $modalInstance, $http, show) {
  $scope.show = show;

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.removeShow = function () {
    var showIndex = f.findShow(show._id, show.day - 1);

    if (showIndex !== false) {
      v.showsByDay[show.day - 1].shows.splice(showIndex, 1);
      show.$delete();
    }
    $modalInstance.dismiss();
  };
}]);