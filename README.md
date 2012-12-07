# grunt-fenbi-tasks

Grunt tasks used by [fenbi.com]. To build handlebars template, combine [SeaJS] modules, generate jsctags, hash file, etc.

## Getting Started
This is an internal task set used by [fenbi.com], read each source before use it.

Install the module with: `npm install grunt-fenbi-tasks`

```javascript
grunt.initConfig({
    handlebars: {
        development: {
            src: SOURCE,
            dest: TARGET_SOURCE,
            files: '**/*.handlebars',
            templateModule: 'util/Template'
        },
        release: {
            src: TEMP_SOURCE,
            dest: TEMP_SOURCE,
            files: '**/*.handlebars',
            templateModule: 'util/Template'
        }
    },

    hash: {
        release: {
            src: TEMP_BUILD,
            dest: TARGET_RELEASE,
            urlPrefix: '/s/',
            files: '**/*.*',
            staticMap: TARGET + 'WEB-INF/view/global/StaticMap.vm'
        },

        cdn: {
            src: TEMP_BUILD,
            dest: TARGET + 's/',
            urlPrefix: '//cdn.yuanti.ku/s/',
            files: '**/*.*',
            staticMap: TARGET + 'WEB-INF/view/global/StaticMap.vm'
        }
    },

    jsctags: {
        development: {
            root: SOURCE,
            files: [
                'bootstrap/**/*.js',
                'collection/**/*.js',
                'component/**/*.js',
                'global/**/*.js',
                'model/**/*.js',
                'page/**/*.js',
                'router/**/*.js',
                'task/**/*.js',
                'util/**/*.js'
            ]
        }
    },

    combo: {
        release: {
            src: TEMP_SOURCE,
            dest: TEMP_BUILD,
            bootstrap: 'bootstrap/**/*.js',
            loader: 'loader.js'
        }
    }
});
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/gruntjs/grunt).

## Release History

`0.1.3` 2012-12-07 Rename task `cdn` to `hash`.
`0.1.2` 2012-12-07 Fix combo bug, modify README.md.
`0.1.0` 2012-12-06 First release.

## License
Copyright (c) 2012 PerfectWorks  
Licensed under the MIT license.

[fenbi.com]: http://fenbi.com
[SeaJS]: http://seajs.org
