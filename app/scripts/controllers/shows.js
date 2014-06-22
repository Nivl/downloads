'use strict';

var apiURL = 'http://0.0.0.0:3000/';
var tz = moment().tz('America/Los_Angeles');

var showsByDay = [
  {name: 'Monday', shows: []},
  {name: 'Tuesday', shows: []},
  {name: 'Wednesday', shows: []},
  {name: 'Thursday', shows: []},
  {name: 'Friday', shows: []},
  {name: 'Saturday', shows: []},
  {name: 'Sunday', shows: []}
];



angular.module('app-controllers').controller('RemoveShowController', ['$scope', '$modalInstance', '$http', 'id', function RemoveShowController($scope, $modalInstance, $http, id) {
  $scope.formData = {
    status: 'cancelled'
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.removeShow = function () {
    var day = parseInt(id.substr(-1), 10) - 1;
    var showId = id.substr(0, id.length - 2);
    var url = apiURL + 'shows/' + showId + '/';

    if (day >= 0 && day <= 6) {
      // getShowById -> return ID or false;
      var length = showsByDay[day].shows.length;
      var found = false;

      for (var index = 0; index < length; index += 1) {
        if (showsByDay[day].shows[index]._id === showId) {
          found = true;
          break;
        }
      }

      if (found) {
        if ($scope.formData.status === 'remove') {
          console.log('remove');

          $http.delete(url).success(function () {
            showsByDay[day].shows.splice(index, 1);
          }).finally(function () {
            $modalInstance.dismiss();
          });
        } else {
          var data = ($scope.formData.status === 'completed') ? {isCompleted: true, isCancelled: false} : {isCompleted: false, isCancelled: true};

          $http.put(url, {'formData': data}).success(function () {
            if ($scope.formData.status === 'completed') {
              showsByDay[day].shows[index].isCompleted = true;
              showsByDay[day].shows[index].isCancelled = false;
            } else {
              showsByDay[day].shows[index].isCompleted = false;
              showsByDay[day].shows[index].isCancelled = true;
            }
          }).finally(function () {
            $modalInstance.dismiss();
          });
        }
      }
    }
  };
}]);



angular.module('app-controllers').controller('AddShowController', ['$scope', '$modalInstance', '$filter', '$http',  function AddShowController($scope, $modalInstance, $filter, $http) {
  var defaultShow = {
    day: 1
  };

  $scope.show = {};
  angular.copy(defaultShow, $scope.show);

  $scope.anim = {
    wikipedia: false,
    downloadLink: false
  };

  $scope.addShow = function () {
    $http.post(apiURL + 'shows/', {'formData': $scope.show}).success(function (data) {
      showsByDay[data.day - 1].shows.push(data);

      console.log('Close modal');
      angular.copy(defaultShow, $scope.show);
      // $modalInstance.close();
    });
  };

  // TODO use the tvdb API to find the airing day or returning date
  // TODO Handle ' like in Grey's anatomy
  $scope.titleEntered = function () {
    $scope.show.title = $filter('capitalize')($scope.show.title).trim();

    $scope.fetchWikipedia();
    $scope.fetchDownloadLink();
  };

  $scope.fetchWikipedia = function () {
    $scope.anim.wikipedia = true;

    if ($scope.show.title.length > 0) {
      var encodedTitle = $scope.show.title.replace(/ /g, '_');
      var jsonUrl = 'https://en.wikipedia.org/w/api.php?format=json&action=query&callback=JSON_CALLBACK&titles=List_of_' + encodedTitle + '_episodes';

      // todo use .always
      $http.jsonp(jsonUrl).success(function (data) {
        try {
          if (data.query.pages[-1].missing === '') {
            // TODO: fallback on the page of the show
          }
        } catch (err) {
          $scope.show.wikipedia = 'https://en.wikipedia.org/wiki/List_of_' + encodedTitle + '_episodes';
        }
        $scope.anim.wikipedia = false;
      }).error(function () {
        $scope.anim.wikipedia = false;
      });
    }

  };

  $scope.fetchDownloadLink = function () {
    $scope.anim.downloadLink = true;
    if ($scope.show.title.length > 0) {

    }
    $scope.anim.downloadLink = false;
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);



angular.module('app-controllers').controller('ShowController', ['$http', '$filter', '$modal',  function ($http, $filter, $modal) {
  var that = this;
  this.days = showsByDay;

  this.yesterdaysShows = function () {
    var yesterday = tz.isoWeekday() - 2; // -1 for yesterday, -1 for the index

    console.log(yesterday);

    if (yesterday < 0 || yesterday > 6) {
      return [];
    } else {
      return that.days[yesterday].shows;
    }
  };

  $http.get(apiURL + 'shows/').success(function (data) {
    for (var i = 0; i < 7; i += 1) {
      that.days[i].shows = $filter('filter')(data, {day: i + 1}, true);
    }
  });

  this.open = function () {
    $modal.open({
      templateUrl: 'partials/directives/addShow.html',
      controller: 'AddShowController'
    });
  };

  this.edit = function () {
    console.log('todo');
  };

  this.remove = function (id) {
    $modal.open({
      templateUrl: 'partials/modals/removeShow.html',
      controller: 'RemoveShowController',
      resolve: {
        id: function () { return id; }
      }
    });
  };

  this.dropped = function (dragEl, dropEl) {
    // use show.day - 1 instead of {{$parent.$index}}
    var dragId = angular.element(dragEl).attr('id');
    var dropId = angular.element(dropEl).attr('id');

    var newDay = parseInt(dropId, 10);
    var currentDay = dragId.substr(-1);
    var showId = dragId.substr(0, dragId.length - 2);

    if (newDay >= 0 && newDay <= 6) {
      var nbShows = that.days[currentDay].shows.length;

      for (var i = 0; i < nbShows; i += 1) {
        if (that.days[currentDay].shows[i]._id === showId) {
          that._swapShows(showId, currentDay, newDay, i);
          break;
        }
      }
    }
  };

  this._swapShows = function (showId, currentDay, newDay, index) {
    that.days[newDay].shows.push(that.days[currentDay].shows[index]);
    that.days[currentDay].shows.splice(index, 1);

    var url = apiURL + 'shows/' + showId + '/';
    var data = {formData: {day: newDay + 1}};

    $http.put(url, data).error(function () {
      that.revertSwap(showId, currentDay, newDay);
    });
  };

  this._revertSwap = function (showId, currentDay, newDay) {
    var nbShows = that.days[newDay].shows.length;

    for (var i = 0; i < nbShows; i += 1) {
      if (that.days[newDay].shows[i]._id === showId) {
        that.days[currentDay].shows.push(that.days[newDay].shows[i]);
        that.days[newDay].shows.splice(i, 1);
        break;
      }
    }
  };
}]);
