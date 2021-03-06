var validatorjs = require('validator');

var DEFAULT_ERROR_MESSAGES = require('./lib/default-error-messages');
var ErrorReporter = require('./lib/error-reporter');
var validatorjsExtender = require('./lib/validatorjs-extender');

validatorjsExtender(validatorjs);
var Field = require('./lib/field')(validatorjs, DEFAULT_ERROR_MESSAGES);
var Form = require('./lib/form')(ErrorReporter);


module.exports = {
  DEFAULT_ERROR_MESSAGES: DEFAULT_ERROR_MESSAGES,
  ErrorReporter: ErrorReporter,
  Field: Field,
  Form: Form,
  validatorjs: validatorjs,
  validatorjsExtender: validatorjsExtender
};
