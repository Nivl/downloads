'use strict';

var v = App.Shows.v;
var f = App.Shows.f;

App.Shows.v.showsByDay = [
  {name: 'Monday', shows: []},
  {name: 'Tuesday', shows: []},
  {name: 'Wednesday', shows: []},
  {name: 'Thursday', shows: []},
  {name: 'Friday', shows: []},
  {name: 'Saturday', shows: []},
  {name: 'Sunday', shows: []}
];

App.Shows.f.findWeekIndex = function (name) {
  for (var i = 0; i < 7; i += 1) {
    if (v.showsByDay[i].name === name) {
      return i + 1;
    }
  }
  return null;
};

App.Shows.f.findShow = function (showId, day) {
  if (day >= 0 && day <= 6) {
    var length = v.showsByDay[day].shows.length;

    for (var index = 0; index < length; index += 1) {
      if (v.showsByDay[day].shows[index]._id === showId) {
        return index;
      }
    }
  }

  return false;
};

App.Shows.f.swapShow = function (showId, from, to) {
  var showIndex = f.findShow(showId, from);

  v.showsByDay[to].shows.push(v.showsByDay[from].shows[showIndex]);
  v.showsByDay[from].shows.splice(showIndex, 1);
};

require('scripts/controllers/Shows/Remove');
require('scripts/controllers/Shows/AddEdit');
require('scripts/controllers/Shows/List');



