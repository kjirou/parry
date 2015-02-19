var assert = require('power-assert');

var ErrorReporter = require('../index').ErrorReporter;


describe('error-reporter module', function() {

  describe('ErrorReporter', function() {

    it('should create a instance', function() {
      var reporter = new ErrorReporter();
      assert(typeof reporter === 'object');
      assert(reporter._i18nFilter === null);
    });

    it('basic usage', function() {
      var reporter = new ErrorReporter();
      assert(reporter.isErrorOcurred() === false);
      reporter.error('foo', 'Invalid foo');
      assert(reporter.isErrorOcurred() === true);
      reporter.error('bar', 'Invalid bar');
      reporter.error('foo', 'Required foo');
      assert.deepEqual(reporter.report(), {
        foo: [
          { key: 'foo', message: 'Invalid foo' },
          { key: 'foo', message: 'Required foo' }
        ],
        bar: [
          { key: 'bar', message: 'Invalid bar' }
        ]
      });
    });

    it('merge', function() {
      var r1 = new ErrorReporter();
      r1.error('foo', 'Invalid foo');
      var r2 = new ErrorReporter();
      r2.error('bar', 'Invalid bar');
      r2.error('foo', 'Required foo');
      r1.merge(r2);
      assert.deepEqual(r1.report(), {
        foo: [
          { key: 'foo', message: 'Invalid foo' },
          { key: 'foo', message: 'Required foo' }
        ],
        bar: [
          { key: 'bar', message: 'Invalid bar' }
        ]
      });
    });

    it('should set i18n filter', function() {
      var reporter = new ErrorReporter();
      reporter.error('foo', 'Invalid foo');
      reporter.setI18nFilter(function(message) {
        return message.toUpperCase();
      });
      assert.deepEqual(reporter.report(), {
        foo: [{
          key: 'foo',
          message: 'INVALID FOO'
        }]
      });

      // set by constructor
      var reporter = new ErrorReporter({
        i18n: function(message) {
          return message.toLowerCase();
        }
      });
      reporter.error('foo', 'Invalid foo');
      assert.deepEqual(reporter.report(), {
        foo: [{
          key: 'foo',
          message: 'invalid foo'
        }]
      });
    });

    it('report as simple', function() {
      var reporter = new ErrorReporter();
      reporter.error('foo', 'Invalid foo');
      reporter.error('bar', 'Invalid bar');
      reporter.error('foo', 'Required foo');
      assert.deepEqual(reporter.report('simple'), [
        { key: 'foo', message: 'Invalid foo' },
        { key: 'bar', message: 'Invalid bar' },
        { key: 'foo', message: 'Required foo' }
      ]);
    });

  });
});
