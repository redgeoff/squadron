'use strict';

var Promise = require('bluebird');

var Utils = function () {};

Utils.prototype.timeout = function (sleepMs) {
  return new Promise(function (resolve) {
    setTimeout(resolve, sleepMs);
  });
};

Utils.prototype.once = function (emitter, evnt) {
  return new Promise(function (resolve) {
    emitter.once(evnt, function () {
      resolve(arguments);
    });
  });
};

module.exports = new Utils();
