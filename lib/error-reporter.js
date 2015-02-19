var _ = require('lodash');


function ErrorReporter (options) {
  options = _.extend({
    // filter of i18n like "__" method
    // function or null
    i18n: null
  }, options || {});

  this._i18nFilter = undefined;
  this.setI18nFilter(options.i18n);

  //
  // stacked input errors
  //
  // e.g.
  //
  //   [{
  //     key: 'email'
  //     message: 'Invalid email'
  //   }, {
  //     key: 'password'
  //     message: 'Password is required'
  //   }, {
  //     key: 'email'
  //     message: 'Duplicated email'
  //   }, ..]
  //
  this._errors = [];
}

ErrorReporter.prototype.setI18nFilter = function(i18nFilter) {
  this._i18nFilter = i18nFilter;
};

ErrorReporter.prototype.error = function(key, message) {
  this._errors.push({ key: key, message: message });
};

ErrorReporter.prototype.merge = function(errorReporter) {
  var self = this;
  errorReporter._errors.forEach(function(error){ self._errors.push(error); });
};

ErrorReporter.prototype.isErrorOcurred = function() {
  return this._errors.length > 0;
};

ErrorReporter.prototype._applyI18n = function(message) {
  return this._i18nFilter ? this._i18nFilter(message) : message;
};

// Return formatted error information
ErrorReporter.prototype.report = function(mode) {
  mode = mode || 'classified';
  if (mode === 'classified') {
    return this._formatErrorsAsClassified();
  } else if (mode === 'simple') {
    return this._formatErrorsAsSimple();
  } else {
    return null;
  }
};

//
// e.g.
//
//   {
//     email: [{
//       key: 'email'
//       message: 'Invalid email'
//     }, {
//       key: 'email'
//       message: 'Duplicated email'
//     }]
//     password: [{
//       key: 'password'
//       message: 'Password is required'
//     }]
//   }
//
ErrorReporter.prototype._formatErrorsAsClassified = function() {
  var self = this;
  var formatted = {};
  this._errors.forEach(function(error) {
    if (!formatted[error.key]) {
      formatted[error.key] = [];
    }
    formatted[error.key].push({
      key: error.key,
      message: self._applyI18n(error.message)
    });
  });
  return formatted;
};

//
// e.g.
//
//   [
//     { key: 'email', message: 'Invalid email' },
//     { key: 'password', message: 'Password is required' },
//     { key: 'email', message: 'Duplicated email' }
//   ]
//
ErrorReporter.prototype._formatErrorsAsSimple = function() {
  var self = this;
  return this._errors.map(function(error) {
    return {
      key: error.key,
      message: self._applyI18n(error.message)
    };
  });
};


module.exports = ErrorReporter;
