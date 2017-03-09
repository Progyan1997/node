// When calling .end(buffer) right away, this triggers a "hot path"
// optimization in http.js, to avoid an extra write call.
//
// However, the overhead of copying a large buffer is higher than
// the overhead of an extra write() call, so the hot path was not
// always as hot as it could be.
//
// Verify that our assumptions are valid.
'use strict';

var common = require('../common.js');

var bench = common.createBenchmark(main, {
  type: ['asc', 'utf', 'buf'],
  kb: [64, 128, 256, 1024],
  c: [100],
  method: ['write', 'end']
});

function main(conf) {
  const http = require('http');
  var chunk;
  var len = conf.kb * 1024;
  switch (conf.type) {
    case 'buf':
      chunk = Buffer.alloc(len, 'x');
      break;
    case 'utf':
      chunk = new Array(len / 2 + 1).join('ü');
      break;
    case 'asc':
      chunk = new Array(len + 1).join('a');
      break;
  }

  function write(res) {
    res.write(chunk);
    res.end();
  }

  function end(res) {
    res.end(chunk);
  }

  var method = conf.method === 'write' ? write : end;

  var server = http.createServer(function(req, res) {
    method(res);
  });

  server.listen(common.PORT, function() {
    bench.http({
      connections: conf.c
    }, function() {
      server.close();
    });
  });
}
