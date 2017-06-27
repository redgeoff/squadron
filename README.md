# squadron

[![Greenkeeper badge](https://badges.greenkeeper.io/redgeoff/squadron.svg)](https://greenkeeper.io/)

Synchronize, throttle and debounce promises


TODO
---
Throttler and Debouncer (not yet included in this repo are essential), but can't something like the following be used in place of Synchronizer?? Any benefit to using Synchronizer or should it be refactored out?

    var synchronizer = Promise.resolve();

    synchronizer = synchronizer.then(function () {
      // promise 1
    });

    synchronizer = synchronizer.then(function () {
      // promise 2
    });


Installation
---

    npm install squadron


Synchronizer
---

The Synchronizer can be used to synchronize any set of promises. It can be very useful when you need to ensure sequential ordering. It can also be used to implement a mutex around a resource as it ensures that only one promise can access the resource concurrently.

    var squadron = require('squadron');

    var testPromise = function (milliseconds, name) {
      console.log('begin', name);
      return squadron.utils.timeout(milliseconds).then(function () {
        console.log('end', name);
        return name;
      });
    };

    var synchronizer = new squadron.Synchronizer();

    synchronizer.run(function () {
      return testPromise(200, 'promise 1');
    });

    synchronizer.run(function () {
      return testPromise(100, 'promise 2');
    });

The output is then

    begin promise 1
    end promise 1
    begin promise 2
    end promise 2
