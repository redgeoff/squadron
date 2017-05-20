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


Publishing to npm
---
    Modify version in package.json
    git add -A
    git commit -m 'VERSION'
    git tag vVERSION
    git push origin master --tags
    npm publish
