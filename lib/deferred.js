var Promise = require('bluebird');
var _ = require('lodash');


var Deferred = function Deferred() {
  this.promise = new Promise(
    _.bind(function(resolve, reject) {
      this._resolve = resolve;
      this._reject = reject;
    }, this)
  );
};

Deferred.prototype.resolve = function(value) {
  this._resolve.call(this.promise, value);
};

Deferred.prototype.reject = function(reason) {
  this._reject.call(this.promise, reason);
};


module.exports = Deferred;
