/*
 * combo.js
 *
 * Copyright (c) 2012 'PerfectWorks' Ethan Zhang
 * Licensed under the MIT license.
 * https://github.com/gruntjs/grunt/blob/master/LICENSE-MIT
 */

/*jslint node: true, vars: true, nomen: true, indent: 4, plusplus: true, sloppy: true*/

module.exports = function (grunt) {
    var path = require('path');
    var _ = require('underscore');
    var UglifyJS = require('uglify-js');

    var PLACE_HOLDER = 'PLACE_HOLDER';

    grunt.registerMultiTask('combo', 'Compile handlebars template to SeaJS module.', function () {
        var src = this.data.src;
        var dest = this.data.dest;
        var bootstrap = this.data.bootstrap;
        var loader = this.data.loader;

        function readModule(modName) {
            return grunt.file.read(src + modName + '.js');
        }

        function compareAst(template, array, PLACE_HOLDER) {
            var index, _i, _len;
            if ((_.isArray(template)) && (_.isArray(array))) {
                if (template.length !== array.length) {
                    return false;
                }
                for (index = _i = 0, _len = template.length; _i < _len; index = ++_i) {
                    var statement = template[index];
                    if (!compareAst(statement, array[index], PLACE_HOLDER)) {
                        return false;
                    }
                }
                return true;
            }
            if (template === PLACE_HOLDER && array !== void 0) {
                return true;
            }
            if (template === array) {
                return true;
            }
            return false;
        }

        function normlizePath(ast, relativePath, rootPath) {
            var walker = new UglifyJS.TreeWalker(function (node, descend) {
                if (!(node instanceof UglifyJS.AST_Call)) {
                    return;
                }

                if (node.expression.property !== undefined) {
                    return;
                }

                if (node.start.value !== 'require') {
                    return;
                }

                var modName = node.args[0].value;

                var string = new UglifyJS.AST_String({
                    value: path.resolve(relativePath, modName).replace(path.resolve(rootPath), '').replace(/^\//, '')
                });
                node.args.pop();
                node.args.push(string);
            });

            ast.walk(walker);

            return ast;
        }

        function getJSDependencies(ast) {
            var deps = [];

            var walker = new UglifyJS.TreeWalker(function (node, descend) {
                if (!(node instanceof UglifyJS.AST_Call)) {
                    return;
                }

                if (node.expression.property !== undefined) {
                    return;
                }

                if (node.start.value !== 'require') {
                    return;
                }

                deps.push(node.args[0].value);
            });

            ast.walk(walker);

            return deps;
        }

        function moduleWalk(modName, rootPath, process, trace) {
            var ast, content, deps, fileType, filename;

            if (trace === null) {
                trace = [];
            }

            deps = [];
            content = readModule(modName);
            ast = UglifyJS.parse(content);
            ast = normlizePath(ast, path.dirname(path.resolve(rootPath, modName + '.js')), rootPath);
            deps = getJSDependencies(ast);
            process(modName, ast);

            return deps.map(function (modName) {
                if ((trace.indexOf(modName)) === -1) {
                    trace.push(modName);
                    return moduleWalk(modName, rootPath, process, trace);
                }
            });
        }

        function generateJSCode(ast, modName) {
            var string = new UglifyJS.AST_String({
                value: modName
            });

            var walker = new UglifyJS.TreeWalker(function (node, descend) {
                if (node instanceof UglifyJS.AST_Call && node.start.value === 'define' && node.args.length === 1) {
                    node.args.unshift(string);
                }
            });

            ast.walk(walker);

            var stream = UglifyJS.OutputStream({
                beautify: true
            });
            ast.print(stream);

            return stream.toString() + ';';
        }

        grunt.file.expandFiles(src + bootstrap).forEach(function (jsFile) {
            var modName = jsFile.replace(src, '').replace(/\.js$/, '');
            grunt.log.writeln('Module ' + modName.cyan + ' created.');

            var depsQueue = [];
            var modules = {};
            moduleWalk(modName, src, function (modName, ast) {
                modules[modName] = modules[modName] || generateJSCode(ast, modName);
            }, depsQueue);

            depsQueue = depsQueue.sort();
            depsQueue.push(modName);
            var finalCode = depsQueue.reduce(function (memo, modName) {
                return memo + modules[modName] + '\n';
            }, grunt.file.read(src + loader));

            var outputfile = jsFile.replace(src, dest);
            grunt.file.write(outputfile, finalCode);

            grunt.log.writeln('Module ' + (modName + '.vendor').cyan + ' created');
            var vendors = [];
            grunt.file.read(jsFile).replace(/^(?:\s*\*\s*@vendor\s+)([0-9\-\.a-zA-Z\/]+)(?:\s*)$/gm, function ($0, $1) {
                if ($1 === 'handlebars') {
                    $1 += '.runtime';
                }
                vendors.push($1);
            });

            var vendor = vendors.reduce(function (memo, vendor) {
                return memo + readModule('vendor/' + vendor);
            }, '');
            grunt.file.write(outputfile.replace(/\.js/, '.vendor.js'), vendor);
        });
    });
};
