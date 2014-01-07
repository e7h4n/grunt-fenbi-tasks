// Load in local modules
var fs = require('fs');
var _ = require('underscore');
var mustache = require('mustache');
var tmpl = fs.readFileSync(__dirname + '/development.mustache', 'utf8');

// Define our css template fn ({items, options}) -> css
function cssTemplate(params) {
    // Localize parameters
    var items = params.items,
    options = params.options;

    items.forEach(function (item) {
        if (item.x === -99999) {
            item.px.offset_x = 'right';
        }
    });

    // Render and return CSS
    var css = mustache.render(tmpl, params);
    return css;
}

// Export our CSS template
module.exports = cssTemplate;
