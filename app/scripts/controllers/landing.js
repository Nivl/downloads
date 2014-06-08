'use strict';

function signIn(that, email, password, onFail, onSuccess) {
  if (typeof onFail !== 'function') {
    onFail = $.noop;
  }

  if (typeof onSuccess !== 'function') {
    onSuccess = $.noop;
  }

  /*jslint camelcase: false*/
  $.post(API.URL_SIGNIN, {
    client_id: API.KEY,
    client_secret: API.SECRET,
    username: email,
    password: password,
    grant_type: 'password'
  }).then(function (response) {
    onSuccess();
    $.cookie('access_token', response.access_token);
    $.cookie('refresh_token', response.refresh_token);
    $.cookie('expires_in', response.expires_in);
    $.cookie('creation_date', new Date().getTime() / 1000);
    that.transitionToRouteAnimated('home', 'slideOverUp');
  }, onFail);
  /*jslint camelcase: true*/
}

function signUp400(errors) {
  var formErrors = {};

  for (var key in errors) {
    if (errors.hasOwnProperty(key)) {
      var errorType = errors[key].type;

      if (errorType === 'user defined') {
        errorType = errors[key].message;
      }

      var message = FormErrorMessages[errorType];
      formErrors[key] = message;
    }
  }
  return formErrors;
}

App.LandingController = Ember.Controller.extend({
  actions: {
    signin: function () {
      this.setProperties({
        signInFailed: false,
        signInIsProcessing: true
      });

      var that = this;

      signIn(this, this.get('signIn-email'), this.get('signIn-password'),
        function () {
          that.set('signInIsProcessing', false);
          that.set('signInFailed', true);
          Ember.run.scheduleOnce('afterRender', that, function () {
            $('#sign-in-form').parent('.segment').transition('shake');
          });
        }.bind(this));
    },

    signup: function () {
      this.setProperties({
        signUpFailed: false,
        signUpIsProcessing: true,
        signUpErrors: {}
      });

      var that = this;

      $.post(API.URL_SIGNUP, {
        firstName: this.get('signUp-firstName'),
        lastName: this.get('signUp-lastName'),
        email: this.get('signUp-email'),
        password: this.get('signUp-password')
      }).then(function () {
        that.set('signUpErrors', {});
        signIn(that, that.get('signUp-email'), that.get('signUp-password'));
      }, function (response) {
        if (response.status === 400) {
          that.set('signUpErrors', signUp400(response.responseJSON.errors));
        } else {
          that.set('signUpFailed', true);
        }
        that.set('signUpIsProcessing', false);
        Ember.run.scheduleOnce('afterRender', that, function () {
          $('#sign-up-form').parent('.segment').transition('shake');
        });
      }.bind(this));
    }
  }
});
