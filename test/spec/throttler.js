'use strict';

var sporks = require('sporks'),
  Promise = require('sporks/scripts/promise'),
  Throttler = require('../../scripts').Throttler;

describe('throttler', function () {

  var throttler = null,
    labels = null;

  beforeEach(function () {
    throttler = new Throttler(2); // 2 concurrent processes
    labels = [];
  });

  var timeoutFactory = function (label, ms, throwError) {
    return function () {
      return sporks.timeout(ms).then(function () {
        labels.push(label);

        if (throwError) {
          throw new Error('test error');
        }
      });
    };
  };

  it('should throttle', function () {
    // Overview of test:
    // * 3 processes and 2 threads: 1: 400ms, 2: 1000ms, 3: 200ms
    // * Make sure that complete in order 1, 3, 2

    var promises = [];

    // 1: This promise factory gets run 1st and is longer than 3 so that we can verify that 1
    // finishes before 3
    promises.push(throttler.run(timeoutFactory(1, 400)));

    // 2: This promise factory gets run simultaneously with 1 and is longer than 1 + 3
    promises.push(throttler.run(timeoutFactory(2, 1000)));

    // 3: This promise factory gets run after 1 and should complete before 2
    promises.push(throttler.run(timeoutFactory(3, 200)));

    return Promise.all(promises).then(function () {
      // Make sure the promises ran in order the expected order
      labels.should.eql([1, 3, 2]);
    });
  });

  it('should set and get max concurrent processes', function () {
    throttler.setMaxConcurrentProcesses(3);
    throttler.getMaxConcurrentProcesses().should.eql(3);
  });

  it('should create throttler with default max concurrent processes', function () {
    throttler = new Throttler();
  });

  it('should count processes', function () {
    var promises = [];

    for (var i = 1; i <= 5; i++) {
      promises.push(throttler.run(timeoutFactory(i, 1)));
    }

    throttler.numProcesses().should.eql(5);

    return Promise.all(promises);
  });

  it('should emit process-done', function () {
    var done = sporks.once(throttler, 'process-done');
    return throttler.run(timeoutFactory(1, 1)).then(function () {
      return done;
    });
  });

  it('should emit process-error', function () {
    var errored = sporks.once(throttler, 'process-error'),
      err = new Error('some err');

    return throttler.run(function () {
      return sporks.timeout(1).then(function () {
        throw err;
      });
    }).catch(function () {
      return errored;
    }).then(function (args) {
      args[0].message.should.eql(err.message);
    });
  });

  it('should resolve when all done', function () {
    // Nothing is scheduled so should resolve immediately
    return throttler.allDone().then(function () {
      throttler.run(timeoutFactory(1, 1));
      throttler.run(timeoutFactory(2, 1));
      return throttler.allDone();
    }).then(function () {
      labels.should.eql([1, 2]);
    });
  });

  it('should handle errors', function () {
    var promises = [],
      err = null;

    // A promise should throw an error and be caught, but this should not stop the processing of
    // other promises. Instead the error should be returned to the caller of run().

    var promise1 = throttler.run(timeoutFactory(1, 200, true)).catch(function (_err) {
      err = _err;
    });

    promises.push(promise1);

    promises.push(throttler.run(timeoutFactory(1, 100)));

    return Promise.all(promises).then(function () {
      // Make sure the caller of run() got the error
      (err !== null).should.eql(true);
    });
  });

});
