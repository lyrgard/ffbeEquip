
var fs = require( 'fs' );
var path = require( 'path' );
var sizeOf = require('image-size');

const LISTING = [
    {
        className: 'esper',
        basePath: '../static/img/espers', 
        outPath: '../static/css-img/espers.css'
    },
    {
        className: 'crystal',
        basePath: '../static/img/icons/crystals', 
        outPath: '../static/css-img/crystals.css'
    }
];

var CssTemplate = function(className, filename, dimensions, base64Data) {
    var fileparsed = path.parse(filename);
    var filenameNoExt = fileparsed.name;
    var filetype = fileparsed.ext.replace('.', '');

    return `
.img-${className}-${filenameNoExt} {
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

    filenames.forEach(function(filename) {
        var filepath = path.join(basePath, filename);
        console.log(`   Processing ${filename}...`);

        var dimensions = sizeOf(filepath);
        var fileContentBase64 = (fs.readFileSync(filepath)).toString('base64');
        
        CssContent += CssTemplate(className, filename, dimensions, fileContentBase64);
    });

    fs.writeFileSync(outPath, CssContent, 'utf8');
};

for (let index = 0; index < LISTING.length; index++) {
    const element = LISTING[index];
    BuildCssFromImgFolder(element.className, element.basePath, element.outPath);
}