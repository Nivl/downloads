'use strict';

App.Show = DS.Model.extend({
  title: DS.attr('string'),
  downloadLink: DS.attr('string'),
  wikipedia: DS.attr('string'),
  day: DS.attr('number'),
  returnDate: DS.attr('string'),
  isCompleted: DS.attr('boolean'),
  isCancelled: DS.attr('boolean'),
  markedForDeletionDate: DS.attr('date'),

  isPaused: function () {
    console.log(this.get('returnDate'));
    return (this.get('returnDate') !== '');
  }.property('id'),

  anchorSlug: function () {
    return '#' + this.get('slug');
  }.property('id'),

  slug: function () {
    var title = this.get('title')
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');

    return title + '-' + this.get('id');
  }.property('id')
});

App.Show.FIXTURES = [
  {
    id: 1,
    title: 'Lost',
    downloadLink: '#',
    wikipedia: '#',
    day: 1,
    returnDate: '',
    isCompleted: false,
    isCancelled: false
  },
  {
    id: 2,
    title: 'Dexter',
    downloadLink: '#',
    wikipedia: '#',
    day: 1,
    returnDate: '',
    isCompleted: false,
    isCancelled: false
  },
  {
    id: 3,
    title: 'Once Upon a time',
    downloadLink: '#',
    wikipedia: '#',
    day: 3,
    returnDate: '',
    isCompleted: true,
    isCancelled: false
  },
  {
    id: 4,
    title: 'Californication',
    downloadLink: '#',
    wikipedia: '#',
    day: 5,
    returnDate: '???',
    isCompleted: false,
    isCancelled: false
  },
  {
    id: 5,
    title: 'Game Of Thrones',
    downloadLink: '#',
    wikipedia: '#',
    day: 5,
    returnDate: '',
    isCompleted: false,
    isCancelled: true
  }
];
