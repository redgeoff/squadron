# Testing

## Test in node

This will run the tests in node:

    $ npm run node-test

You can also check for 100% code coverage using:

    $ npm run node-full-test
    You can then view the test coverage by opening cache/coverage/node/lcov-report/index.html in a browser

Run specific tests:

    $ npm run node-test -- -- -g 'some reg-ex'

Run specific tests and generate code coverage:

    $ npm run node-test -- -- --coverage -g 'some reg-ex'


## Manual browser tests

    $ npm run browser-server
    Use any browser to visit http://127.0.0.1:8001/index.html
    And you can filter the tests, e.g. http://127.0.0.1:8001/index.html?grep=reg-ex


## Automated browser tests

Headless testing in Chrome:

Note: you must have Chrome installed

    $ npm run browser-test

You can also filter the tests, e.g.

    $ npm run browser-test -- -g 'some reg-ex'

Firefox:

Note: you must have Firefox installed

    $ npm run browser-test-phantomjs -- -b selenium:firefox

Test in phantomjs, generate code coverage and check for 100% coverage:

    $ npm run browser-coverage-full-test

You can then view the test coverage by opening cache/coverage/browser/lcov-report/index.html in any browser
