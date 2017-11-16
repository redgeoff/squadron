# squadron

[![Circle CI](https://circleci.com/gh/redgeoff/squadron.svg?style=svg&circle-token=b29ea543b83db42a9ea44ed4ce4ae4cdccc3be21)](https://circleci.com/gh/redgeoff/squadron) [![Greenkeeper badge](https://badges.greenkeeper.io/redgeoff/squadron.svg)](https://greenkeeper.io/)

Synchronize, throttle and debounce promises


Installation
---

    npm install squadron


Synchronizer
---

The Synchronizer can be used to synchronize any set of promises. It can be very useful when you need to ensure sequential ordering. It can also be used to implement a mutex around a resource as it ensures that only one promise can access the resource concurrently.

```js
var squadron = require('squadron'),
  sporks = require('sporks');

var testPromise = function (milliseconds, name) {
  console.log('begin', name);
  return sporks.timeout(milliseconds).then(function () {
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
```

The output is then

    begin promise 1
    end promise 1
    begin promise 2
    end promise 2
