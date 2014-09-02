'use strict';

var f = App.Shows.f;

// Reset on Cancel or submit
var fetchingStatus = {
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
    fetchingStatus.setError('tvdb');
    fetchingStatus.setError('tvrage');
  },

  cancelAll: function () {
    httpRequests.hasBeenCancelled = true;
    var len = httpRequests.list.length;

    for (var i = 0; i < len; i += 1) {
      httpRequests.list[i].resolve('canceled by user');
    }

    httpRequests.list = [];

    if (fetchingStatus.hasSucceed('tvdb') === false) {
      fetchingStatus.setError('tvdb');
    }
    if (fetchingStatus.hasSucceed('tvrage') === false) {
      fetchingStatus.setError('tvrage');
    }
  }
};


// todo reset the fetching object when we refetch the data
angular.module('app-controllers').controller('AddShowController', ['$scope', '$modalInstance', '$filter', '$http', '$q', 'Show', 'data', 'type',  function ($scope, $modalInstance, $filter, $http, $q, Show, data, type) {
  var show = null;
  var initialDay = 0;

  $scope.fetching = fetchingStatus;
  $scope.cancelRequests = httpRequests.cancelAll;

  $modalInstance.result.then(function () {
    httpRequests.reset();
  }, function () {
    httpRequests.reset();
  });

  if (type === 'edit') {
    show = data;
    initialDay = show.day; // needed to see changed day
    $scope.show = show;
  } else if (data >= 0 && data <= 6) {
    $scope.show = {ids: {}, title: ''};
  }

  $scope.addShow = function () {
    httpRequests.reset();

    if (type === 'edit') {
      var callback = function (show) {
        if (show.day !== initialDay) {
          f.swapShow(show._id, initialDay - 1, show.day - 1);
        }
        $modalInstance.close();
      };

      if (show instanceof Show) {
        show.$update({}, callback);
      } else {
        Show.update(show, callback);
      }
    } else {
      Show.save($scope.show, function () { // automatically added by the websockets
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
      queryTvdb();
      queryTvRage();
    }
  };

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

        if (Array.isArray(data)) {
          data = data[0];
        }

        $scope.show.synopsis = data.Overview;
        $scope.show.ids.tvdb = data.seriesid;
        queryPoster();

      } else {
        $scope.fetching.setError('tvdb');
      }
    }).error(function () {
      $scope.fetching.setError('tvdb');
    });
  }

  function queryPoster() {
    if (httpRequests.hasBeenCancelled) {
      return;
    }

    var tvdbUrl = 'http://0.0.0.0:3000/shows/fetch/poster/';

    $scope.fetching.setFetching('tvdb');

    httpRequests.list.push($q.defer());
    $http.post(tvdbUrl, $scope.show, {timeout: _.last(httpRequests.list).promise}).success(function (data) {
      if (_.isEmpty(data) === false) {
        $scope.fetching.setSuccess('tvdb');


        $scope.show.poster = data.poster;
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
        // TODO Set isPaused

        $scope.fetching.setSuccess('tvrage');
        $scope.show.ids.tvrage = data['Show ID'];

        if (data.Status) {
          if (data.Status === 'Ended') {
            $scope.show.isCompleted = true;
            $scope.show.isCancelled = false;
          } else if (data.Status === 'Canceled') {
            $scope.show.isCompleted = false;
            $scope.show.isCancelled = true;
          }
        }

        $scope.show.day = null;
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

        if ($scope.show.day === null) {
          $scope.show.day = 8;
        }

      } else {
        $scope.fetching.setError('tvrage');
      }
    }).error(function () {
      $scope.fetching.setError('tvrage');
    });
  }
}]);
