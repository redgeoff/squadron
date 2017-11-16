'use strict';

var sporks = require('sporks'),
  Debouncer = require('../../scripts').Debouncer,
  Promise = require('sporks/scripts/promise');

describe('debouncer', function () {

  var debouncer = null,
    log = null;

  beforeEach(function () {
    debouncer = new Debouncer();
    log = [];
  });

  var timeoutFactory = function (label, ms, throwError) {
    return function () {
      return sporks.timeout(ms).then(function () {
        log.push(label);

        if (throwError) {
          throw new Error('test error');
        }

        return label;
      });
    };
  };

  var sleep = function () {
    return sporks.timeout(1000);
  };

  it('should debounce', function () {
    debouncer.run(timeoutFactory(1, 100));

    debouncer.hasProcesses().should.eql(true);

    return sleep().then(function () {
      log.should.eql([1]);
    });
  });

  it('should synchronize undefined resource', function () {
    debouncer.run(timeoutFactory(1, 200));
    debouncer.run(timeoutFactory(2, 100));

    return sleep().then(function () {
      log.should.eql([1, 2]);
    });
  });

  it('should synchronize string resource', function () {
    debouncer.run(timeoutFactory(1, 200), 'a');
    debouncer.run(timeoutFactory(2, 100), 'a');

    return sleep().then(function () {
      log.should.eql([1, 2]);
    });
  });

  it('should synchronize object resource', function () {
    var resource = {
      foo: 'bar'
    };
    debouncer.run(timeoutFactory(1, 200), resource);
    debouncer.run(timeoutFactory(2, 100), resource);

    return sleep().then(function () {
      log.should.eql([1, 2]);
    });
  });

  it('should process different resources concurrently', function () {
    debouncer.run(timeoutFactory(1, 200), 'a');
    debouncer.run(timeoutFactory(2, 100), 'b');

    return sleep().then(function () {
      log.should.eql([2, 1]);
    });
  });

  it('should remove dups', function () {
    // The 2nd process is not a dup as by the time the 2nd process is scheduled, the 1st process is
    // already marked as running. The 3rd process however will be ignored as it is scheduled when
    // the 2nd process is in a waiting state.
    var p1 = debouncer.run(timeoutFactory(1, 500));
    var p2 = debouncer.run(timeoutFactory(2, 100));
    var p3 = debouncer.run(timeoutFactory(3, 100));

    return sleep().then(function () {
      log.should.eql([1, 2]);
    }).then(function () {
      return Promise.all([p1, p2, p3]);
    }).then(function (labels) {
      // Note: the third entry is the same as the second as the 3rd promise was debounced
      labels.should.eql([1, 2, 2]);
    });
  });

  it('should change concurrency', function () {
    // Change to only a single concurrent process so that all processes are synchronized
    debouncer.setConcurrency(1);

    debouncer.run(timeoutFactory(1, 200), 'a');
    debouncer.run(timeoutFactory(2, 100), 'b');

    return sleep().then(function () {
      log.should.eql([1, 2]);
    });
  });

  it('should resolve when all done', function () {
    // Nothing is scheduled so should resolve immediately
    return debouncer.allDone().then(function () {
      debouncer.run(timeoutFactory(1, 200), 'a');
      debouncer.run(timeoutFactory(2, 100), 'b');
      return debouncer.allDone();
    }).then(function () {
      log.should.eql([2, 1]);
    });
  });

  it('should handle errors', function () {
    var afterError = sporks.once(debouncer, 'process-error');
    return debouncer.run(timeoutFactory(1, 100, true)).then(function () {
      return afterError;
    });
  });

  it('should have processes when just processes being throttled', function () {
    // Fake
    debouncer._throttler.numProcesses = function () {
      return 3;
    };

    debouncer.hasProcesses().should.eql(true);
  });

});
