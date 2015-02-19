var validatorjs = require('validator');

var DEFAULT_ERROR_MESSAGES = require('./lib/default-error-messages');
var ErrorReporter = require('./lib/error-reporter');


module.exports = {
  //createValidator: createValidator
  DEFAULT_ERROR_MESSAGES: DEFAULT_ERROR_MESSAGES,
  ErrorReporter: ErrorReporter,
  //Field: Field,
  //Form: Form,
  validatorjs: validatorjs
};
