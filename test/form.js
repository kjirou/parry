var async = require('async');
var _ = require('lodash');
var assert = require('power-assert');

var ErrorReporter = require('../index').ErrorReporter;
var Field = require('../index').Field;
var Form = require('../index').Form;
var DEFAULT_ERROR_MESSAGES = require('../index').DEFAULT_ERROR_MESSAGES;


describe('form module', function() {

  var UsernameField = Field.extend()
    .type('matches', /[a-z0-9_]+/)
    .type('isLength', [4, 16]);

  var PasswordField = Field.extend()
    .type('isAlphanumeric')
    .type('isLength', [8, 16]);

  var EmailField = Field.extend()
    .type('isEmail')
    .type('isLength', [8, 16]);


  it('create a instance', function() {
    var form = new Form();
    assert(form instanceof Form);
  });

  it('field', function() {
    var UserForm = Form.extend()
      .field('username', UsernameField)
      .field('password', PasswordField);
    assert(UserForm.fields.length === 2);
    assert.throws(function() {
      UserForm.field('username', Field);
    }, /username/);
  });

  it('getField, getFieldOrError', function() {
    var UserForm = Form.extend()
      .field('username', UsernameField);
    assert(UserForm.getField('username'));
    assert(UserForm.getField('usernamex') === null);
    assert(UserForm.getFieldOrError('username'));
    assert.throws(function() {
      UserForm.getFieldOrError('usernamex');
    }, /usernamex/);
  });

  it('input', function() {
    var form = new (Form.extend())()
      .input('foo', 'xxx')
      .input('bar', 'yyy');
    assert.deepEqual(form._inputs, {
      foo: 'xxx',
      bar: 'yyy'
    });
  });

  it('inputs', function() {
    var form = new (Form.extend())()
      .inputs({
        foo: 'xxx',
        bar: 'yyy'
      });
    assert.deepEqual(form._inputs, {
      foo: 'xxx',
      bar: 'yyy'
    });
  });

  it('set inputs by constructor', function() {
    var form = new (Form.extend())({
      foo: 'xxx',
      bar: 'yyy'
    });
    assert.deepEqual(form._inputs, {
      foo: 'xxx',
      bar: 'yyy'
    });
  });


  describe('validate', function() {

    it('basic usage', function(done) {
      async.series([
        // valid inputs
        function(next) {
          var UserForm = Form.extend()
            .field('email', EmailField)
            .field('password', PasswordField);
          var form = new UserForm({
            email: 'foo@example.com',
            password: 'abcd1234'
          });
          form.validate(function(err, validationResult) {
            assert(validationResult.isValid);
            assert(validationResult.reporter instanceof ErrorReporter);
            assert(_.size(validationResult.errors) === 0);
            next();
          });
        },
        // invalid inputs
        function(next) {
          var UserForm = Form.extend()
            .field('email', EmailField)
            .field('password', PasswordField);
          var form = new UserForm({
            email: 'fooexamplecom',
            password: '_abcd1234'
          });
          form.validate(function(err, validationResult) {
            assert(!validationResult.isValid);
            assert(validationResult.reporter instanceof ErrorReporter);
            assert(_.size(validationResult.errors) === 2);
            next();
          });
        },
        // shouldCheckAll option
        function(next) {
          var UserForm = Form.extend({ shouldCheckAll: false })
            .field('email', EmailField)
            .field('password', PasswordField);
          var form = new UserForm({
            email: 'foo@example.com'
          });
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


  describe('extend', function() {

    it('basic usage', function() {
      var SubForm = Form.extend()
        .field('username', UsernameField);
      var SubSubForm = SubForm.extend()
        .field('password', PasswordField);
      var form = new SubSubForm();
      assert(form._fields.length === 2);
      assert(form._fields[0].fieldId === 'username');
      assert(form._fields[0].field instanceof UsernameField);
      assert(form._fields[1].fieldId === 'password');
      assert(form._fields[1].field instanceof PasswordField);
    });
  });
});
