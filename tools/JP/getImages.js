var fs = require('fs');
var request = require('request');
var PNG = require('pngjs').PNG;

function getData(filename, callback) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/' + filename, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(filename + " downloaded");
                var result = JSON.parse(body);
                callback(result);
            } else {
                console.log(error);
            }
        });
    } 


console.log("Starting");
getData('units.json', function (units) {
    for (var unitId in units) {
        var unitIn = units[unitId];
        verifyImage(unitId, unitIn.rarity_min, unitIn.rarity_max);
    }
});

function verifyImage(serieId, minRarity, maxRarity) {
    for (var i = minRarity; i <= maxRarity; i++) {
        var unitId = serieId.substr(0, serieId.length - 1) + i;
        var filePath = "../../static/img/units/unit_icon_" + unitId + ".png";
        if (!fs.existsSync(filePath)) {
            //console.log(filePath);
            for (var i = 1; i < 20; i++) {
                download("http://diffs.exviusdb.com/asset_files/global/unit_unit1_common/" + i + "/unit_icon_" + unitId + ".png",filePath);
            }
            //download("http://diffs.exviusdb.com/asset_files/ja/unit_unit8/1/unit_icon_" + unitId + ".png",filePath);
        }
    }
}

var count = 0;

var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        if (err || res.statusCode == 404) {
            count++;
            console.log(count + " !! unable to download image : " + uri);
        } else {
            request(uri).pipe(fs.createWriteStream(filename))
                .on('close', function() {
                    if (fs.existsSync(filename)) {
                        fs.createReadStream(filename).pipe(new PNG({
                            filterType: 4
                        }))
                        .on('error', function() {
                            fs.unlinkSync(filename);
                            console.log("!! image : " + uri + " invalid");
                        })
                        .on('parsed', function() {
                            console.log("image : " + uri + " downloaded and valid");
                        });
                    }
                })
            .on('error', function() {
                count++;
                console.log(count + " !! unable to download image : " + uri);
                
            });
        }
    });
}