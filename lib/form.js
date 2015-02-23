var async = require('async');
var _ = require('lodash');


var Form = function Form(inputs, options) {
  this._options = _.extend({
    // Check all fields already even if error occurs
    shouldCheckAll: true
  }, options || {});

  // e.g.
  //  [{
  //    fieldId: <string>,
  //    field: <Field>
  //  }, ..]
  this._fields = [];

  this.resetInputs();
  this.inputs(inputs);
};

Form.ErrorReporter = undefined;

Form.prototype.getErrorReporter = function() {
  return Form.ErrorReporter;
};

Form.prototype.getField = function(fieldId) {
  for (var i = 0; i < this._fields.length; i++) {
    var fieldData = this._fields[i];
    if (fieldData.fieldId === fieldId) { return fieldData.field; }
  }
  return null;
};

Form.prototype.getFieldOrError = function(fieldId) {
  var field = this.getField(fieldId);
  if (!field) {
    throw new Error(fieldId + ' is not defined');
  }
  return field;
};

// define field with id
Form.prototype.field = function(fieldId, field) {
  if (this.getField(fieldId)) {
    throw new Error(fieldId + ' is already defined');
  }
  this._fields.push({ fieldId: fieldId, field: field });
  return this;
};

Form.prototype.input = function(fieldId, input) {
  this._inputs[fieldId] = input;
  return this;
};

Form.prototype.inputs = function(inputs) {
  _.extend(this._inputs, inputs);
};

Form.prototype.resetInputs = function(inputs) {
  this._inputs = {};
};

Form.prototype.validate = function(callback) {
  var self = this;
  var errorReporter = new (this.getErrorReporter())();

  async.eachSeries(this._fields, function(fieldData, nextLoop) {
    var fieldId = fieldData.fieldId;
    var field = fieldData.field;

    var input = self._inputs[fieldId];
    if (input === undefined && !self._options.shouldCheckAll) {
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
    if (err) { return callback(err); }
    callback(null, {
      isValid: !errorReporter.isErrorOcurred(),
      errors: errorReporter.report(),
      reporter: errorReporter
    });
  });
};


module.exports = function(ErrorReporter) {
  Form.ErrorReporter = ErrorReporter;
  return Form;
};
