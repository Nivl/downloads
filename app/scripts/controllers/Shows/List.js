'use strict';

var tz = moment().tz('America/Los_Angeles');
var v = App.Shows.v;

angular.module('app-controllers').controller('ShowController', ['$http', '$filter', '$modal', 'Show',  function ($http, $filter, $modal, Show) {
  var that = this;
  this.days = v.showsByDay;

  this.yesterdaysShows = function () {
    var yesterday = tz.isoWeekday() - 2; // -1 for yesterday, -1 for the index

    if (yesterday === -1) {
      yesterday = 6;
    }

    if (yesterday < 0 || yesterday > 6) {
      return [];
    } else {
      return that.days[yesterday].shows;
    }
  };

  Show.query(function (shows) {
    var length = shows.length;

    for (var i = 0; i < length; i += 1) {
      var tz = moment().tz('America/Los_Angeles');

      if (shows[i] instanceof Show) {
        var show = shows[i];
        show.isPaused = show.isCancelled === false && show.isCompleted === false;

        if (show.isPaused) {
          try {
            var yesterday = (tz.isoWeekday() - 1 < 1) ? (7) : (tz.isoWeekday() - 1);

            if (show.day === yesterday) {
              if (show.latestEpisode && show.latestEpisode.date && /^\d+$/.test(show.latestEpisode.date)) {
                var last = moment(parseInt(show.latestEpisode.date, 10));

                if (last.isSame(tz.subtract('days', 1).valueOf(), 'day')) {
                  show.isPaused = false;
                  show.isCancelled = false;
                  show.isCompleted = false;
                }
              }
            } else {
              if (show.nextEpisode && show.nextEpisode.date && /^\d+$/.test(show.nextEpisode.date)) {
                var next = moment(parseInt(show.nextEpisode.date, 10));
                var today = tz.isoWeekday();
                var delta = (show.day >= today) ? (show.day - today) : ((7 - today) + show.day);

                if (next.isSame(tz.add('days', delta).valueOf(), 'day')) {
                  show.isPaused = false;
                }
              }
            }
          } catch (e) {
            console.log(show.title + ': ' + e);
          }
        }
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
}]);
