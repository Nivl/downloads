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
    var yesterday = tz.isoWeekday() - 1;

    if (yesterday < 0 || yesterday > 6) {
      return [];
    } else {
      return showsByDay[yesterday].shows;
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

  this.swapShows = function (showId, currentDay, newDay, index) {
    that.days[newDay].shows.push(that.days[currentDay].shows[index]);
    that.days[currentDay].shows.splice(index, 1);

    var url = apiURL + 'shows/' + showId + '/';
    var data = {formData: {day: newDay + 1}};

    $http.put(url, data).error(function (data) {
      console.log('Fail');
      // We revert the shows
      var nbShows = that.days[newDay].shows.length;

      for (var i = 0; i < nbShows; i += 1) {
        if (that.days[newDay].shows[i]._id === showId) {
          that.days[currentDay].shows.push(that.days[newDay].shows[i]);
          that.days[newDay].shows.splice(i, 1);
          break;
        }
      }
    });
  };

  this.dropped = function (dragEl, dropEl) {
    console.log('dropped');

    var dragId = angular.element(dragEl).attr('id');
    var dropId = angular.element(dropEl).attr('id');

    var newDay = parseInt(dropId, 10);
    var currentDay = dragId.substr(-1);
    var showId = dragId.substr(0, dragId.length - 2);

    console.log('moving ' + showId + ' from ' + currentDay + ' to ' + newDay);

    if (newDay >= 0 && newDay <= 6) {
      var nbShows = that.days[currentDay].shows.length;

      for (var i = 0; i < nbShows; i += 1) {
        if (that.days[currentDay].shows[i]._id === showId) {
          that.swapShows(showId, currentDay, newDay, i);
          break;
        }
      }
    }
  };

  this.edit = function () {
    console.log('todo');
  };

  this.remove = function () {
    console.log('todo');
  };
}]);
