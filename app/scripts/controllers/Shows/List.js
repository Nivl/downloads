'use strict';

var tz = moment().tz('America/Los_Angeles');
var v = App.Shows.v;
var f = App.Shows.f;

angular.module('app-controllers').controller('ShowController', ['$http', '$filter', '$modal', 'Show',  function ($http, $filter, $modal, Show) {
  var that = this;
  this.days = v.showsByDay;

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

    var showIndex = f.findShow(showId, currentDay);

    if (showIndex !== false) {
      var show = that.days[currentDay].shows[showIndex];
      show.day = newDay + 1;

      f.swapShow(showId, currentDay, newDay);

      show.$update({}, function (response) { return response; }, function (response) {
        // on error, we revert
        show.day = currentDay;

        f.swapShow(showId, newDay, currentDay);

        return response;
      });
    }
  };
}]);
