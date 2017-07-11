'use strict';

var Promise = require('sporks/scripts/promise'),
  sporks = require('sporks'),
  Synchronizer = require('./synchronizer'),
  Throttler = require('./throttler'),
  inherits = require('inherits'),
  events = require('events');

// Synchronizes the processing of resources and removes any duplicates according to a resource so
// that we can avoid unnecessary processing. Guarantees that processing is always done after the
// latest request. Processes are guaranteed to execute in a first-come first-served order.

var Debouncer = function () {
  this._processes = [];

  // Synchronize access to the _processes list
  this._synchronizer = new Synchronizer();

  // Use a throttler so that we don't slam the processor with many simultaneous processes
  this._throttler = new Throttler(Debouncer.CONCURRENCY);
};

inherits(Debouncer, events.EventEmitter);

Debouncer.CONCURRENCY = 20;

Debouncer.prototype._find = function (resource) {
  var proc = null;

  sporks.each(this._processes, function (process) {
    if (process.resource === resource) {
      proc = process;

      // If the process is not running then exit the loop as we have found a duplicate
      if (!process.running) {
        return false; // stop loop
      }
    }
  });

  return proc;
};

Debouncer.prototype._getSynchronizer = function (existingProcessForResource) {

  // Is there already a synchronizer for this resource?
  var synchronizer = null;
  if (existingProcessForResource && existingProcessForResource.synchronizer) {
    synchronizer = existingProcessForResource.synchronizer;
  } else {
    synchronizer = new Synchronizer();
  }

  return synchronizer;

};

Debouncer.prototype._wrapPromiseFactory = function (promiseFactory, process) {
  var self = this;

  return function () {
    // Wrap in a promise so that we can handle non-promises
    return Promise.resolve().then(function () {
      // Denote as running so that we no longer consider this a duplicate process. Instead we'll add
      // another entry to the process list.
      process.running = true;
    }).then(function () {
      return promiseFactory();
    }).then(function () {
      // Remove from list as the process has completed. We need to use indexOf as splice
      // changes array indexes and therefore we may otherwise try to remove an index that is
      // outdated.
      var index = self._processes.indexOf(process);
      self._processes.splice(index, 1);

      // No more processes? Emit an all-done event
      if (self._processes.length === 0) {
        self.emit('all-done');
      }
    });
  };
};

Debouncer.prototype._throttleProcess = function (synchronizer, promiseFactory, process) {
  // Use a throttler so that we don't slam the processor with many simultaneous processes
  var self = this;
  return self._throttler.run(function () {
    return synchronizer.run(self._wrapPromiseFactory(promiseFactory, process));
  });
};

Debouncer.prototype._runProcess = function (resource, promiseFactory, existingProcessForResource) {
  var synchronizer = this._getSynchronizer(existingProcessForResource);

  var process = {
    resource: resource,
    running: false,
    synchronizer: synchronizer
  };

  this._processes.push(process);

  return this._throttleProcess(synchronizer, promiseFactory, process);
};

Debouncer.prototype._schedule = function (promiseFactory, resource) {
  var process = this._find(resource);

  // Was this resource already scheduled? We don't want to schedule duplicates as we only want to
  // make sure that we are running the process after the latest request. If a resource is running
  // then consider it missing from the list so that it can be rescheduled
  if (!process || process.running) {
    return this._runProcess(resource, promiseFactory, process);
  } else {
    // Make sure that a promise is returned
    return Promise.resolve();
  }
};

// If omitted, the resource will be undefined and will essentially act as a shared resource,
// effectively synchronizing all processes that are scheduled without a resource.
Debouncer.prototype.run = function (promiseFactory, resource) {
  // Synchronize calls to schedule so that we don't have a race condition where we query and add to
  // the pocess list simultaneously--we need to ensure that we use the same synchronizer per
  // resource.
  var self = this;
  return self._synchronizer.run(function () {
    // We don't return the _schedule promise here as we don't want to synchronize all calls to
    // runProcess as we want to be able to process different resources simulatenously.
    self._schedule(promiseFactory, resource).catch(function (err) {
      // The errors happen asynchronously and we may want to detect them at the Debouncer layer. In
      // general though, it is probably best that the process factories handle these errors.
      self.emit('process-error', err);
    });
  });
};

Debouncer.prototype.setConcurrency = function (concurrency) {
  this._throttler._maxConcurrentProcesses = concurrency;
};

// Resolve when all processes are done or there are no processes
Debouncer.prototype.allDone = function () {
  // Wait for the last of the schedulings to complete and then wait for the actual processes to
  // complete.
  var self = this;
  return self._synchronizer.allDone().then(function () {
    return self._throttler.allDone();
  });
};

Debouncer.prototype.hasProcesses = function () {
  return this._synchronizer.numProcesses() > 0 || this._throttler.numProcesses() > 0;
};

module.exports = Debouncer;
