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

    params.retinaItems = [];
    params.items = items.filter(function (item) {
        if (item.x === -99999) {
            item.px.offset_x = 'right';
        }

        if (item.name.indexOf('@2x') !== -1) {
            if (item.width % 2 || item.height % 2) {
                throw new Error('invalid image size of "' + item.name + '" for retina display.');
            }

            item.name = item.name.replace('@2x', '');
            item.width = item.width / 2;
            item.height = item.height / 2;
            params.retinaItems.push(item);
            return false;
        }

        return true;
    });

    // Render and return CSS
    var css = mustache.render(tmpl, params);
    return css;
}

// Export our CSS template
module.exports = cssTemplate;
