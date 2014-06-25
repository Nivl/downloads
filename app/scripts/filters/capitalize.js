'use strict';

angular.module('app-filters').filter('capitalize', function () {
  return function (input) {
    input = input || '';

    var out = input.charAt(0).toUpperCase() + input.slice(1); // Only works on the first chars, obviously...
    var find = ['A ', ' An ', ' The ', ' At ', ' By ', ' For ', ' In ', ' Of ', ' On ', ' To ',
      ' Up ', ' And ', ' As ', ' But ', ' It ', ' Or ', ' Nor '];
    var replace = [' a ', ' an ', ' the ', ' at ', ' by ', ' for ', ' in ', ' of ', ' on ',
      ' to ', ' up ', ' and ', ' as ', ' but ', ' it ', ' or ', ' nor '];

    var regex;
    for (var i = 0; i < find.length; i += 1) {
      regex = new RegExp(find[i], 'g');
      out = out.replace(regex, replace[i]);
    }

    return out;
  };
});