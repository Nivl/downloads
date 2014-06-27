'use strict';

// TODO Handle edition (add the move if the field is not empty)
function parseLabel(element) {
  console.log(element);

  var $el = $(element);
  var $form = $('#' + $el.attr('for'));

  var parentMargin = parseInt($form.parent().css('margin-left'), 10);
  var parentPadding = parseInt($form.parent().css('padding-left'), 10);
  var formPadding = parseInt($form.css('padding-left'), 10);

  var newLeft = parentMargin +  parentPadding + formPadding;
  $el.css('left', newLeft);
}

$(document).on('click', 'input[type=text]', function (e) {
  var $this = $(this);
  var id = $(this).attr('id');

  if ($('#' + id + '-left').length === 0 && $('#' + id + '-right').length === 0) {
    var $label = $('[for=' + $this.attr('id') + ']');

    if ($label.length > 0) {
      $label.addClass('move');
    }

    var bottom = $this.offset().top + $this.outerHeight() - 2;
    var xStart = $this.offset().left;
    var x = e.pageX - xStart;
    var width = $this.outerWidth();

    var $right = $('<div>')
      .addClass('input-border')
      .insertAfter('#' + id)
      .offset({top: bottom - 2, left: e.pageX})
      .width(0)
      .height(4)
      .attr('id', id + '-right');

    var $left = $('<div>')
      .addClass('input-border')
      .insertAfter('#' + id)
      .offset({top: bottom - 2, left: e.pageX})
      .width(0)
      .height(4)
      .attr('id', id + '-left');

    $right.offset({top: bottom}).width(width - x).height(2);
    $left.offset({top: bottom, left: xStart}).width(x).height(2);
  }
}).on('blur', 'input[type=text]', function () {
  var $this = $(this);

  if ($this.val().length === 0) {
    var $label = $('[for=' + $this.attr('id') + ']');

    if ($label.length > 0) {
      $label.removeClass('move');
    }
  }

  var id = $this.attr('id');
  $('#' + id + '-left').remove();
  $('#' + id + '-right').remove();
});