'use strict';

var v = App.Shows.v;
var f = App.Shows.f;

var alerts = [
];

function listenSocket(socket, ctrl, Show) {
  socket.on('addShow', function (show) {
    var showIndex = f.findShow(show._id, show.day - 1);

    if (showIndex === false) {
      v.showsByDay[show.day - 1].shows.push(show);
      alerts.push({
        type: 'success',
        msg: show.title + ' has been added.'
      });
    }
  });

  socket.on('updateShow', function (show) {
    var showIndex = f.findShow(show._id, show.day - 1);

    if (showIndex !== false) {
      var oldShow = v.showsByDay[show.day - 1].shows[showIndex];
      v.showsByDay[show.day - 1].shows[showIndex] = _.extend(oldShow, show);
      alerts.push({
        type: 'warning',
        msg: show.title + ' has been updated.'
      });
    }
  });

  socket.on('removeShow', function (data) {
    var id = data.id;
    var day = data.day;
    var showIndex = f.findShow(id, day - 1);

    if (showIndex !== false) {
      var title = v.showsByDay[day - 1].shows[showIndex].title;

      alerts.push({
        type: 'danger',
        msg: title + ' has been removed.'
      });
      v.showsByDay[day - 1].shows.splice(showIndex, 1);
    }
  });

  socket.on('maintenance', function (bool) {
    ctrl.status.maintenance = bool;

    if (bool === false) {
      reloadShows(Show, function () {
        alerts.push({
          type: 'warning',
          msg: 'All the shows have been updated.'
        });
      });
    }
  });
}

function reloadShows(Show, callback) {
  for (var i = 0; i < 7; i += 1) {
    App.Shows.v.showsByDay[i].shows = [];
  }

  Show.query(function (shows) {
    var length = shows.length;

    for (var i = 0; i < length; i += 1) {
      var today = moment().tz('America/Los_Angeles');

      if (shows[i] instanceof Show) {
        var show = shows[i];

        if (show.title === 'Pretty Little Liars') {
          console.log(show);
        }

        show.isPaused = (show.isCancelled === false && show.isCompleted === false);

        if (show.isPaused) {
          try {
            var yesterday = (today.isoWeekday() - 1 < 1) ? (7) : (today.isoWeekday() - 1);

            if (show.day === yesterday) {
              if (show.latestEpisode && show.latestEpisode.date && /^\d+$/.test(show.latestEpisode.date)) {
                var last = moment(parseInt(show.latestEpisode.date, 10)).tz('America/Los_Angeles');

                if (last.isSame(today.subtract('days', 1).valueOf(), 'day')) {
                  show.isPaused = false;
                  show.isCancelled = false;
                  show.isCompleted = false;
                }
              }
            } else {
              if (show.nextEpisode && show.nextEpisode.date && /^\d+$/.test(show.nextEpisode.date)) {
                var next = moment(parseInt(show.nextEpisode.date, 10)).tz('America/Los_Angeles');

                if (next.diff(today, 'days') < 6) {
                  show.isPaused = false;
                  show.isCancelled = false;
                  show.isCompleted = false;
                }
              }
            }
          } catch (e) {
            console.log(show.title + ': ' + e);
          }
        }
        v.showsByDay[show.day - 1].shows.push(show);
      }
    }

    if (_.isFunction(callback)) {
      callback();
    }
  });
}

angular.module('app-controllers').controller('ShowController', ['$http', '$filter', '$modal', 'Show', 'Socket',  function ($http, $filter, $modal, Show, Socket) {
  this.days = v.showsByDay;
  this.alerts = alerts;
  this.status = {
    maintenance: false
  };

  listenSocket(Socket, this, Show);
  reloadShows(Show);

  this.closeAlert = function (index) {
    alerts.splice(index, 1);
  };

  this.yesterdaysShows = function () {
    var tz = moment().tz('America/Los_Angeles');
    var yesterday = tz.isoWeekday() - 2; // -1 for yesterday, -1 for the index

    if (yesterday === -1) {
      yesterday = 6;
    }

    if (yesterday < 0 || yesterday > 6) {
      return [];
    } else {
      return v.showsByDay[yesterday].shows;
    }
  };

  // Takes the day number, or the show to edit
  this.addOrEdit = function (data) {
    $modal.open({
      templateUrl: '../../partials/modals/addShow.html', // TODO: Change title and submit button
      controller: 'AddShowController',
      size: 'lg',
      resolve: {
        data: function () { return data || null; },
        type: function () { return (typeof data !== 'undefined') ? ('edit') : ('add'); }
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
