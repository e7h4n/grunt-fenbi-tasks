/*
 * sprite.js
 *
 * Copyright (c) 2012 "PerfectWorks" Ethan Zhang
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

/*jslint node: true, vars: true, nomen: true, indent: 4, plusplus: true, sloppy: true, stupid: true*/

module.exports = function (grunt) {
    var json2css = require('json2css');
    var path = require('path');
    var gm = require('gm');
    var q = require('q');

    grunt.registerMultiTask('spriteJsonToLess', 'Generate sprite less from json.', function () {
        var done = this.async();

        var promises = this.files.map(function (file) {
            var defer = q.defer();

            var jsonFile = file.src[0];
            var json = JSON.parse(grunt.file.read(jsonFile));

            var image = '../../common/img/' + json[Object.keys(json)[0]].image;
            var className = path.basename(jsonFile, path.extname(jsonFile));

            if (className === 'slide') {
                Object.keys(json).forEach(function (key) {
                    if (key.indexOf('-right') === -1) {
                        return;
                    }
                    json[key].x = -99999;
                });
            }

            json2css.addTemplate('production', require('../lib/lessTemplate/production'));
            var imageFilePath = path.resolve(path.dirname(jsonFile), path.basename(json[Object.keys(json)[0]].image));
            imageFile = gm(imageFilePath);

            imageFile.size(function (err, size) {
                if (err) {
                    return defer.reject(err);
                }

                var less = json2css(json, {
                    format: 'production',
                    formatOpts: {
                        image: image,
                        className: className,
                        size: size,
                        cssClass: function (item) {
                            return '.' + item.name;
                        }
                    }
                });

                grunt.file.write(file.dest.replace('@2x', ''), less);
                grunt.log.writeln('Sprite less ' + file.dest.replace('@2x', '').cyan + ' created.');
                defer.resolve();
            });

            return defer.promise.then(function () {
                if (imageFilePath.indexOf('@2x') !== -1) {
                    var defer = q.defer();
                    var newImagePath = imageFilePath.replace('@2x', '');
                    gm(imageFilePath).resize('50%').write(newImagePath, function (err) {
                        if (err) {
                            return defer.reject(err);
                        }

                        grunt.log.writeln('@1x image ' + newImagePath.cyan + ' created.');
                        defer.resolve();
                    });

                    return defer.promise;
                }
            });
        });

        q.all(promises, done);
    });
};
