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

function findWeekIndex(name) {
  for (var i = 0; i < 7; i += 1) {
    if (showsByDay[i].name === name) {
      return i + 1;
    }
  }
  return null;
}

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

angular.module('app-controllers').controller('AddShowController', ['$scope', '$modalInstance', '$filter', '$http', '$q', 'Show', 'data', 'type',  function AddShowController($scope, $modalInstance, $filter, $http, $q, Show, data, type) {
  var show = null;
  var defaultShow = {};
  var initialDay = 0;

  var httpRequests = {
    wikipedia: null,
    info: {
      searchShow: null,
      getIds: null,
      fetchInfo: null
    }
  };

  if (type === 'edit') {
    show = data;
    initialDay = show.day; // needed to see changed day
    $scope.show = show;
  } else if (data >= 0 && data <= 6) {
    defaultShow = {
      ids: {},
      title: ''
    };

    $scope.show = {};
    angular.copy(defaultShow, $scope.show);
  }

  $scope.anim = {
    info: false,
    wikipedia: false
  };

  // TODO Handle ' like in Grey's anatomy
  $scope.titleEntered = function () {
    $scope.show.title = $filter('capitalize')($scope.show.title).trim();
  };

  $scope.cancelRequests = function () {
    if (httpRequests.info.fetchInfo !== null) {
      httpRequests.info.fetchInfo.resolve('canceled by user');
      httpRequests.info.fetchInfo = null;
    }

    if (httpRequests.info.getIds) {
      httpRequests.info.getIds.resolve('canceled by user');
      httpRequests.info.getIds = null;
    }

    if (httpRequests.info.searchShow) {
      httpRequests.info.searchShow.resolve('canceled by user');
      httpRequests.info.searchShow = null;
    }

    if (httpRequests.wikipedia !== null) {
      httpRequests.wikipedia.resolve('canceled by user');
      httpRequests.wikipedia = null;
    }

    $scope.anim.info = false;
    $scope.anim.wikipedia = false;
  };

  function startRequests() {
    $scope.cancelRequests();

    httpRequests.info.fetchInfo = $q.defer();
    httpRequests.info.searchShow = $q.defer();
    httpRequests.info.getIds = $q.defer();
    httpRequests.info.wikipedia = $q.defer();
  }

  $scope.fetchInfo = function () {
    startRequests();

    $scope.anim.info = true;

    if ($scope.show.title.length > 0) {
      var searchUri = 'https://api.themoviedb.org/3/search/tv?query=' + $scope.show.title + '&api_key=c9a3d5cd37bcdbd7e45fdb0171762e07&callback=JSON_CALLBACK';

      $http.jsonp(searchUri, {timeout: httpRequests.info.searchShow.promise}).success(function (data) {
        /*jshint camelcase: false*/
        if (data.total_results > 0) {
          var result = data.results[0];

          $scope.show.ids.tmdbId = result.id;
          $scope.show.poster = result.poster_path;

          if ($scope.show.title !== result.original_name) {
            $scope.show.title = result.original_name;
            $scope.fetchWikipedia();
          }

          var idsUri = 'https://api.themoviedb.org/3/tv/' + result.id + '/external_ids?api_key=c9a3d5cd37bcdbd7e45fdb0171762e07&callback=JSON_CALLBACK';
          $http.jsonp(idsUri, {timeout: httpRequests.info.getIds.promise}).success(function (ids) {
            $scope.show.ids.imdbId = ids.imdb_id;
            $scope.show.ids.tvrageId = ids.tvrage_id;

            var infoUrl = 'http://0.0.0.0:3000/shows/fetch-info/';
            $http.post(infoUrl, $scope.show, {timeout: httpRequests.info.fetchInfo.promise}).success(function (data) {
              console.log(data);

              if (data.synopsis) {
                $scope.show.synopsis = data.synopsis;
              }

              if (data.Airtime) {
                var info = data.Airtime.split(' at ');
                $scope.show.day = findWeekIndex(info[0]);
              }

              if (data['Next Episode'] && data['Next Episode'][2]) {
                $scope.show.nextEpisode = {'title': data['Next Episode'][1], date: data['Next Episode'][2]};
              }

              if (data['Latest Episode'] && data['Latest Episode'][2]) {
                $scope.show.latestEpisode = {'title': data['Latest Episode'][1], date: data['Latest Episode'][2]};
              }

              $scope.anim.info = false;
            });
          });

        }
        /*jshint camelcase: true*/
      });
    } else {
      $scope.anim.info = false;
    }
  };

  $scope.fetchWikipedia = function () {
    startRequests();

    if ($scope.show.title.length > 0) {
      $scope.anim.wikipedia = true;

      var encodedTitle = $scope.show.title.replace(/ /g, '_');
      var jsonUrl = 'https://en.wikipedia.org/w/api.php?format=json&action=query&callback=JSON_CALLBACK&titles=List_of_' + encodedTitle + '_episodes';

      // todo use .always
      $http.jsonp(jsonUrl, {timeout: httpRequests.wikipedia.promise}).success(function (data) {
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
      size: 'lg',
      resolve: {
        data: function () { return data || null; },
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
