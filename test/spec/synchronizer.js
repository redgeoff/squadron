'use strict';

var sporks = require('sporks'),
  Promise = require('sporks/scripts/promise'),
  Synchronizer = require('../../scripts').Synchronizer;

describe('synchronizer', function () {

  var synchronizer = null,
    labels = null;

  beforeEach(function () {
    labels = [];
    synchronizer = new Synchronizer();
  });

  var timeoutFactory = function (label, ms) {
    return function () {
      return sporks.timeout(ms).then(function () {
        labels.push(label);
      });
    };
  };

  it('should synchronize', function () {
    var promises = [];

    // This promise factory gets run 1st and is longer
    promises.push(synchronizer.run(timeoutFactory(1, 200)));

    // This promise factory gets run 2nd and is shorter, but it doesn't matter as it is run after
    // the 1st
    promises.push(synchronizer.run(timeoutFactory(2, 100)));

    return Promise.all(promises).then(function () {
      // Make sure the promises ran in order
      labels.should.eql([1, 2]);
    });
  });

  it('should handle errors', function () {
    var promises = [],
      err = null;

    // A promise should throw an error and be caught, but this should not stop the processing of
    // other promises. Instead the error should be returned to the caller of run().

    var promise1 = synchronizer.run(function () {
      return sporks.timeout(200).then(function () {
        throw new Error('some err');
      });
    }).catch(function (_err) {
      err = _err;
    });

    promises.push(promise1);

    promises.push(synchronizer.run(function () {
      return sporks.timeout(100);
    }));

    return Promise.all(promises).then(function () {
      // Make sure the caller of run() got the error
      (err !== null).should.eql(true);
    });
  });

  it('should handle gap in scheduling', function () {
    // 1st promise
    return synchronizer.run(function () {
      return sporks.timeout(100);
    }).then(function () {
      // The gap
      return sporks.timeout(200);
    }).then(function () {
      // 2nd promise
      return synchronizer.run(function () {
        return sporks.timeout(100);
      });
    });
  });

  it('should handle non promise factories', function () {
    return synchronizer.run(function () {
      // Doesn't return promise here
    });
  });

  it('should preserve orders', function () {
    var promises = [],
      expectedLabels = [];

    for (var i = 1; i <= 10; i++) {
      promises.push(synchronizer.run(timeoutFactory(i, 200 - i * 50)));
      expectedLabels.push(i);
    }

    return Promise.all(promises).then(function () {
      // If the promises weren't chained sequentially then they would complete in different orders
      labels.should.eql(expectedLabels);
    });
  });

  it('should count processes', function () {
    var promises = [];

    for (var i = 1; i <= 5; i++) {
      promises.push(synchronizer.run(timeoutFactory(i, 1)));
    }

    synchronizer.numProcesses().should.eql(5);

    return Promise.all(promises);
  });

  it('should emit process-done', function () {
    var done = sporks.once(synchronizer, 'process-done');
    return synchronizer.run(timeoutFactory(1, 1)).then(function () {
      return done;
    });
  });

  it('should emit process-error', function () {
    var errored = sporks.once(synchronizer, 'process-error'),
      err = new Error('some err');

    return synchronizer.run(function () {
      return sporks.timeout(1).then(function () {
        throw err;
      });
    }).catch(function () {
      return errored;
    }).then(function (args) {
      args[0].message.should.eql(err.message);
    });
  });

  it('should emit all-done', function () {
    synchronizer.run(timeoutFactory(1, 1));
    synchronizer.run(timeoutFactory(2, 1));

    return sporks.once(synchronizer, 'all-done').then(function () {
      labels.should.eql([1, 2]);
    });
  });

  it('should resolve when all done', function () {
    // Nothing is scheduled so should resolve immediately
    return synchronizer.allDone().then(function () {
      synchronizer.run(timeoutFactory(1, 1));
      synchronizer.run(timeoutFactory(2, 1));
      return synchronizer.allDone();
    }).then(function () {
      labels.should.eql([1, 2]);
    });
  });

});
