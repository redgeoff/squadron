'use strict';

var Promise = require('bluebird'),
  inherits = require('inherits'),
  events = require('events'),
  utils = require('./utils');

/**
 * Uses a queue of promise factories to synchronize promises. This is helpful for when resources
 * cannot support concurrent processing.
 */
var Synchronizer = function () {
  this._promiseFactories = [];

  // The length of _promiseFactories doesn't necessarily represent the number of current processes
  // so we define _numProcesses so that we can track this counter by modifying the counter after a
  // process has completed.
  this._numProcesses = 0;

  this._running = false;
};

inherits(Synchronizer, events.EventEmitter);

Synchronizer.prototype._pushPromiseFactory = function (promiseFactory) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self._promiseFactories.push(function () {
      // Resolve after promise resolves so that processFactories() can wait for resolution
      return promiseFactory().then(function (args) {
        // Return promise so caller of run() can wait for resolution
        self.emit('process-done');
        self.emit('process-done-or-error');
        resolve(args);
      }).catch(function (err) {
        // Don't throw error here so that processFactories() can continue processing. Reject with
        // error so that caller of run() can receive error
        self.emit('process-error', err);
        self.emit('process-done-or-error');
        reject(err);
      });
    });
  });
};

Synchronizer.prototype._wrapPromiseFactory = function (promiseFactory) {
  return function () {
    // Wrap promise with Promise.resolve() so that we can also support promiseFactories that don't
    // actually return a promise
    return Promise.resolve().then(function () {
      return promiseFactory();
    });
  };
};

Synchronizer.prototype.run = function (promiseFactory) {

  this._numProcesses++;
  var promise = this._pushPromiseFactory(this._wrapPromiseFactory(promiseFactory));

  if (!this._running) {
    // Indicate that the process loop is running so that an subsequent immediate call to run() will
    // not run the process loop again
    this._running = true;
    this._processFactories();
  }

  return promise;

};

Synchronizer.prototype._chainPromiseFactory = function (chain, promiseFactory) {
  var self = this;
  return chain.then(function () {
    return promiseFactory().then(function (args) {
      self._numProcesses--;
      self._emitAllDoneWhenNoProcesses();
      return args;
    });
  });
};

Synchronizer.prototype._chainPromiseFactories = function () {
  var self = this,
    chain = Promise.resolve();

  // We need to use shift instead of forEach as we want an automic operation that gets the first
  // promiseFactory and also removes it or else our array indexes may be modified before we can
  // remove the array element.
  var promiseFactory = self._promiseFactories.shift();

  while (promiseFactory) {
    chain = self._chainPromiseFactory(chain, promiseFactory);
    promiseFactory = self._promiseFactories.shift();
  }

  return chain;
};

Synchronizer.prototype._processFactories = function () {
  var self = this;

  return self._chainPromiseFactories().then(function () {
    // Done processing all promises?
    if (self._promiseFactories.length === 0) {
      // Indicate that the process loop has been shutdown
      self._running = false;
    } else {
      // More were added since we processed the last batch so let's process them
      return self._processFactories();
    }
  });
};

Synchronizer.prototype.numProcesses = function () {
  return this._numProcesses;
};

Synchronizer.prototype._emitAllDoneWhenNoProcesses = function () {
  if (this.numProcesses() === 0) {
    this.emit('all-done');
  }
};

// Resolve when all processes are done or there are no processes
Synchronizer.prototype.allDone = function () {
  if (this.numProcesses() === 0) {
    return Promise.resolve();
  } else {
    return utils.once(this, 'all-done');
  }
};

module.exports = Synchronizer;
