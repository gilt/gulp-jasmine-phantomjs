'use strict';

var fs = require('fs'),
  path = require('path'),
  url = require('url'),
  spawn = require('child_process').spawn,
  through = require('through2'),
  gutil = require('gulp-util'),
  pluginName = 'gulp-jasmine-phantomjs';

function jasminePhantomJS (options) {
  options = options || {};

  var scriptPath = require.resolve('node-jasmine-phantomjs');

  if (!fs.existsSync(scriptPath)) {
    throw new gutil.PluginError(pluginName, 'jasmine-phantomjs.js not found');
  }

  return through.obj(function (file, enc, cb) {
    var args = [
      scriptPath,
      file.path,
      JSON.stringify(options.phantomjs || {})
    ];

    spawnPhantomJS(args, options, function (err) {
      if (err) {
        this.emit('error', err);
      }

      this.push(file);

      cb();
    }.bind(this));
  });
}

function spawnPhantomJS(args, options, cb) {

  var phantomjsPath = path.join(path.dirname(require.resolve('phantomjs')), '../bin/phantomjs'),
    errors = [],
    phantomjs;

  if (!phantomjsPath) {
    return cb(new gutil.PluginError(pluginName, 'PhantomJS not found'));
  }

  phantomjs = spawn(phantomjsPath, args);

  phantomjs.stdout.pipe(process.stdout);

  phantomjs.stderr.on('data', function (data) {
    errors.push(data);
  });

  phantomjs.on('error', function (err) {
    cb(new gutil.PluginError(pluginName, err.message));
    phantomjs.kill(1);
  });

  phantomjs.on('exit', function (code) {
    if (errors.length) {
      for(var i = 0; i < errors.length; i++){
        console.log('[phantom] ' + errors[i]);
      }
    }

    if (code === 0 || options.silent) {
      cb();
    } else {
      cb(new gutil.PluginError(pluginName, 'Tests Failed: PhantomJS exited with code: ' + code));
    }
  });
}

module.exports = jasminePhantomJS
