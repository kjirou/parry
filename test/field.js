var async = require('async');
var assert = require('power-assert');

var Field = require('../index').Field;
var DEFAULT_ERROR_MESSAGES = require('../index').DEFAULT_ERROR_MESSAGES;


describe('field module', function() {

  it('create a instance', function() {
    var field = new Field();
    assert(field instanceof Field);
  });

  describe('type', function() {

    it('basic usage', function() {
      var SubField = Field.extend();
      SubField.type('isEmail', 'It is not a email');
      assert.deepEqual(SubField.checks, [{
        type: 'isEmail', args: null, message: 'It is not a email', validation: null
      }]);
    });

    it('use default message', function() {
      var SubField = Field.extend();
      SubField.type('isEmail');
      assert.deepEqual(SubField.checks, [{
        type: 'isEmail', args: null, message: DEFAULT_ERROR_MESSAGES.isEmail, validation: null
      }]);
    });

    it('set args', function() {
      var SubField = Field.extend();
      SubField.type('isLength', [8, 12], 'It is not within 8 to 12');
      assert.deepEqual(SubField.checks, [{
        type: 'isLength', args: [8, 12], message: 'It is not within 8 to 12', validation: null
      }]);
    });

    it('set non-existent type', function() {
      var SubField = Field.extend();
      assert.throws(function() {
        SubField.type('non_existent_type');
      }, /non_existent_type/);
    });

    it('method chaining', function() {
      var SubField = Field.extend();
      SubField.type('isEmail')
        .type('isLength', [8, 12]);
      assert(SubField.checks.length === 2);
    });
  });


  describe('specify', function() {

    it('basic usage', function() {
      var SubField = Field.extend();
      var validation = function(){ return true };
      SubField.specify(validation);
      assert.deepEqual(SubField.checks, [{
        type: null, args: null, message: null, validation: validation
      }]);
    });

    it('method chaining', function() {
      var SubField = Field.extend();
      SubField.specify(function(){ return true; })
        .specify(function(){ return true; });
      assert(SubField.checks.length === 2);
    });
  });


  describe('_validateByType', function() {

    it('basic usage', function() {
      var field = new Field();
      assert(field._validateByType('isEmail', [], 'foo@example.com'));
      assert(field._validateByType('isEmail', [], 'fooexamplecom') === false);
      assert(field._validateByType('isLength', [4, 8], '1234'));
      assert(field._validateByType('isLength', [4, 8], '123') === false);
      assert(field._validateByType('isLength', [4, 8], '123456789') === false);
      assert(field._validateByType('isLength', [4], '123456789'));
    });

    it('use non-existent type', function() {
      var field = new Field();
      assert.throws(function() {
        field._validateByType('non_existent_type');
      }, /non_existent_type/);
    });
  });


  describe('_validateBySpecification', function() {

    it('basic usage', function(done) {
      var validation = function(input, callback) {
        if (input === 'good') {
          return callback(null, {
            isValid: true
          });
        } else if (input === 'bad') {
          return callback(null, {
            isValid: false,
            message: 'bad input'
          });
        } else if (input === 'evil') {
          return callback(null, {
            isValid: false,
            messages: ['evil input', 'evil input']
          });
        } else if (input === 'no_message') {
          return callback(null, {
            isValid: false
          });
        } else {
          return callback(new Error('runtime error'));
        }
      };
      var field = new Field();

      async.series([
        function(next) {
          field._validateBySpecification(validation, 'good', function(err, validationResult) {
            assert(validationResult.isValid);
            assert.deepEqual(validationResult.errorMessages, []);
            next();
          });
        },
        function(next) {
          field._validateBySpecification(validation, 'bad', function(err, validationResult) {
            assert(validationResult.isValid === false);
            assert.deepEqual(validationResult.errorMessages, ['bad input']);
            next();
          });
        },
        function(next) {
          field._validateBySpecification(validation, 'evil', function(err, validationResult) {
            assert(validationResult.isValid === false);
            assert.deepEqual(validationResult.errorMessages, ['evil input', 'evil input']);
            next();
          });
        },
        function(next) {
          field._validateBySpecification(validation, 'no_message', function(err, validationResult) {
            assert(validationResult.isValid === false);
            assert.deepEqual(validationResult.errorMessages, [DEFAULT_ERROR_MESSAGES.isInvalid]);
            next();
          });
        },
        function(next) {
          field._validateBySpecification(validation, 'foo', function(err, validationResult) {
            assert(err);
            assert(!!validationResult === false);
            next();
          });
        }
      ], done);
    });
  });


  describe('validate', function() {

    it('validate by type', function(done) {
      var SubField = Field.extend()
        .type('isEmail')
        .type('isLength', [10]);
      var subField = new SubField();

      async.series([
        function(next) {
          subField.validate('foo@example.com', function(err, result) {
            assert(!err);
            assert(result.isValid);
            assert.deepEqual(result.errorMessages, []);
            next();
          });
        },
        function(next) {
          subField.validate('fooexample.com', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [ DEFAULT_ERROR_MESSAGES.isEmail ]);
            next();
          });
        },
        function(next) {
          subField.validate('f@e.com', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [ DEFAULT_ERROR_MESSAGES.isLength ]);
            next();
          });
        }
      ], done);
    });

    it('shouldCheckAll option', function(done) {
      async.series([
        function(next) {
          var SubField = Field.extend()
            .type('isEmail')
            .type('isLength', [10]);
          var subField = new SubField();
          // not isEmail and not isLength, but shouldCheckAll is false
          subField.validate('fecom', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [ DEFAULT_ERROR_MESSAGES.isEmail ]);
            next();
          });
        },
        function(next) {
          var SubField = Field.extend({ shouldCheckAll: true })
            .type('isEmail')
            .type('isLength', [10]);
          var subField = new SubField();
          subField.validate('fecom', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [
              DEFAULT_ERROR_MESSAGES.isEmail,
              DEFAULT_ERROR_MESSAGES.isLength,
            ]);
            next();
          });
        }
      ], done);
    });

    it('passIfEmpty option', function(done) {
      var SubField = Field.extend({ passIfEmpty: true })
        .type('isEmail');
      var subField = new SubField();
      subField.validate('', function(err, result) {
        assert(result.isValid);
        done(err);
      });
    });

    it('validate by specification', function(done) {
      var SubField = Field.extend()
        .specify(function(input, callback) {
          if (input === 'good') {
            callback(null, { isValid: true });
          } else {
            callback(null, { isValid: false });
          }
        });
      var subField = new SubField();

      async.series([
        function(next) {
          subField.validate('good', function(err, result) {
            assert(!err);
            assert(result.isValid);
            assert.deepEqual(result.errorMessages, []);
            next();
          });
        },
        function(next) {
          subField.validate('bad', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [ DEFAULT_ERROR_MESSAGES.isInvalid ]);
            next();
          });
        }
      ], done);
    });

    it('validate by type and specification', function(done) {
      var SubField = Field.extend()
        .type('isEmail')
        .type('isLength', [10])
        .specify(function(input, callback) {
          if (input === 'good@example.com') {
            callback(null, { isValid: true });
          } else {
            callback(null, { isValid: false, message: 'It is a custom message' });
          }
        });
      var subField = new SubField();

      async.series([
        function(next) {
          subField.validate('good@example.com', function(err, result) {
            assert(!err);
            assert(result.isValid);
            assert.deepEqual(result.errorMessages, []);
            next();
          });
        },
        function(next) {
          subField.validate('goodexamplecom', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [ DEFAULT_ERROR_MESSAGES.isEmail ]);
            next();
          });
        },
        function(next) {
          subField.validate('g@e.com', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [ DEFAULT_ERROR_MESSAGES.isLength ]);
            next();
          });
        },
        function(next) {
          subField.validate('bad@example.com', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [ 'It is a custom message' ]);
            next();
          });
        }
      ], done);
    });
  });


  describe('extend', function() {

    it('basic usage', function() {
      assert(Field.passIfEmpty === false);
      assert(Field.shouldCheckAll === false);
      var SubField = Field.extend({ passIfEmpty: true, shouldCheckAll: true });
    });


    it('merge checks', function() {
      var SubField = Field.extend({
          checks: [
            { type: 'isLength', args: [4, 5], message: 'It is invalid length' },
            {
              validation: function(input, callback) {
                if (input === 'good' || input === 'good1') {
                  callback(null, { isValid: true });
                } else {
                  callback(null, { isValid: false });
                }
              }
            }
          ]
        })
        .type('isAlpha');

      assert(SubField.checks.length === 3);

      var subField = new SubField();

      async.series([
        function(next) {
          subField.validate('good', function(err, validationResult) {
            assert(validationResult.isValid);
            next();
          });
        },
        function(next) {
          subField.validate('goo', function(err, validationResult) {
            assert(!err);
            assert(validationResult.isValid === false);
            assert.deepEqual(validationResult.errorMessages, [ 'It is invalid length' ]);
            next();
          });
        },
        function(next) {
          subField.validate('gooo', function(err, validationResult) {
            assert(!err);
            assert(validationResult.isValid === false);
            assert.deepEqual(validationResult.errorMessages, [ DEFAULT_ERROR_MESSAGES.isInvalid ]);
            next();
          });
        },
        function(next) {
          subField.validate('good1', function(err, validationResult) {
            assert(!err);
            assert(validationResult.isValid === false);
            assert.deepEqual(validationResult.errorMessages, [ DEFAULT_ERROR_MESSAGES.isAlpha ]);
            next();
          });
        }
      ]);
    });
  });
});
