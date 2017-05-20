# Contributing


Run All Tests And Analyze Code Coverage
---

    $ npm run test


Run All Test (Without Analyzing Code Coverage)
---

    $ npm run node-test


Run Single Test (Without Analyzing Code Coverage)
---

    $ npm run node-test -- -g <testname>


Running Browser Tests With Coverage
---

		$ npm run browser-coverage-full-test

You can filter full browser tests using the GREP env variable, e.g.

		$ GREP='e2e basic' npm run browser-coverage-full-test


Running Tests in PhantomJS
---

    $ npm run browser-test-phantomjs


You can filter the PhantomJS tests using the GREP env variable, e.g.

    $ GREP='e2e basic' npm run browser-test-phantomjs


Running Tests in Chrome and Firefox Automatically
---

Currently, this cannot be done in the VM as this project has not been configured to run Chrome and Firefox via Selenium headlessly. You can however use

    $ npm run test-firefox
    $ npm run test-chrome

to test outside the VM, assuming you have Firefox and Chrome installed.


Running Tests In Any Browser Manually
---

    $ npm run browser-server
    Point any browser to http://app.quizster.dev:8006/test/browser/index.html
    You can also run a specific test, e.g. http://app.quizster.dev:8006/test/browser/index.html?grep=mytest


Debugging Tests Using Node Inspector
---

    $ node-inspector # leave this running in this window
    Use *Chrome* to visit http://app.quizster.dev:8080/?ws=127.0.0.1:8080&port=5858
    $ mocha -g 'should restore from store' test --debug-brk


Publishing to npm
---
    Modify version in package.json
    git add -A
    git commit -m 'VERSION'
    git tag vVERSION
    git push origin master --tags
    npm publish
