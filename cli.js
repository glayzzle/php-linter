#!/usr/bin/env node

/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/php-linter/graphs/contributors
 * @url http://glayzzle.com
 */
'use strict';

var program     = require('commander');
var pkg         = require('./package.json');

// defines the cli API
program
    .version(pkg.version)
    .description(pkg.description)
    .usage('[options] <pattern>')
    .option('-c, --cache [path]', 'Sets a cache path')
    .option('-5, --php5', 'Disable php7 support')
    .parse(process.argv);
