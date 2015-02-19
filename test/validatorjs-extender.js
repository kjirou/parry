var assert = require('power-assert');

var validatorjs = require('../index').validatorjs;


describe('validatorjs-extender module', function() {

  it('isGT', function() {
    assert(validatorjs.isGT('2.9', 3) === false);
    assert(validatorjs.isGT('3', 3) === false);
    assert(validatorjs.isGT('3.1', 3));
    assert(validatorjs.isGT('not_numeric', 3) === false);
  });

  it('isGTE', function() {
    assert(validatorjs.isGTE('3.1', 3));
    assert(validatorjs.isGTE('3', 3));
    assert(validatorjs.isGTE('2.9', 3) === false);
    assert(validatorjs.isGTE('1.23456789', '1.23456789'));
    assert(validatorjs.isGTE('1.23456788', '1.23456789') === false);
    assert(validatorjs.isGTE('not_numeric', 3) === false);
  });

  it('isInvalid', function() {
    assert(validatorjs.isInvalid() === false);
  });

  it('isLT', function() {
    assert(validatorjs.isLT('2.9', 3));
    assert(validatorjs.isLT('3', 3) === false);
    assert(validatorjs.isLT('3.1', 3) === false);
    assert(validatorjs.isLT('not_numeric', 3) === false);
  });

  it('isLTE', function() {
    assert(validatorjs.isLTE('2.9', 3));
    assert(validatorjs.isLTE('3', 3));
    assert(validatorjs.isLTE('3.1', 3) === false);
    assert(validatorjs.isLTE('1.23456789', '1.23456789'));
    assert(validatorjs.isLTE('1.23456790', '1.23456789') === false);
    assert(validatorjs.isLTE('not_numeric', 3) === false);
  });

  it('isRequired', function() {
    assert(validatorjs.isRequired('a'));
    assert(validatorjs.isRequired('') === false);
  });

  it('isPositiveInt', function() {
    assert(validatorjs.isPositiveInt('0'));
    assert(validatorjs.isPositiveInt('1'));
    assert(validatorjs.isPositiveInt('1.1') === false);
    assert(validatorjs.isPositiveInt('-1') === false);
    assert(validatorjs.isPositiveInt('not_numeric') === false);
  });

  it('isPositiveNumber', function() {
    assert(validatorjs.isPositiveNumber('0'));
    assert(validatorjs.isPositiveNumber('1'));
    assert(validatorjs.isPositiveNumber('1.1'));
    assert(validatorjs.isPositiveNumber('-1') === false);
    assert(validatorjs.isPositiveNumber('-0.1') === false);
    assert(validatorjs.isPositiveNumber('not_numeric') === false);
  });

});
