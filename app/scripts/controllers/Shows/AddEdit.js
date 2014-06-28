'use strict';

var v = App.Shows.v;
var f = App.Shows.f;

var fetchingStatus = {
  tmdb : 1,
  tvdb : 1,
  tvrage : 1,

  data: {
    values: { //values are based on indexes (for icons and classes)
      fetching: 0,
      error: 1,
      success: 2
    },
    icons: [
      'glyphicon-refresh',
      'glyphicon-remove',
      'glyphicon-ok'
    ],
    classes: [
      '',
      'text-danger',
      'text-success'
    ]
  },

  _isValid: function (api) {
    return (_.has(this, api) && _.isNumber(this[api]));
  },

  _set: function (api, value) {
    if (_.has(this, api) && _.isNumber(this[api])) {
      this[api] = value;
    }
  },

  getIcon: function (api) {
    return (this._isValid(api)) ? (this.data.icons[this[api]]) : ('');
  },

  getClass: function (api) {
    return (this._isValid(api)) ? (this.data.classes[this[api]]) : ('');
  },

  setSuccess: function (api) {
    this._set(api, this.data.values.success);
  },

  setError: function (api) {
    this._set(api, this.data.values.error);
  },

  setFetching: function (api) {
    this._set(api, this.data.values.fetching);
  },

  hasSucceed: function (api) {
    return (_.has(this, api) && _.isNumber(this[api])) ? (this[api] === this.data.values.success) : (false);
  },

  hasFailed: function (api) {
    return (_.has(this, api) && _.isNumber(this[api])) ? (this[api] === this.data.values.error) : (false);
  },

  isFetching: function (api) {
    return (_.has(this, api) && _.isNumber(this[api])) ? (this[api] === this.data.values.fetching) : (false);
  }
};

var httpRequests = {
  list: [],
  hasBeenCancelled: false,

  reset: function () {
    httpRequests.list = [];
    httpRequests.hasBeenCancelled = false;
    fetchingStatus.setError('tmdb');
    fetchingStatus.setError('tvdb');
    fetchingStatus.setError('tvrage');
  },

  cancelAll: function () {
    console.log('cancelling');
    httpRequests.hasBeenCancelled = true;
    var len = httpRequests.list.length;

    for (var i = 0; i < len; i += 1) {
      httpRequests.list[i].resolve('canceled by user');
    }

    httpRequests.list = [];

    if (fetchingStatus.hasSucceed('tmdb') === false) {
      fetchingStatus.setError('tmdb');
    }
    if (fetchingStatus.hasSucceed('tvdb') === false) {
      fetchingStatus.setError('tvdb');
    }
    if (fetchingStatus.hasSucceed('tvrage') === false) {
      fetchingStatus.setError('tvrage');
    }
  }
};


