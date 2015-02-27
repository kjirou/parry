var async = require('async');
var _ = require('lodash');
var util = require('util');


var Field = function Field(){};

// pass validation if value is empty
Field.passIfEmpty = false;

// Validate all validators already even if error occurs
Field.shouldValidateAll = false;

Field.defaultErrorMessages = undefined;

Field.getDefaultErrorMessages = function() {
  return this.defaultErrorMessages;
};

Field.validator = undefined;

Field.getValidator = function() {
  return this.validator;
};

Field.validations = [];

Field._addValidation = function(validationSettings) {
  this.validations.push(_.extend({
    type: null,
    args: null,
    message: null,
    specification: null
  }, validationSettings));
};

// e.g. ('isNull') -> validatorjs.isNull
Field._getTypicalValidation = function(type) {
  return this.getValidator()[type] || null;
};

Field._getTypicalValidationOrError = function(type) {
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
Field.type = function(type, validationArgs, message) {
  var self = this;

  validationArgs = validationArgs || null;
  message = message || null;

  // apply overloading
  if (typeof validationArgs === 'string') {
    message = validationArgs;
    validationArgs = null;
  }

  this._getTypicalValidationOrError(type);

  this._addValidation({
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
Field.specify = function(specification) {
  this._addValidation({ specification: specification });
  return this;
};

Field.extend = function(extensions) {
  extensions = extensions || {};

  var SubField = function(){};
  util.inherits(SubField, this);
  _.extend(SubField, this, extensions);

  // merge validations
  SubField.validations = _.clone(this.validations);
  (extensions.validations || []).forEach(function(check) {
    if (check.type) {
      SubField.type(check.type, check.args || [], check.message || '');
    } else {
      SubField.specify(check.specification);
    }
  });

  return SubField;
};

Field.prototype._validateByType = function(type, args, input) {
  var validation = this.constructor._getTypicalValidationOrError(type);
  return !!validation.apply(this.constructor.getValidator(), [input].concat(args));
};

Field.prototype._validateBySpecification = function(specification, input, callback) {
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
      specification(input, function(err, result) {
        if (err) { return next(err); }
        validationResult.isValid = !!result.isValid;
        if (!validationResult.isValid) {
          if (result.message) {
            validationResult.errorMessages = [result.message];
          } else if (result.messages) {
            validationResult.errorMessages = result.messages.slice();
          } else {
            validationResult.errorMessages = [self.constructor.getDefaultErrorMessages().isInvalid];
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

  async.eachSeries(this.constructor.validations, function(check, nextLoop) {
    var type = check.type;
    var args = check.args;
    var message = check.message;
    var specification = check.specification;

    if (
      self.constructor.passIfEmpty && input === '' ||
      self.constructor.shouldValidateAll === false && invalidResults.length > 0
    ) {
      nextLoop();
    } else if (specification) {
      self._validateBySpecification(specification, input, function(err, validationResult) {
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
