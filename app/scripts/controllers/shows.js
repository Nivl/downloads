'use strict';

var apiURL = 'http://0.0.0.0:3000/';
var tz = moment().tz('America/Los_Angeles');

angular.module('app-controllers').controller('showController', ['$http', '$filter',  function ($http, $filter) {
  this.shows = {
    onMonday: [],
    onTuesday: [],
    onWednesday: [],
    onThursday: [],
    onFriday: [],
    onSaturday: [],
    onSunday: [],

    fromYesterday: function () {
      var days = [this.onSunday, this.onMonday, this.onTuesday, this.onWednesday, this.onThursday, this.onFriday, this.onSaturday];
      var yesterday = tz.format('d');

      if (yesterday < -1 || yesterday > 6) {
        return [];
      } else {
        return days[yesterday];
      }
    }
  };

  $http.get(apiURL + 'shows/').success(function (data) {
    console.log(data);
  });

}]);