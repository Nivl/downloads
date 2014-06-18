'use strict';

var apiURL = 'http://0.0.0.0:3000/';
var tz = moment().tz('America/Los_Angeles');

var dayToList = [
  'onSunday',
  'onMonday',
  'onTuesday',
  'onWednesday',
  'onThursday',
  'onFriday',
  'onSaturday'
];

var showList = {
  onMonday: [],
  onTuesday: [],
  onWednesday: [],
  onThursday: [],
  onFriday: [],
  onSaturday: [],
  onSunday: [],

  fromYesterday: function () {
    var yesterday = tz.format('d');

    if (yesterday < -1 || yesterday > 6) {
      return [];
    } else {
      var reference = dayToList[yesterday];
      return this[reference];
    }
  }
};

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

      angular.copy(defaultShow, $scope.show);

      console.log('Close modal');
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
  this.shows = showList;

  $http.get(apiURL + 'shows/').success(function (data) {
    for (var i = 0; i < 7; i += 1) {
      var reference = dayToList[i];
      that.shows[reference] = $filter('filter')(data, {day: i}, true);
    }
  });

  this.open = function () {
    $modal.open({
      templateUrl: 'partials/directives/addShow.html',
      controller: 'AddShowController'
    });
  };
}]);
