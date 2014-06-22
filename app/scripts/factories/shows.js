'use strict';

angular.module('app-factories').factory('Show', ['$resource', function ($resource) {

  return $resource('http://0.0.0.0:3000/shows/:Id/',
    {Id: '@_Id'},
    {
      update: {method: 'PUT'}
    }
    );
}]);