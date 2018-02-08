var fs = require('fs');
var request = require('request');


console.log("Starting");


fs.readFile('../../static/GL/releasedUnits.json', function (err, content) {
    var releasedUnitsIn = JSON.parse(content);
    fs.readFile('../../static/GL/units.json', function (err, content) {
        var unitsIn = JSON.parse(content);
        var releasedUnitsOut = {};
        for (var name in releasedUnitsIn) {
            for (var unitId in unitsIn) {
                if (name == unitsIn[unitId].name) {
                    releasedUnitsOut[unitId] = releasedUnitsIn[name];
                    releasedUnitsOut[unitId].name = name;
                }
            }
        }
        fs.writeFileSync('releasedUnits.json', formatOutput(releasedUnitsOut));
    });
});

function formatOutput(units) {
    var properties = ["id","name","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evade","singleWielding","singleWieldingOneHanded","singleWieldingGL","singleWieldingOneHandedGL","accuracy","damageVariance","element","partialDualWield","resist","ailments","killers","mpRefresh","special","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit","access","icon"];
    var result = "{";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t\"" + unitId + "\" : " + JSON.stringify(unit);
    }
    result += "\n}";
    return result;
}

