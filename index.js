/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-linter/graphs/contributors
 * @url http://glayzzle.com
 */
'use strict';

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

var phpParser = require('php-parser');
var globToRegExp = require('glob-to-regexp');

var CACHE_PATH = path.join(require('os').homedir(), '.php-linter');

/**
 * Initialize the linter with specified options
 */
var Linter = function(options) {
  this.options = {
    cache: true
  };
  if (typeof options === 'object') {
    for(var k in options) {
      if (options.hasOwnProperty(k)) {
        this.options[k] = options[k];
      }
    }
  }
};

/**
 * Checks the file results from the cache
 */
Linter.prototype.checkCache = function(filename, cb) {
  if (!this.options.cache) {
    return cb(false);
  }
  fs.stat(filename, function(err, stats) {
    if (err) {
      return cb(false);
    }
    var md5 = crypto.createHash('md5');
    var key = md5.update(filename).digest('hex');
    var results = fs.readFile(
      path.join(
        CACHE_PATH,
        key.substring(0, 2),
        key.substring(2, 4),
        key.substring(4)
      ), 'utf8',
      function(err, data) {
        if (err) {
          return cb({
            size: stats.size,
            date: stats.mtime.getTime(),
            result: null
          });
        }
        try {
          var cache = JSON.parse(data);
          if (cache.size !== stats.size || cache.date < stats.mtime.getTime()) {
            return cb({
              size: stats.size,
              date: stats.mtime.getTime(),
              result: null
            });
          }
          return cb({
            size: stats.size,
            date: stats.mtime.getTime(),
            result: cache.result
          });
        } catch(e) {
          cb({
            size: stats.size,
            date: stats.mtime.getTime(),
            result: null
          });
        }
      }
    );
  });
};

/**
 * Writes the file results to the cache
 */
Linter.prototype.setCache = function(filename, result) {
  if (this.options.cache) {
    var md5 = crypto.createHash('md5');
    var key = md5.update(filename).digest('hex');
    fs.writeFile(
      path.join(
        CACHE_PATH,
        key.substring(0, 2),
        key.substring(2, 4),
        key.substring(4)
      ), JSON.stringify(result), 'utf8'
    );
  }
  return this;
};

/**
 * Check errors into the specified file
 */
Linter.prototype.checkFile = function(filename, cb) {
  this.checkCache(filename, function(cache) {
    if (cache && cache.result !== null) {
      return cb(cache.result);
    }
    var parser = new phpParser();
    fs.readFile(filename, 'utf8', function(err, contents) {
      if (err) {
        return cb(false);
      }
      try {
        parser.parseCode(contents, filename);
        if (cache) {
          cache.result = true;
          this.setCache(filename, cache);
        }
        cb(true);
      } catch(e) {
        var error = {
          message: e.message,
          line: e.lineNumber,
          col: e.columnNumber
        };
        if (cache) {
          cache.result = error;
          this.setCache(filename, cache);
        }
        cb(error);
      }
    }.bind(this));
  }.bind(this));
};

/**
 * Checks a folder or a pattern
 */
Linter.prototype.checkPattern = function(pattern) {
  this._regex = [];
  for (var i = 0; i < pattern; i++) {
      this._regex.push(
          globToRegExp(this.options.ext[i])
      );
  }
};
