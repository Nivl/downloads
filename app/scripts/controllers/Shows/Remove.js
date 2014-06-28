'use strict';

var v = App.Shows.v;
var f = App.Shows.f;

angular.module('app-controllers').controller('RemoveShowController', ['$scope', '$modalInstance', '$http', 'show', function RemoveShowController($scope, $modalInstance, $http, show) {
  function getInitialStatus() {
    if (show.isCompleted) {
      return 'completed';
    } else if (show.isCancelled) {
      return 'cancelled';
    }
    return 'airing';
  }

  $scope.formData = {
    status: getInitialStatus()
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.removeShow = function () {
    var showIndex = f.findShow(show._id, show.day - 1);

    if (showIndex !== false) {
      if ($scope.formData.status === 'remove') {
        v.showsByDay[show.day - 1].shows.splice(showIndex, 1);
        show.$delete();
      } else {
        show.isCompleted = false;
        show.isCancelled = false;

        if ($scope.formData.status === 'completed') {
          show.isCompleted = true;
        } else if ($scope.formData.status === 'cancelled') {
          show.isCancelled = true;
        }

        show.$update();
      }
    }
    $modalInstance.dismiss();
  };
}]);