// todo reset the fetching object when we refetch the data
// todo put on error the non fetched data when the user cancel a request
angular.module('app-controllers').controller('AddShowController', ['$scope', '$modalInstance', '$filter', '$http', '$q', 'Show', 'data', 'type',  function ($scope, $modalInstance, $filter, $http, $q, Show, data, type) {
  var show = null;
  var initialDay = 0;

  $scope.fetching = fetchingStatus;
  $scope.cancelRequests = httpRequests.cancelAll;

  if (type === 'edit') {
    show = data;
    initialDay = show.day; // needed to see changed day
    $scope.show = show;
  } else if (data >= 0 && data <= 6) {
    $scope.show = {ids: {}, title: ''};
  }

  $scope.addShow = function () {
    if (type === 'edit') {
      show.$update({}, function (show) {
        if (show.day !== initialDay) {
          f.swapShow(show._id, initialDay - 1, show.day - 1);
        }
        $modalInstance.close();
      });
    } else {
      Show.save($scope.show, function (show) {
        v.showsByDay[show.day - 1].shows.push(show);

        $modalInstance.close();
      });
    }
  };

  
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };


  // TODO: Allow the possibility to force ids
  $scope.fetchInfo = function () {
    httpRequests.reset();

    if ($scope.show.title.length > 0) {
      queryTmdb();
    }
  };

  function queryTmdb() {
    if (httpRequests.hasBeenCancelled) {
      return;
    }

    $scope.fetching.setFetching('tmdb');
    var searchUri = 'https://api.themoviedb.org/3/search/tv?query=' + $scope.show.title + '&api_key=c9a3d5cd37bcdbd7e45fdb0171762e07&callback=JSON_CALLBACK';

    httpRequests.list.push($q.defer());
    $http.jsonp(searchUri, {timeout: _.last(httpRequests.list).promise}).success(function (data) {
      /*jshint camelcase: false*/
      if (data.total_results > 0) {
        var result = data.results[0];

        $scope.show.ids.tmdbId = result.id;
        $scope.show.poster = result.poster_path;

        if ($scope.show.title !== result.original_name) {
          $scope.show.title = result.original_name;
        }

        queryTmdbForIds();
      } else {
        $scope.fetching.setError('tmdb');
      }
      /*jshint camelcase: true*/
    }).error(function () {
      $scope.fetching.setError('tmdb');
    });
  }

  function queryTmdbForIds() {
    if (httpRequests.hasBeenCancelled) {
      return;
    }

    var idsUri = 'https://api.themoviedb.org/3/tv/' + $scope.show.ids.tmdbId + '/external_ids?api_key=c9a3d5cd37bcdbd7e45fdb0171762e07&callback=JSON_CALLBACK';

    httpRequests.list.push($q.defer());
    $http.jsonp(idsUri, {timeout: _.last(httpRequests.list).promise}).success(function (ids) {
      if (_.isEmpty(ids) === false) {
        $scope.fetching.setSuccess('tmdb');

        /*jshint camelcase: false*/
        $scope.show.ids.imdbId = ids.imdb_id;
        $scope.show.ids.tvrageId = ids.tvrage_id;
        /*jshint camelcase: true*/

        queryTvdb();

        if ($scope.show.ids.tvrageId) {
          queryTvRage();
        }
      } else {
        $scope.fetching.setError('tmdb');
      }
    }).error(function () {
      $scope.fetching.setError('tmdb');
    });
  }

  function queryTvdb() {
    if (httpRequests.hasBeenCancelled) {
      return;
    }

    var tvdbUrl = 'http://0.0.0.0:3000/shows/fetch/tvdb/';

    $scope.fetching.setFetching('tvdb');

    httpRequests.list.push($q.defer());
    $http.post(tvdbUrl, $scope.show, {timeout: _.last(httpRequests.list).promise}).success(function (data) {
      if (_.isEmpty(data) === false) {
        $scope.fetching.setSuccess('tvdb');

        $scope.show.synopsis = data.Overview;

        if ($scope.show.ids.tvrageId === null) {
          if ($scope.show.title !== data.Overview) {
            $scope.show.alternateTitle = data.SeriesName;
            queryTvRage();
          }
        }
      } else {
        $scope.fetching.setError('tvdb');
      }
    }).error(function () {
      $scope.fetching.setError('tvdb');
    });
  }

  function queryTvRage() {
    if (httpRequests.hasBeenCancelled) {
      return;
    }

    $scope.fetching.setFetching('tvrage');

    var tvRageUrl = 'http://0.0.0.0:3000/shows/fetch/tvrage/';

    httpRequests.list.push($q.defer());
    $http.post(tvRageUrl, $scope.show, {timeout: _.last(httpRequests.list).promise}).success(function (data) {
      if (_.isEmpty(data) === false) {
        $scope.fetching.setSuccess('tvrage');

        if (data.id) {
          $scope.show.ids.tvrageId = data.id;
        }

        if (data.Airtime) {
          var info = data.Airtime.split(' at ');
          $scope.show.day = f.findWeekIndex(info[0]);
        }

        if (data['Next Episode'] && data['Next Episode'][2]) {
          $scope.show.nextEpisode = {'title': data['Next Episode'][1], date: data['Next Episode'][2]};
        }

        if (data['Latest Episode'] && data['Latest Episode'][2]) {
          $scope.show.latestEpisode = {'title': data['Latest Episode'][1], date: data['Latest Episode'][2]};
        }
      } else {
        $scope.fetching.setError('tvrage');
      }
    }).error(function () {
      $scope.fetching.setError('tvrage');
    });
  }
}]);
