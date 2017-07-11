'use strict';

var squadron = require('../../scripts'),
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
}).then(function (name) {
  console.log('after run for', name);
});

synchronizer.run(function () {
  return testPromise(100, 'promise 2').then(function () {
    throw new Error('promise 2 error');
  });
}).catch(function (err) {
  console.log(err.message);
});

sporks.timeout(1000).then(function () {
  synchronizer.run(function () {
    return testPromise(100, 'promise 3');
  }).then(function (name) {
    console.log('after run for', name);
  });
});

synchronizer.once('all-done', function () {
  console.log('all-done');
});

synchronizer.on('process-error', function (err) {
  console.log('process-error', err.message);
});
