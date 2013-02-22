/*
 * minimize.js
 *
 * Copyright (c) 2012 "PerfectWorks" Ethan Zhang
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

/*jslint node: true, vars: true, nomen: true, indent: 4, plusplus: true, sloppy: true, stupid: true*/

module.exports = function (grunt) {
    var path = require('path');
    var fs = require('fs');
    var UglifyJS = require('uglify-js');
    var gzip = require('gzip-js');

    function expandFiles(param) {
        if (grunt.file.expand) {
            return grunt.file.expand({
                filter: 'isFile'
            }, param);
        }

        return grunt.file.expandFiles(param);
    }

    grunt.registerMultiTask('minimize', 'Minimize JavaScript files.', function () {
        var data = this.data;
        var src = data.src;
        var dest = data.dest;

        this.data.files.forEach(function (file) {
            expandFiles(src + file).forEach(function (filePath) {
                var outputPath = filePath.replace(src, dest);

                var mapFile = filePath + '.map';
                var hasMap = fs.existsSync(mapFile);
                var options = {
                    fromString: true,
                    warnings: false
                };

                if (hasMap) {
                    options.inSourceMap = mapFile;
                    options.outSourceMap = mapFile;
                    options.sourceRoot = data.sourceMap.sourceRoot;
                }

                var content = grunt.file.read(filePath);
                var result = UglifyJS.minify(content, options);

                var code = result.code;
                if (hasMap) {
                    code += '\n//@ sourceMappingURL=' + path.basename(filePath) + '.map';
                }

                grunt.file.write(filePath, code);

                if (hasMap) {
                    var map = JSON.parse(result.map);
                    map.sources = map.sources.map(function (source) {
                        return source.replace(data.sourceMap.sourceRoot, '');
                    });

                    grunt.file.write(mapFile, JSON.stringify(map));
                }

                if (src !== dest) {
                    grunt.log.writeln('File "' + filePath + '" minimized to ' + outputPath + '.');
                } else {
                    grunt.log.writeln('File "' + filePath + '" minimized.');
                }

                var gzipSize = String(gzip.zip(code, {}).length);
                grunt.log.writeln('Uncompressed size: ' + String(content.length).green + ' bytes.');
                grunt.log.writeln('Compressed size: ' + gzipSize.green + ' bytes gzipped (' + String(code.length).green + ' bytes minified).');
            });
        });
    });
};
