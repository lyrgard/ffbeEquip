var fs = require('fs');
var request = require('request');

var dev = false;

function getData(filename, callback) {
    if (!dev) {
        request.get('http://ffbeEquip.lyrgard.fr/GL/' + filename, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(filename + " downloaded");
                var result = JSON.parse(body);
                callback(result);
            }
        });
    } else {
        fs.readFile('./sources/' + filename, function (err, content) {
            var result = JSON.parse(content);
            callback(result);
        });
    }
}

console.log("Starting");
if (!fs.existsSync('./data.json')) {
    console.log("old data not accessible");
    return;
}
getData('corrections.json', function (corrections) {
    fs.readFile('../../static/GL/data.json', function (err, dataContent) {
        var data = JSON.parse(dataContent);
        
        for (var index = data.length; index--;) {
            var item = data[index];
            if (corrections[item.id]) {
                var log = item.name + ": access=" + JSON.stringify(item.access) + ", maxNumber=" + (item.maxNumber ? item.maxNumber : "N/A") +
                    "  ==>>  access=" + JSON.stringify(corrections[item.id].access) + ", maxNumber=" + (corrections[item.id].maxNumber ? corrections[item.id].maxNumber : "N/A");
                var i = 0;
                while (i < item.access.length) {
                    if (item.access[i].startsWith("TMR")) {
                        i++;
                    } else {
                        item.access.splice(i,1);
                    }
                }
                item.access = item.access.concat(corrections[item.id].access);
                if (corrections[item.id].maxNumber) {
                    item.maxNumber = corrections[item.id].maxNumber;
                } else {
                    delete item.maxNumber;
                }
                
                
                console.log(log);
            }
        }
        
        fs.writeFileSync('data.json', formatOutput(data));
    });
});

function formatOutput(items) {
    var properties = ["id","name","wikiEntry","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evoMag","evade","singleWieldingOneHanded","singleWielding","accuracy","damageVariance", "jumpDamage", "lbFillRate", "lbPerTurn", "element","partialDualWield","resist","ailments","killers","mpRefresh","esperStatsBonus","special","allowUseOf","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit","access","maxNumber","eventName","icon","sortId","notStackableSkills", "rarity"];
    var result = "[\n";
    var first = true;
    for (var index in items) {
        var item = items[index]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t{";
        var firstProperty = true;
        for (var propertyIndex in properties) {
            var property = properties[propertyIndex];
            if (item[property]) {
                if (firstProperty) {
                    firstProperty = false;
                } else {
                    result += ", ";
                }
                result+= "\"" + property + "\":" + JSON.stringify(item[property]);
            }
        }
        result += "}";
    }
    result += "\n]";
    return result;
}

function verifyImage(icon) {
    var filePath = "../../static/img/items/" + icon;
    if (!fs.existsSync(filePath)) {
        download("http://exviusdb.com/static/img/assets/item/" + icon ,filePath);
    }
}

var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        if (err || res.statusCode == 404) {
            console.log("!! unable to download image : " + uri);
        } else {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', function() {
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
                
            });
        }
    });
};