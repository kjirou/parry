var async = require('async');
var _ = require('lodash');
var assert = require('power-assert');

var ErrorReporter = require('../index').ErrorReporter;
var Field = require('../index').Field;
var Form = require('../index').Form;
var DEFAULT_ERROR_MESSAGES = require('../index').DEFAULT_ERROR_MESSAGES;


describe('form module', function() {

  it('create a instance', function() {
    var form = new Form();
    assert(form instanceof Form);
  });

  it('field', function() {
    var form = new Form()
      .field('foo', new Field())
      .field('bar', new Field());
    assert(form._fields.length === 2);
    assert.throws(function() {
      form.field('foo', new Field());
    }, /foo/);
  });

  it('getField, getFieldOrError', function() {
    var form = new Form()
      .field('foo', new Field());
    assert(form.getField('foo'));
    assert(form.getField('bar') === null);
    assert(form.getFieldOrError('foo'));
    assert.throws(function() {
      form.getFieldOrError('bar');
    }, /bar/);
  });

  it('input', function() {
    var form = new Form()
      .input('foo', 'foo_input')
      .input('bar', 'bar_input');
    assert.deepEqual(form._inputs, {
      foo: 'foo_input',
      bar: 'bar_input'
    });
  });

  it('inputs', function() {
    var form = new Form();
    form.inputs({
      foo: 'foo_input',
      bar: 'bar_input'
    });
    assert.deepEqual(form._inputs, {
      foo: 'foo_input',
      bar: 'bar_input'
    });
  });

  it('set inputs by constructor', function() {
    var form = new Form({
      foo: 'foo_input',
      bar: 'bar_input'
    });
    assert.deepEqual(form._inputs, {
      foo: 'foo_input',
      bar: 'bar_input'
    });
  });


  describe('validate', function() {

    it('basic usage', function(done) {
      var emailField = new Field()
        .type('isEmail');
      var passwordField = new Field()
        .type('isAlphanumeric')
        .type('isLength', [8, 16]);

      async.series([
        // valid inputs
        function(next) {
          var form = new Form({
              email: 'foo@example.com',
              password: 'abcd1234'
            })
            .field('email', emailField)
            .field('password', passwordField);
          form.validate(function(err, validationResult) {
            assert(validationResult.isValid);
            assert(validationResult.reporter instanceof ErrorReporter);
            assert(_.size(validationResult.errors) === 0);
            next();
          });
        },
        // invalid inputs
        function(next) {
          var form = new Form({
              email: 'fooexamplecom',
              password: '_abcd1234'
            })
            .field('email', emailField)
            .field('password', passwordField);
          form.validate(function(err, validationResult) {
            assert(!validationResult.isValid);
            assert(validationResult.reporter instanceof ErrorReporter);
            assert(_.size(validationResult.errors) === 2);
            next();
          });
        },
        // shouldCheckAll option
        function(next) {
          var form = new Form({
              email: 'foo@example.com'
            }, {
              shouldCheckAll: false
            })
            .field('email', emailField)
            .field('password', passwordField);
          form.validate(function(err, validationResult) {
            assert(validationResult.isValid);
            assert(validationResult.reporter instanceof ErrorReporter);
            assert(_.size(validationResult.errors) === 0);
            next();
          });
        }
      ], done);
    });
  });
});
