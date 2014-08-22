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

        return fileHash + '-' + path.basename(filePath);
    }

    grunt.registerMultiTask('hash', 'Rename static files to hash name.', function () {
        var options = this.options();
        var urlPrefix = options.urlPrefix;
        var staticMap = options.staticMap;
        var staticJSON = options.staticJSON;
        var root = path.resolve(options.root);

        var getStaticUrl = function (hash) {
            return urlPrefix + hash;
        };

        var processedFile = _.memoize(function (fileAbsPath, replaceRoot) {
            if (['.css'].indexOf(path.extname(fileAbsPath)) === -1) {
                return hashFile(fileAbsPath);
            }

            // process css include image path

            /*jslint regexp: true*/
            var urlReg = /url\((['"]?)(.+?)(['"]?)\)/g;
            /*jslint regexp: false*/

            var fileContent = grunt.file.read(fileAbsPath);

            var newFileContent = fileContent.replace(urlReg, function ($0, $1, includePath, $3) {
                if (includePath.indexOf('data:') === 0) {
                    return $0;
                }

                grunt.verbose.writeln('Found file include: ' + includePath);

                if (includePath.charAt(0) === '/') {
                    includePath = path.resolve(root, includePath);
                } else {
                    includePath = path.resolve(path.dirname(fileAbsPath), includePath);
                    if (replaceRoot) {
                        includePath = includePath.replace(replaceRoot, root);
                    }
                }

                var hash = processedFile(includePath);
                return hash ? 'url(' + $1 + getStaticUrl(hash) + $3 + ')' : $0;
            });

            grunt.file.write(fileAbsPath, newFileContent);

            return hashFile(fileAbsPath, newFileContent);
        }, function (a) {
            return a;
        });

        var hashList = {};

        this.files.forEach(function (file) {
            var filePath = file.src[0];
            var dest = path.normalize(file.orig.dest);

            var hash = processedFile(path.resolve(filePath), path.resolve(file.orig.cwd));

            hashList[filePath.replace(file.orig.cwd, '')] = hash;

            var output = dest + hash;
            grunt.log.writeln('File ' + output.cyan + ' <-> ' + filePath.cyan + '.');

            grunt.file.copy(filePath, output);
        });

        if (staticMap) {
            grunt.file.write(staticMap, '#set($staticFileMap = ' + JSON.stringify(hashList) + ')');
        }

        if (staticJSON) {
            grunt.file.write(staticJSON, JSON.stringify(hashList));
        }

        if (this.errorCount) {
            return false;
        }
    });
};
