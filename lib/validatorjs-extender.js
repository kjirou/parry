module.exports = function validatorjsExtender(validatorjs) {

  // threshold is number type
  validatorjs.extend('isGT', function(str, threshold) {
    var num = this.toFloat(str);
    return !isNaN(num) && num > threshold;
  });

  // threshold is number type
  validatorjs.extend('isGTE', function(str, threshold) {
    var num = this.toFloat(str);
    return !isNaN(num) && num >= threshold;
  });

  // threshold is number type
  validatorjs.extend('isLT', function(str, threshold) {
    var num = this.toFloat(str);
    return !isNaN(num) && num < threshold;
  });

  // threshold is number type
  validatorjs.extend('isLTE', function(str, threshold) {
    var num = this.toFloat(str);
    return !isNaN(num) && num <= threshold;
  });

  validatorjs.extend('isInvalid', function(str) {
    return false;
  });

  validatorjs.extend('isRequired', function(str) {
    return str.length > 0;
  });

  validatorjs.extend('isPositiveInt', function(str) {
    if (!this.isInt(str)) return false;
    var int = this.toInt(str);
    return !isNaN(int) && int >= 0;
  });

  validatorjs.extend('isPositiveNumber', function(str) {
    return this.isGTE(str, 0);
  });
};
