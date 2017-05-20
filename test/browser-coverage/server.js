#!/usr/bin/env node

'use strict';

var HTTP_PORT = 8006;
var httpServer = require('http-server');

httpServer.createServer().listen(HTTP_PORT);
console.log('Tests: http://127.0.0.1:' + HTTP_PORT + '/test/browser-coverage/index.html');
