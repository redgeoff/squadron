'use strict';

var squadron = require('../../scripts');

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
