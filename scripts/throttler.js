'use strict';

var Synchronizer = require('./synchronizer'),
  inherits = require('inherits'),
  events = require('events'),
  sporks = require('sporks'),
  Promise = require('sporks/scripts/promise');

var Throttler = function (maxConcurrentProcesses) {
  this._maxConcurrentProcesses = maxConcurrentProcesses ? maxConcurrentProcesses :
    Throttler.DEFAULT_MAX_CONCURRENT_PROCESSES;
  this._synchronizers = [];
};

inherits(Throttler, events.EventEmitter);

Throttler.DEFAULT_MAX_CONCURRENT_PROCESSES = 20;

Throttler.prototype.setMaxConcurrentProcesses = function (maxConcurrentProcesses) {
  // TODO: this will probably only work when increasing the number. Enhance this so that we can also
  // reduce the number
  this._maxConcurrentProcesses = maxConcurrentProcesses;
};

Throttler.prototype.getMaxConcurrentProcesses = function () {
  return this._maxConcurrentProcesses;
};

Throttler.prototype.run = function (promiseFactory) {
  var synchronizerWithMinProcesses = null;

  // Loop through the current list of synchronizers to find the synchronizer with the least amount
  // of running processes.
  this._synchronizers.forEach(function (synchronizer) {
    if (synchronizerWithMinProcesses === null || synchronizer.numProcesses() <
      synchronizerWithMinProcesses.numProcesses()) {
      synchronizerWithMinProcesses = synchronizer;
    }
  });

  // If a synchronizer wasn't found or the synchronizer has any processes then we create a new
  // synchronizer--assuming of course, that we can have more concurrent processes. This essentially
  // results in an on-demand intantiation of synchronizers, which allows us to conserve resources
  // when multiple synchronizers aren't needed.
  if ((!synchronizerWithMinProcesses || synchronizerWithMinProcesses.numProcesses() > 0) &&
    this._synchronizers.length < this._maxConcurrentProcesses) {
    // Create a new synchronizer and add it to the list
    synchronizerWithMinProcesses = new Synchronizer();
    this._listenToSynchronizer(synchronizerWithMinProcesses);
    this._synchronizers.push(synchronizerWithMinProcesses);
  }

  // Run the process
  return synchronizerWithMinProcesses.run(promiseFactory);
};

Throttler.prototype._listenToSynchronizer = function (synchronizer) {
  var self = this,
    events = ['process-done', 'process-error', 'all-done', 'process-done-or-error'];

  events.forEach(function (event) {
    synchronizer.on(event, function () {
      var args = sporks.toArgsArray(arguments);
      self.emit.apply(self, [event].concat(args));
    });
  });
};

Throttler.prototype.numProcesses = function () {
  var n = 0;

  this._synchronizers.forEach(function (synchronizer) {
    n += synchronizer.numProcesses();
  });

  return n;
};

// Resolve when all processes are done or there are no processes
Throttler.prototype.allDone = function () {
  var promises = [];
  this._synchronizers.forEach(function (synchronizer) {
    promises.push(synchronizer.allDone());
  });
  return Promise.all(promises);
};

module.exports = Throttler;
