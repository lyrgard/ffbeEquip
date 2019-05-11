/* 
 * FBBE Equip Script
 * Generates CSS files containing all image from specific folders as background Data URI
 * Good for performance (less HTTP request on server)
 * 
 * Image are found in static/img folder
 * Generated CSS are found in static/css-img folder
 * See the LISTING constants
 * 
 * Usage in code:
 *      <i class="img img-[CLASSNAME]-[IMGNAME]"></i>
 *         With:
 *            [CLASSNAME] depending on the CSS file
 *            [IMGNAME] depending on the desired image
 * 
 * By default, the icon has the same size as the image.
 * To resize it, you need to override *both* width/height rules by CSS.
 * 
 * Note: The generated CSS should be placed in HTML head before any 
 *       other css file (before common.css, for instance).
 *       It allows to easily override size rules.
 */


var fs = require( 'fs' );
var path = require( 'path' );
var sizeOf = require('image-size');

const LISTING = [
    {
        className: 'banner',
        basePath: '../static/img/banner', 
        outPath: '../static/css-img/banner.css'
    },
    {
        className: 'homepage',  // there is already "background-" in the file name
        basePath: '../static/img/homepage/backgrounds', 
        outPath: '../static/css-img/homepage-backgrounds.css'
    },
    {
        className: 'homepage',
        basePath: '../static/img/homepage', 
        outPath: '../static/css-img/homepage.css'
    },
    {
        className: 'esper',
        basePath: '../static/img/espers', 
        outPath: '../static/css-img/espers.css'
    },
    {
        className: 'crystal',
        basePath: '../static/img/icons/crystals', 
        outPath: '../static/css-img/crystals.css'
    },
    {
        className: 'equipment',
        basePath: '../static/img/icons/equipments', 
        outPath: '../static/css-img/equipments.css'
    },
    {
        className: 'element',
        basePath: '../static/img/icons/elements', 
        outPath: '../static/css-img/elements.css'
    },
    {
        className: 'ailment',
        basePath: '../static/img/icons/ailments', 
        outPath: '../static/css-img/ailments.css'
    },
    {
        className: '', // there is already "sort" in the file name
        basePath: '../static/img/icons/sort', 
        outPath: '../static/css-img/sorts.css'
    },
    {
        className: 'killer',
        basePath: '../static/img/icons/killers', 
        outPath: '../static/css-img/killers.css'
    },
    {
        className: 'slot',
        basePath: '../static/img/icons/slots', 
        outPath: '../static/css-img/slots.css'
    },
    {
        className: 'tab',
        basePath: '../static/img/icons/tabs', 
        outPath: '../static/css-img/tabs.css'
    },
    {
        className: 'stat',
        basePath: '../static/img/icons/stats', 
        outPath: '../static/css-img/stats.css'
    },
    {
        className: 'access',
        basePath: '../static/img/icons/access', 
        outPath: '../static/css-img/access.css'
    },
    {
        className: 'tankAbilities',
        basePath: '../static/img/icons/tankAbilities', 
        outPath: '../static/css-img/tankAbilities.css'
    },
    {
        className: 'mitigation',
        basePath: '../static/img/icons/mitigationAbilities',
        outPath: '../static/css-img/mitigationAbilities.css'
    },
];

var CssTemplate = function(className, filename, dimensions, base64Data) {
    var fileparsed = path.parse(filename);
    var filenameNoExt = fileparsed.name;
    var filetype = fileparsed.ext.replace('.', '');

    if (className) className += '-';

    return `
.img-${className}${filenameNoExt} {
    width: ${dimensions.width}px; height: ${dimensions.height}px;
    background-image: url(data:image/${filetype};base64,${base64Data});
}`;
};

var BuildCssFromImgFolder = function(className, basePath, outPath) {
    console.log(`In folder ${basePath}...`);

    var filenames = fs.readdirSync(basePath);
    var CssContent = `
/* 
 * Generated on ${new Date(Date.now()).toString()}
 */\n`;

    filenames.forEach(function(name) {
        var currPath = path.join(basePath, name);

        if (fs.lstatSync(currPath).isDirectory()) return;

        console.log(`   Processing ${name}...`);

        var dimensions = sizeOf(currPath);
        var fileContentBase64 = (fs.readFileSync(currPath)).toString('base64');
        
        CssContent += CssTemplate(className, name, dimensions, fileContentBase64);
    });

    fs.writeFileSync(outPath, CssContent, 'utf8');
};

for (let index = 0; index < LISTING.length; index++) {
    const element = LISTING[index];
    BuildCssFromImgFolder(element.className, element.basePath, element.outPath);
}
