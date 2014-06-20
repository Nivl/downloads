'use strict';

angular.module('app-directives').directive('nvClass', ['$rootScope', function ($rootScope) {
  return {
    restrict: 'A',
    link: function (scope, el, attrs, controller) {
      attrs.$observe('nvClass', function (value) {
        $rootScope.$on('LVL-DRAG-START', function () {
          console.log(
            value
          );
          attrs.$addClass(value);
        });

        $rootScope.$on('LVL-DRAG-END', function () {
          attrs.$removeClass(value);
        });
      });
    }
  };
}]);

angular.module('app-directives').directive('nvDraggable', ['$rootScope', function ($rootScope) {
  return {
    restrict: 'A',
    link: function (scope, el, attrs, controller) {
      angular.element(el).attr('draggable', 'true');

      attrs.$observe('id', function (value) {
        var id = value;

        el.bind('dragstart', function (e) {
          e.dataTransfer.setData('text', id);
          $rootScope.$emit('LVL-DRAG-START');
        });

        el.bind('dragend', function (e) {
          $rootScope.$emit('LVL-DRAG-END');
        });
      });
    }
  };
}]);

angular.module('app-directives').directive('nvDropTarget', ['$rootScope', function ($rootScope) {
  return {
    restrict: 'A',
    scope: {
      nvDrop: '&'
    },
    link: function (scope, el, attrs, controller) {
      attrs.$observe('id', function (value) {
        var id = value;

        el.bind('dragover', function (e) {
          if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
          }

          if (e.stopPropagation) {
            e.stopPropagation();
          }

          e.dataTransfer.dropEffect = 'move';
          return false;
        });

        el.bind('dragenter', function (e) {
          angular.element(e.target).addClass('lvl-over');
        });

        el.bind('dragleave', function (e) {
          angular.element(e.target).removeClass('lvl-over');  // this / e.target is previous target element.
        });

        el.bind('drop', function (e) {
          if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
          }

          if (e.stopPropogation) {
            e.stopPropogation(); // Necessary. Allows us to drop.
          }

          var data = e.dataTransfer.getData('text');
          var dest = document.getElementById(id);
          var src = document.getElementById(data);

          scope.nvDrop({dragEl: src, dropEl: dest});
        });

        $rootScope.$on('LVL-DRAG-START', function () {
          var el = document.getElementById(id);
          angular.element(el).addClass('lvl-target');
        });

        $rootScope.$on('LVL-DRAG-END', function () {
          var el = document.getElementById(id);
          angular.element(el).removeClass('lvl-target');
          angular.element(el).removeClass('lvl-over');
        });
      });
    }
  };
}]);