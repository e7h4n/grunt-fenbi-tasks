/*
 * cdn.js
 *
 * Copyright (c) 2012 "PerfectWorks" Ethan Zhang
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

/*jslint node: true, vars: true, nomen: true, indent: 4, plusplus: true, sloppy: true*/

"use strict";

module.exports = function (grunt) {
    var _ = require('underscore');
    var fs = require('fs');

    function expandFiles(param) {
        if (grunt.file.expand) {
            return grunt.file.expand({
                filter: 'isFile'
            }, param);
        }

        return grunt.file.expandFiles(param);
    }

    grunt.registerMultiTask('jsctags', 'Generate jsctags.', function () {
        var done = this.async();

        var root = this.data.root;
        var files = this.data.files.map(function (file) {
            return root + file;
        });

        files = expandFiles(files);

        var exec = require('child_process').exec;
        var command = grunt.template.process('jsctags -L <%=root%> <%=files%>', {
            root: root,
            files: files.join(' ')
        });

        grunt.log.write('Generating tags for' + files.length + ' files...');

        var child = exec(command, function (error, stdout, stderr) {
            if (error === null) {
                grunt.log.ok();
            } else {
                grunt.log.error();
                grunt.fatal(stderr);
            }
            done();
        });
    });
};
