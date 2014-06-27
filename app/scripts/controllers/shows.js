'use strict';

// TODO: split the file

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

// todo replace animInfo by $scope.fetching
// todo reset the fetching object when we refetch the data
// todo put on error the non fetched data when the user cancel a request
angular.module('app-controllers').controller('AddShowController', ['$scope', '$modalInstance', '$filter', '$http', '$q', 'Show', 'data', 'type',  function AddShowController($scope, $modalInstance, $filter, $http, $q, Show, data, type) {
  var show = null;
  var defaultShow = {};
  var initialDay = 0;

  var httpRequests = {
    wikipedia: null,
    info: {
      searchShow: null,
      getIds: null,
      fetchTvdb: null,
      fetchTvRage: null
    }
  };

  $scope.fetching = {
    tmdb : {
      text: 'text-danger',
      icon: 'glyphicon-remove'
    },
    tvdb : {
      text: 'text-danger',
      icon: 'glyphicon-remove'
    },
    tvrage : {
      text: 'text-danger',
      icon: 'glyphicon-remove'
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
    if (httpRequests.info.fetchTvdb !== null) {
      httpRequests.info.fetchTvdb.resolve('canceled by user');
      httpRequests.info.fetchTvdb = null;
    }

    if (httpRequests.info.fetchTvRage !== null) {
      httpRequests.info.fetchTvRage.resolve('canceled by user');
      httpRequests.info.fetchTvRage = null;
    }

    if (httpRequests.info.getIds !== null) {
      httpRequests.info.getIds.resolve('canceled by user');
      httpRequests.info.getIds = null;
    }

    if (httpRequests.info.searchShow !== null) {
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

    httpRequests.info.fetchTvdb = $q.defer();
    httpRequests.info.fetchTvRage = $q.defer();
    httpRequests.info.searchShow = $q.defer();
    httpRequests.info.getIds = $q.defer();
    httpRequests.wikipedia = $q.defer();
  }

  function queryTmdbForIds() {
    $scope.fetching.tmdb.text = '';
    $scope.fetching.tmdb.icon = 'glyphicon-refresh';

    var idsUri = 'https://api.themoviedb.org/3/tv/' + $scope.show.ids.tmdbId + '/external_ids?api_key=c9a3d5cd37bcdbd7e45fdb0171762e07&callback=JSON_CALLBACK';

    $http.jsonp(idsUri, {timeout: httpRequests.info.getIds.promise}).success(function (ids) {
      if (_.isEmpty(ids) === false) {
        $scope.fetching.tmdb.text = 'text-success';
        $scope.fetching.tmdb.icon = 'glyphicon-ok';

        /*jshint camelcase: false*/
        $scope.show.ids.imdbId = ids.imdb_id;
        $scope.show.ids.tvrageId = ids.tvrage_id;
        /*jshint camelcase: true*/

        queryTvdb();

        if ($scope.show.ids.tvrageId) {
          queryTvRage();
        }
      } else {
        $scope.fetching.tmdb.text = 'text-error';
        $scope.fetching.tmdb.icon = 'glyphicon-remove';
      }
    }).error(function () {
      $scope.fetching.tmdb.text = 'text-error';
      $scope.fetching.tmdb.icon = 'glyphicon-remove';
    });
  }

  function queryTvdb() {
    var tvdbUrl = 'http://0.0.0.0:3000/shows/fetch/tvdb/';

    $scope.fetching.tvdb.text = '';
    $scope.fetching.tvdb.icon = 'glyphicon-refresh';

    $http.post(tvdbUrl, $scope.show, {timeout: httpRequests.info.fetchTvdb.promise}).success(function (data) {
      if (_.isEmpty(data) === false) {
        $scope.fetching.tvdb.text = 'text-success';
        $scope.fetching.tvdb.icon = 'glyphicon-ok';

        $scope.show.synopsis = data.Overview;

        if ($scope.show.ids.tvrageId === null) {
          if ($scope.show.title !== data.Overview) {
            $scope.show.alternateTitle = data.SeriesName;
            queryTvRage();
          }
        }
      } else {
        $scope.fetching.tvdb.text = 'text-error';
        $scope.fetching.tvdb.icon = 'glyphicon-remove';
      }
    }).error(function () {
      $scope.fetching.tvdb.text = 'text-error';
      $scope.fetching.tvdb.icon = 'glyphicon-remove';
    });
  }

  function queryTvRage() {
    $scope.fetching.tvrage.text = '';
    $scope.fetching.tvrage.icon = 'glyphicon-refresh';

    var tvRageUrl = 'http://0.0.0.0:3000/shows/fetch/tvrage/';

    $http.post(tvRageUrl, $scope.show, {timeout: httpRequests.info.fetchTvRage.promise}).success(function (data) {
      if (_.isEmpty(data) === false) {
        $scope.fetching.tvrage.text = 'text-success';
        $scope.fetching.tvrage.icon = 'glyphicon-ok';

        if (data.id) {
          $scope.show.ids.tvrageId = data.id;
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
      } else {
        $scope.fetching.tvrage.text = 'text-error';
        $scope.fetching.tvrage.icon = 'glyphicon-remove';
      }
    }).error(function () {
      $scope.fetching.tvrage.text = 'text-error';
      $scope.fetching.tvrage.icon = 'glyphicon-remove';
    });
  }

  function queryTmdb() {
    var searchUri = 'https://api.themoviedb.org/3/search/tv?query=' + $scope.show.title + '&api_key=c9a3d5cd37bcdbd7e45fdb0171762e07&callback=JSON_CALLBACK';

    // handle search fail
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

        queryTmdbForIds();
      } else {
        $scope.fetching.tmdb.text = 'text-error';
        $scope.fetching.tmdb.icon = 'glyphicon-remove';
      }
      /*jshint camelcase: true*/
    }).error(function () {
      $scope.fetching.tmdb.text = 'text-error';
      $scope.fetching.tmdb.icon = 'glyphicon-remove';
    });
  }

  // TODO: Reset the show before making the request
  // TODO: Allow the possibility to force ids
  $scope.fetchInfo = function () {
    startRequests();

    $scope.fetchWikipedia();

    $scope.anim.info = true;

    if ($scope.show.title.length > 0) {
      queryTmdb();
    } else {
      $scope.anim.info = false;
    }
  };

  // TODO: use alternate name
  $scope.fetchWikipedia = function () {
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
