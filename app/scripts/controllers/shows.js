'use strict';

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


function findShow(showId, day) {
  if (day >= 0 && day <= 6) {
    var length = showsByDay[day].shows.length;

    for (var index = 0; index < length; index += 1) {
      if (showsByDay[day].shows[index]._id === showId) {
        return index;
      }
    }
  }

  return false;
}

function swapShow(showId, from, to) {
  var showIndex = findShow(showId, from);

  showsByDay[to].shows.push(showsByDay[from].shows[showIndex]);
  showsByDay[from].shows.splice(showIndex, 1);
}

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
    var showIndex = findShow(show._id, show.day - 1);

    if (showIndex !== false) {
      if ($scope.formData.status === 'remove') {
        showsByDay[show.day - 1].shows.splice(showIndex, 1);
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

angular.module('app-controllers').controller('AddShowController', ['$scope', '$modalInstance', '$filter', '$http', 'Show', 'data', 'type',  function AddShowController($scope, $modalInstance, $filter, $http, Show, data, type) {
  var show = null;
  var defaultShow = {};
  var initialDay = 0;

  if (type === 'edit') {
    show = data;
    initialDay = show.day;
    $scope.show = show;
    $scope.show.isAiring = typeof show.returnDate === 'undefined' || show.returnDate.length === 0;
  } else if (data >= 0 && data <= 6) {
    defaultShow = {
      title: '',
      day: data + 1,
      isAiring: true
    };

    $scope.show = {};
    angular.copy(defaultShow, $scope.show);
  }

  $scope.anim = {
    wikipedia: false,
    downloadLink: false
  };

  $scope.addShow = function () {
    if (type === 'edit') {
      show.$update({}, function (show) {
        if (show.day !== initialDay) {
          swapShow(show._id, initialDay - 1, show.day - 1);
        }
        $modalInstance.close();
      });
    } else {
      Show.save($scope.show, function (show) {
        showsByDay[show.day - 1].shows.push(show);

        console.log('Close modal');
        angular.copy(defaultShow, $scope.show);
        // $modalInstance.close();
      });
    }
  };

  // TODO use the tvdb API to find the airing day or returning date
  // TODO Handle ' like in Grey's anatomy
  $scope.titleEntered = function () {
    $scope.show.title = $filter('capitalize')($scope.show.title).trim();

    $scope.fetchWikipedia();
    $scope.fetchDownloadLink();
  };

  $scope.fetchWikipedia = function () {
    if ($scope.show.title.length > 0) {
      $scope.anim.wikipedia = true;

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
    if ($scope.show.title.length > 0) {
      $scope.anim.downloadLink = true;
      $scope.anim.downloadLink = false;
    }
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);



angular.module('app-controllers').controller('ShowController', ['$http', '$filter', '$modal', 'Show',  function ($http, $filter, $modal, Show) {
  var that = this;
  this.days = showsByDay;

  this.yesterdaysShows = function () {
    var yesterday = tz.isoWeekday() - 2; // -1 for yesterday, -1 for the index

    if (yesterday < 0 || yesterday > 6) {
      return [];
    } else {
      return that.days[yesterday].shows;
    }
  };

  Show.query(function (shows) {
    var length = shows.length;

    for (var i = 0; i < length; i += 1) {
      if (shows[i] instanceof Show) {
        var show = shows[i];

        that.days[show.day - 1].shows.push(show);
      }
    }
  });

  // Takes the day number, or the show to edit
  this.addOrEdit = function (data) {
    $modal.open({
      templateUrl: '../../partials/modals/addShow.html', // TODO: Change title and submit button
      controller: 'AddShowController',
      resolve: {
        data: function () { return data; },
        type: function () { return (data instanceof Show) ? ('edit') : ('add'); }
      }
    });
  };

  this.remove = function (show) {
    $modal.open({
      templateUrl: 'partials/modals/removeShow.html',
      controller: 'RemoveShowController',
      resolve: {
        show: function () { return show; }
      }
    });
  };

  this.dropped = function (dragEl, dropEl) {
    var dragId = angular.element(dragEl).attr('id');

    var newDay = parseInt(angular.element(dropEl).attr('id'), 10);
    var currentDay = dragId.substr(-1) - 1;
    var showId = dragId.substr(0, dragId.length - 2);

    var showIndex = findShow(showId, currentDay);

    if (showIndex !== false) {
      var show = that.days[currentDay].shows[showIndex];
      show.day = newDay + 1;

      swapShow(showId, currentDay, newDay);

      show.$update({}, function (response) { return response; }, function (response) {
        // on error, we revert
        show.day = currentDay;

        swapShow(showId, newDay, currentDay);

        return response;
      });
    }
  };
}]);
