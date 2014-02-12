'use strict';

// Load in local modules
var fs = require('fs');
var _ = require('underscore');
var mustache = require('mustache');
var tmpl = fs.readFileSync(__dirname + '/production.mustache', 'utf8');

// Define our css template fn ({items, options}) -> css
function cssTemplate(params) {
    // Localize parameters
    var items = params.items,
    options = params.options;

    params.options.retina = params.options.image.indexOf('@2x') !== -1;
    if (params.options.retina) {
        params.options.bgWidth = Math.round(options.size.width / 2);
        params.options.bgHeight = Math.round(options.size.height / 2);
        params.options.className = params.options.className.replace('@2x', '');
        params.options.image2x = params.options.image;
        params.options.image = params.options.image.replace('@2x', '');
    }

    items.forEach(function (item) {
        if (item.x === -99999) {
            item.px.offset_x = 'right';
        }

        if (params.options.retina) {
            if (item.px.offset_x !== 'right') {
                item.px.offset_x = Math.round(parseFloat(item.px.offset_x) / 2) + 'px';
            }
            item.px.offset_y = Math.round(parseFloat(item.px.offset_y) / 2) + 'px';
            item.px.width = Math.round(parseFloat(item.px.width) / 2) + 'px';
            item.px.height = Math.round(parseFloat(item.px.height) / 2) + 'px';
        }
    });

    // Render and return CSS
    var css = mustache.render(tmpl, params);
    return css;
}

// Export our CSS template
module.exports = cssTemplate;
