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
    var q = require('q');
    var gm = require('gm');

    grunt.registerMultiTask('spriteJsonToLess', 'Generate sprite less from json.', function () {
        var options = this.options();

        this.files.forEach(function (file) {
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
            var less = json2css(json, {
                format: 'production',
                formatOpts: {
                    image: image,
                    className: className,
                    cssClass: function (item) {
                        return '.' + item.name;
                    }
                }
            });

            grunt.file.write(file.dest, less);
            grunt.log.writeln('Sprite less ' + file.dest.cyan + ' created.');
        });
    });

    grunt.registerMultiTask('spriteToLess', 'Generate sprite less from images.', function () {
        var options = this.options();
        var done = this.async();

        function getImageSize(image) {
            var deferred = q.defer();

            gm(image).size(function (err, value) {
                if (err) {
                    deferred.reject(err);
                    return;
                }

                deferred.resolve({
                    image: image,
                    value: value
                });
            });
            return deferred.promise;
        }

        var filePromises = this.files.map(function (file) {
            var deferred = q.defer();

            var spriteDirectory = file.src[0];
            var images = grunt.file.expand(path.join(spriteDirectory, '**/*.png'));

            q.all(images.map(getImageSize)).then(function (ret) {
                var json = ret.map(function (item) {
                    var slideRight = item.image.indexOf('/slide/') !== -1 && item.image.indexOf('-right.png') !== -1;
                    return {
                        name: path.basename(item.image, path.extname(item.image)),
                        image: item.image.replace(file.orig.cwd, '../../common/png'),
                        x: slideRight ? -99999 : 0,
                        y: 0,
                        width: item.value.width,
                        height: item.value.height
                    };
                });

                json2css.addTemplate('development', require('../lib/lessTemplate/development'));
                var less = json2css(json, {
                    format: 'development',
                    formatOpts: {
                        className: path.basename(spriteDirectory),
                        cssClass: function (item) {
                            return '.' + item.name;
                        }
                    }
                });

                grunt.file.write(file.dest, less);
                grunt.log.writeln('Sprite less ' + file.dest.cyan + ' created.');

                deferred.resolve();
            }, function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        });

        q.all(filePromises).then(function (ret) {
            done();
        }, function (err) {
            done(false);
        });
    });
};
