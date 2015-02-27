var async = require('async');
var Promise = require('bluebird');
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
      assert.deepEqual(SubField.validations, [{
        type: 'isEmail', args: null, message: 'It is not a email', specification: null
      }]);
    });

    it('set args', function() {
      var SubField = Field.extend();
      SubField.type('isLength', [8, 12], 'It is not within 8 to 12');
      assert.deepEqual(SubField.validations, [{
        type: 'isLength', args: [8, 12], message: 'It is not within 8 to 12', specification: null
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
      assert(SubField.validations.length === 2);
    });
  });


  describe('specify', function() {

    it('basic usage', function() {
      var SubField = Field.extend();
      var specification = function(){ return true };
      SubField.specify(specification);
      assert.deepEqual(SubField.validations, [{
        type: null, args: null, message: null, specification: specification
      }]);
    });

    it('method chaining', function() {
      var SubField = Field.extend();
      SubField.specify(function(){ return true; })
        .specify(function(){ return true; });
      assert(SubField.validations.length === 2);
    });
  });


  describe('_validateByType', function() {

    it('basic usage', function() {
      assert(Field._validateByType('isEmail', [], 'foo@example.com'));
      assert(Field._validateByType('isEmail', [], 'fooexamplecom') === false);
      assert(Field._validateByType('isLength', [4, 8], '1234'));
      assert(Field._validateByType('isLength', [4, 8], '123') === false);
      assert(Field._validateByType('isLength', [4, 8], '123456789') === false);
      assert(Field._validateByType('isLength', [4], '123456789'));
    });

    it('use non-existent type', function() {
      assert.throws(function() {
        Field._validateByType('non_existent_type');
      }, /non_existent_type/);
    });
  });


  describe('createActualValidation', function() {

    describe('by type', function() {

      it('basic usage', function(done) {
        var SubField = Field.extend()
          .type('isLength', [4, 8], 'Not in range');
        async.series([
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('aaaa', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid);
              assert.deepEqual(validationResult.errorMessages, []);
              next();
            });
          },
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('aaa', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid === false);
              assert.deepEqual(validationResult.errorMessages, ['Not in range']);
              next();
            });
          }
        ], done);
      });

      it('use default error message', function(done) {
        var SubField = Field.extend()
          .type('isEmail');
        async.series([
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('foo@example.com', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid);
              assert.deepEqual(validationResult.errorMessages, []);
              next();
            });
          },
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('fooexamplecom', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid === false);
              assert.deepEqual(validationResult.errorMessages, [DEFAULT_ERROR_MESSAGES.isEmail]);
              next();
            });
          }
        ], done);
      });

      it('passIfEmpty', function(done) {
        var SubField = Field.extend({ passIfEmpty: true })
          .type('isEmail');
        async.series([
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('foo@example.com', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid);
              assert.deepEqual(validationResult.errorMessages, []);
              next();
            });
          },
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid);
              assert.deepEqual(validationResult.errorMessages, []);
              next();
            });
          },
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('fooexamplecom', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid === false);
              assert.deepEqual(validationResult.errorMessages, [DEFAULT_ERROR_MESSAGES.isEmail]);
              next();
            });
          }
        ], done);
      });
    });

    describe('by specification', function() {

      it('basic usage', function(done) {
        var specification = function(input, callback) {
          if (input === 'good') {
            return callback(null, {
              isValid: true
            });
          } else if (input === 'bad') {
            return callback(null, {
              isValid: false,
              errorMessages: ['bad input', 'bad input']
            });
          } else if (input === 'use_prepared_message') {
            return callback(null, {
              isValid: false
            });
          } else {
            return callback(new Error('runtime error'));
          }
        };
        var SubField = Field.extend()
          .specify(specification, 'Invalid input');
        async.series([
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('good', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid);
              assert.deepEqual(validationResult.errorMessages, []);
              next();
            });
          },
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('bad', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid === false);
              assert.deepEqual(validationResult.errorMessages, ['bad input', 'bad input']);
              next();
            });
          },
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('use_prepared_message', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid === false);
              assert.deepEqual(validationResult.errorMessages, ['Invalid input']);
              next();
            });
          },
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('error', function(err, validationResult) {
              assert(err);
              assert(validationResult.isValid === false);
              assert.deepEqual(validationResult.errorMessages, []);
              next();
            });
          }
        ], done);
      });

      it('passIfEmpty', function(done) {
        var specification = function(input, callback) {
          callback(null, { isValid: false });
        };
        var SubField = Field.extend({ passIfEmpty: true })
          .specify(specification);
        async.series([
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid);
              assert.deepEqual(validationResult.errorMessages, []);
              next();
            });
          },
          function(next) {
            var actualValidation = SubField.createActualValidation(SubField.validations[0]);
            actualValidation('bad', function(err, validationResult) {
              assert(!err);
              assert(validationResult.isValid === false);
              assert.deepEqual(validationResult.errorMessages, [ DEFAULT_ERROR_MESSAGES.isInvalid ]);
              next();
            });
          },
        ], done);
      });
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

    it('shouldValidateAll option', function(done) {
      async.series([
        function(next) {
          var SubField = Field.extend()
            .type('isEmail')
            .type('isLength', [10]);
          var subField = new SubField();
          // not isEmail and not isLength, but shouldValidateAll is false
          subField.validate('fecom', function(err, result) {
            assert(!err);
            assert(result.isValid === false);
            assert.deepEqual(result.errorMessages, [ DEFAULT_ERROR_MESSAGES.isEmail ]);
            next();
          });
        },
        function(next) {
          var SubField = Field.extend({ shouldValidateAll: true })
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
            callback(null, { isValid: false, errorMessages: ['It is a custom message'] });
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
      assert(Field.shouldValidateAll === false);
      var SubField = Field.extend({ passIfEmpty: true, shouldValidateAll: true });
    });


    it('merge validations', function() {
      var SubField = Field.extend({
          validations: [
            { type: 'isLength', args: [4, 5], message: 'It is invalid length' },
            {
              specification: function(input, callback) {
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

      assert(SubField.validations.length === 3);

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


  describe('Promise', function() {

    it('validate returns promise', function() {
      var SubField = Field.extend()
        .specify(function(input, callback) {
          if (input === 'good') {
            callback(null, { isValid: true });
          } else if (input === 'bad') {
            callback(null, { isValid: false });
          } else {
            callback(new Error('Runtime error'));
          }
        });
      return Promise.resolve().then(function() {
        return (new SubField()).validate('good').then(function(validationResult) {
          assert(validationResult.isValid);
          assert.deepEqual(validationResult.errorMessages, []);
        });
      }).then(function() {
        return (new SubField()).validate('bad').then(function(validationResult) {
          assert(validationResult.isValid === false);
          assert.deepEqual(validationResult.errorMessages, [ DEFAULT_ERROR_MESSAGES.isInvalid ]);
        });
      }).then(function() {
        return (new SubField()).validate('error').catch(function(err) {
          assert(err && err.message === 'Runtime error');
        });
      });
    });
  });
});
