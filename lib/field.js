var async = require('async');
var _ = require('lodash');


var Field = function Field(options) {
  this._options = _.extend({
    // pass validation if value is empty
    passIfEmpty: false,
    // Check all validators already even if error occurs
    shouldCheckAll: false
  }, options || {});

  this._checks = [];
};

Field.defaultErrorMessages = undefined;
Field.validator = undefined;

Field.prototype.getValidator = function() {
  return Field.validator;
};

Field.prototype.getDefaultErrorMessages = function() {
  return Field.defaultErrorMessages;
};

Field.prototype._addCheck = function(checkSettings) {
  this._checks.push(_.extend({
    type: null,
    args: null,
    message: null,
    validation: null
  }, checkSettings));
};

// e.g. ('isNull') -> validatorjs.isNull
Field.prototype._getTypicalValidation = function(type) {
  return this.getValidator()[type] || null;
};

Field.prototype._getTypicalValidationOrError = function(type) {
  var validation = this._getTypicalValidation(type);
  // TODO: Consider to 'toBoolean' etc
  if (typeof validation !== 'function') {
    throw new Error(type + ' is not a validation method');
  }
  return validation;
};

// Set a typical validation
//
// examples:
//   type('isEmail', 'It is not a email')
//   type('isUrl')  // Use default error message
//   type('isLength', [8, 12], 'It is not within 8 to 12')  // Pass args to validator
Field.prototype.type = function(type, validationArgs, message) {
  var self = this;

  validationArgs = validationArgs || null;
  message = message || null;

  // apply overloading
  if (typeof validationArgs === 'string') {
    message = validationArgs;
    validationArgs = null;
  }

  this._getTypicalValidationOrError(type);

  this._addCheck({
    type: type,
    args: validationArgs,
    message: (function(message) {
      if (message) return message;
      var defaultMessage = self.getDefaultErrorMessages()[type];
      if (defaultMessage) return defaultMessage;
      return self.getDefaultErrorMessages().Invalid;
    })(message)
  });

  return this;
};

// Set a non-typical validation
Field.prototype.specify = function(validation) {
  this._addCheck({ validation: validation });
  return this;
};

// extend checks from another fields
Field.prototype.extend = function(/* args */) {
  var self = this;
  var fields = Array.prototype.slice.apply(arguments);
  fields.forEach(function(field) {
    field._checks.forEach(function(check) {
      self._addCheck(check);
    });
  });
};

Field.prototype._validateByType = function(type, args, input) {
  var validation = this._getTypicalValidationOrError(type);
  return !!validation.apply(this.getValidator(), [input].concat(args));
};

Field.prototype._validateBySpecification = function(validation, input, callback) {
  var self = this;

  var validationResult = {
    // Validation result
    // boolean
    isValid: false,
    // validation error messages
    // Array<string>
    errorMessages: []
  };

  async.series([
    function(next) {
      validation(input, function(err, result) {
        if (err) { return next(err); }
        validationResult.isValid = !!result.isValid;
        if (!validationResult.isValid) {
          if (result.message) {
            validationResult.errorMessages = [result.message];
          } else if (result.messages) {
            validationResult.errorMessages = result.messages.slice();
          } else {
            validationResult.errorMessages = [self.getDefaultErrorMessages().isInvalid];
          }
        }
        next();
      });
    }
  ], function(err) {
    if (err) { return callback(err); }
    callback(null, validationResult);
  });
};

Field.prototype.validate = function(input, callback) {
  var self = this;

  var invalidResults = [];
  var addInvalidResult = function(message) {
    invalidResults.push({ message: message });
  };

  async.eachSeries(this._checks, function(check, nextLoop) {
    var type = check.type;
    var args = check.args;
    var message = check.message;
    var validation = check.validation;

    if (
      self._options.passIfEmpty && input === '' ||
      self._options.shouldCheckAll === false && invalidResults.length > 0
    ) {
      nextLoop();
    } else if (validation) {
      self._validateBySpecification(validation, input, function(err, validationResult) {
        if (err) {
          nextLoop(err);
        } else if (!validationResult.isValid) {
          validationResult.errorMessages.forEach(function(message) {
            addInvalidResult(message);
          });
          nextLoop();
        } else {
          nextLoop();
        }
      });
    } else {
      var runtimeError = null;
      try {
        if (!self._validateByType(type, args || [], input)) {
          addInvalidResult(message);
        }
      } catch (err) {
        runtimeError = err;
      }
      nextLoop(runtimeError);
    }
  }, function(err) {
    if (err) { return callback(err, {}); }
    callback(null, {
      isValid: invalidResults.length === 0,
      errorMessages: invalidResults.map(function(v) { return v.message; })
    });
  });
};


module.exports = function(validator, defaultErrorMessages) {
  Field.validator = validator;
  Field.defaultErrorMessages = defaultErrorMessages;
  return Field;
};
