var async = require('async');
var Promise = require('bluebird');
var _ = require('lodash');
var util = require('util');

var Deferred = require('./deferred');


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
    message: message
  });

  return this;
};

// Set a non-typical validation
Field.specify = function(specification, message) {
  this._addValidation({
    specification: specification,
    message: message || null
  });
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

// Check validation that is 'type' or 'specification'
Field.isTypicalValidation = function(validation) {
  return !!validation.type;
};

// Guess error message before validating.
// It is determined certainly only after validation if validate by validation.specification.
Field.guessErrorMessage = function guessErrorMessage(validation) {
  if (validation.message) {
    return validation.message;
  } else if (this.isTypicalValidation(validation)) {
    return this.getDefaultErrorMessages()[validation.type] ||
      this.getDefaultErrorMessages().isInvalid;
  } else {
    return this.getDefaultErrorMessages().isInvalid;
  }
};

Field._validateByType = function(type, args, input) {
  var validation = this._getTypicalValidationOrError(type);
  return !!validation.apply(this.getValidator(), [input].concat(args));
};

Field.createActualValidation = function createActualValidation(validation) {
  var self = this;

  var type = validation.type;
  var args = validation.args;
  var preparedErrorMessage = this.guessErrorMessage(validation);
  var specification = validation.specification;
  var passIfEmpty = this.passIfEmpty;

  var validationResult = {
    // Validation result
    // boolean
    isValid: false,
    // validation error messages
    // Array<string>
    errorMessages: []
  };

  if (this.isTypicalValidation(validation)) {
    return function(input, callback) {
      var runtimeError = null;
      try {
        if (
          passIfEmpty && input === '' ||
          self._validateByType(type, args || [], input)
        ) {
          validationResult.isValid = true;
        } else {
          validationResult.errorMessages.push(preparedErrorMessage);
        }
      } catch (err) {
        runtimeError = err;
      }
      return callback(runtimeError, validationResult);
    };
  } else {
    return function(input, callback) {
      specification(input, function(err, result) {
        if (err) {
          return callback(err, validationResult);
        }
        validationResult.isValid = passIfEmpty && input === '' || !!result.isValid;
        if (!validationResult.isValid) {
          if (result.errorMessages) {
            validationResult.errorMessages = result.errorMessages.slice();
          } else {
            validationResult.errorMessages = [preparedErrorMessage];
          }
        }
        callback(null, validationResult);
      });
    };
  }
};

Field.prototype.validate = function validate(input, callback) {
  var self = this;
  callback = callback || function(){};
  var deferred = new Deferred();
  var mergedValidationResult = {
    isValid: true,
    errorMessages: []
  };

  async.eachSeries(this.constructor.validations, function(validation, nextLoop) {

    if (!self.constructor.shouldValidateAll && !mergedValidationResult.isValid) {
      return nextLoop();
    }

    var actualValidation = self.constructor.createActualValidation(validation);
    actualValidation(input, function(err, validationResult) {
      if (!validationResult.isValid) {
        mergedValidationResult.isValid = false;
        validationResult.errorMessages.forEach(function(v) {
          mergedValidationResult.errorMessages.push(v);
        });
      }
      nextLoop(err);
    });
  }, function(err) {
    if (err) {
      deferred.reject(err);
      return callback(err, _.extend(mergedValidationResult, {
        isValid: false
      }));
    }
    deferred.resolve(mergedValidationResult);
    callback(null, mergedValidationResult);
  });

  return deferred.promise;
};


module.exports = function(validator, defaultErrorMessages) {
  Field.validator = validator;
  Field.defaultErrorMessages = defaultErrorMessages;
  return Field;
};
