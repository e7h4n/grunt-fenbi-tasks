/*
 * handlebars.js
 *
 * Copyright (c) 2012 "PerfectWorks" Ethan Zhang
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

/*jslint node: true, vars: true, nomen: true, indent: 4, plusplus: true, sloppy: true*/

module.exports = function (grunt) {
    var path = require('path');
    var handlebars = require('handlebars');

    /**
     * Convert mustache template file to javascript script.
     */
    function generateTemplate(filePath, rootPath, tmplClass) {
        var content = grunt.file.read(filePath);
        var moduleName = filePath.replace(rootPath, '').replace(/^\//, '');

        /*
         * Calc out the className in `require` function
         * xxx.handlebars -> ../util/Template
         * a/xxx.handlebars -> ../../util/Template
         * a/a/xxx.handlebars -> ../../../util/Template
         */
        var pathCount = moduleName.split('/').length - 1;
        while (pathCount > 0) {
            tmplClass = '../' + tmplClass;
            pathCount -= 1;
        }

        var precompile = handlebars.precompile(content);

        return 'define(function(require){' +
            'var Template = require("' + tmplClass + '");' +
            'return new Template("' + moduleName + '", ' + precompile + ');' +
            '});';
    }

    grunt.registerMultiTask('handlebars', 'Compile handlebars template to SeaJS module.', function (arg1, arg2) {
        var config = this.data;
        var src = config.src;
        var dest = config.dest;
        var files = config.files;
        var templateModule = config.templateModule;

        files = files.forEach ? files : [files];

        files.forEach(function (file) {
            grunt.file.expandFiles(src + file).forEach(function (path) {
                var result = generateTemplate(path, src, templateModule);

                var output = path.replace(src, dest) + '.js';

                grunt.file.write(output, result);

                if (this.errorCount) {
                    return false;
                }

                grunt.log.writeln('File ' + output.cyan + ' created.');
            }, this);
        }, this);
    });

};
