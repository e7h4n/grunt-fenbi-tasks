/*
 * hash.js
 *
 * Copyright (c) 2012 "PerfectWorks" Ethan Zhang
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

/*jslint node: true, vars: true, nomen: true, indent: 4, plusplus: true, sloppy: true*/

module.exports = function (grunt) {
    var path = require('path');
    var _ = require('underscore');

    function hashFile(filePath, content) {
        content = content || grunt.file.read(filePath);

        var crypto = require('crypto');
        var fileHash = crypto.createHash('sha1').update(content).digest('hex');
        fileHash = fileHash.substr(0, 8);
        fileHash += path.extname(filePath);

        return fileHash;
    }

    grunt.registerMultiTask('hash', 'Rename static files to hash name.', function () {
        var data = this.data;
        var src = data.src;
        var files = data.files.forEach ? data.files : [data.files];
        var dest = data.dest;
        var urlPrefix = data.urlPrefix;
        var staticMap = data.staticMap;

        var getStaticUrl = function (hash) {
            return urlPrefix + hash;
        };

        var processedFile = _.memoize(function (fileAbsPath) {
            if (['.map'].indexOf(path.extname(fileAbsPath)) !== -1) {
                return processedFile(fileAbsPath.replace(/\.map$/, '')) + '.map';
            }

            if (['.css'].indexOf(path.extname(fileAbsPath)) === -1) {
                return hashFile(fileAbsPath);
            }

            /*jslint regexp: true*/
            var urlReg = /url\((['"]?)(.+?)(['"]?)\)/g;
            /*jslint regexp: false*/

            var fileContent = grunt.file.read(fileAbsPath);

            var newFileContent = fileContent.replace(urlReg, function ($0, $1, includePath, $3) {
                grunt.verbose.writeln('Found file include: ' + includePath);

                if (includePath.charAt(0) === '/') {
                    includePath = path.resolve(src, includePath);
                } else {
                    includePath = path.resolve(path.dirname(fileAbsPath), includePath);
                }

                var hash = processedFile(includePath);
                return hash ? 'url(' + $1 + getStaticUrl(hash) + $3 + ')' : $0;
            });

            grunt.file.write(fileAbsPath, newFileContent);

            return hashFile(fileAbsPath, newFileContent);
        });

        var hashList = {};
        files.forEach(function (file) {
            grunt.file.expandFiles(src + file).forEach(function (filePath) {
                var hash = processedFile(path.resolve(filePath));

                hashList[filePath.replace(src, '')] = hash;

                var output = dest + hash;
                grunt.log.writeln('File ' + output.cyan + ' <-> ' + filePath.cyan + '.');

                if (['.map', '.js', '.css'].indexOf(path.extname(filePath)) === -1) {
                    grunt.file.copy(filePath, output);
                    return;
                }

                var content = grunt.file.read(filePath);

                if (path.extname(filePath) === '.map') {
                    var map = JSON.parse(content);
                    map.file = getStaticUrl(hash.replace(/\.map$/, ''));
                    content = JSON.stringify(map);
                } else {
                    content = content.replace(/sourceMappingURL=([a-zA-Z0-9\.\-_\/\\]*)/g, function ($0, $1) {
                        return 'sourceMappingURL=' + hash + '.map';
                    });
                }
                grunt.file.write(output, content);
            });

            grunt.file.write(staticMap, '#set($staticFileMap = ' + JSON.stringify(hashList) + ')');
        });

        if (this.errorCount) {
            return false;
        }
    });
};
