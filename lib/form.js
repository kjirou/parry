var async = require('async');
var Promise = require('bluebird');
var _ = require('lodash');
var util = require('util');

var Deferred = require('./deferred');


var Form = function Form(inputs) {
  // Instances of Field classes
  this._fields = [];
  this._initializeFields();

  this.resetInputs();
  this.inputs(inputs);
};

// Validate all fields already even if error occurs
Form.shouldValidateAll = true;

Form.ErrorReporter = undefined;

Form.getErrorReporter = function() {
  return Form.ErrorReporter;
};

// field definitions
//
// e.g.
//  [{
//    fieldId: <string>,
//    fieldClass: <Field class>
//  }, ..]
Form.fields = [];

Form.getField = function(fieldId) {
  for (var i = 0; i < this.fields.length; i++) {
    var fieldData = this.fields[i];
    if (fieldData.fieldId === fieldId) { return fieldData.fieldClass; }
  }
  return null;
};

Form.getFieldOrError = function(fieldId) {
  var fieldClass = this.getField(fieldId);
  if (!fieldClass) {
    throw new Error(fieldId + ' is not defined');
  }
  return fieldClass;
};

// define field with id
Form.field = function(fieldId, fieldClass) {
  if (this.getField(fieldId)) {
    throw new Error(fieldId + ' is already defined');
  }
  this.fields.push({ fieldId: fieldId, fieldClass: fieldClass });
  return this;
};

Form.extend = function(extensions) {
  var self = this;
  extensions = extensions || {};

  var SubForm = function() {
    self.apply(this, arguments);
  };
  util.inherits(SubForm, this);
  _.extend(SubForm, this, extensions);

  // merge fields
  SubForm.fields = _.clone(this.fields);
  (extensions.fields || []).forEach(function(fieldDefinition) {
    self.field(fieldDefinition.fieldId, fieldDefinition.fieldClass);
  });

  return SubForm;
};


Form.prototype.input = function(fieldId, input) {
  this._inputs[fieldId] = input;
  return this;
};

Form.prototype.inputs = function(inputs) {
  var self = this;
  _.forEach(inputs, function(v, k) {
    self.input(k, v);
  });
  return this;
};

Form.prototype.resetInputs = function(inputs) {
  this._inputs = {};
};

Form.prototype._initializeFields = function() {
  var self = this;
  this.constructor.fields.forEach(function(fieldDefinition) {
    self._fields.push({
      fieldId: fieldDefinition.fieldId,
      field: new fieldDefinition.fieldClass()
    });
  });
};

Form.prototype.validate = function(callback) {
  var self = this;
  callback = callback || null;
  var deferred = new Deferred();
  var errorReporter = new (this.constructor.getErrorReporter())();

  async.eachSeries(this._fields, function(fieldData, nextLoop) {
    var fieldId = fieldData.fieldId;
    var field = fieldData.field;

    var input = self._inputs[fieldId];
    if (input === undefined && !self.constructor.shouldValidateAll) {
      return nextLoop();
    } else {
      input = input ? input.toString() : '';
    }

    field.validate(input, function(err, validationResult) {
      if (err) { return nextLoop(err); }
      if (!validationResult.isValid) {
        validationResult.errorMessages.forEach(function(errorMessage) {
          errorReporter.error(fieldId, errorMessage);
        });
      }
      nextLoop();
    });
  }, function(err) {
    if (err) {
      if (callback) {
        callback(err);
      } else {
        deferred.reject(err);
      }
      return;
    }
    var validationResult = {
      isValid: !errorReporter.isErrorOcurred(),
      errors: errorReporter.report(),
      reporter: errorReporter
    };
    if (callback) {
      callback(null, validationResult);
    } else {
      deferred.resolve(validationResult);
    }
  });

  return deferred.promise;
};


module.exports = function(ErrorReporter) {
  Form.ErrorReporter = ErrorReporter;
  return Form;
};
