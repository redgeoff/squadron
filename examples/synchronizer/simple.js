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
});

synchronizer.run(function () {
  return testPromise(100, 'promise 2');
});
