var fs = require('fs');
var request = require('request');

request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/units.json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log("units.json downloaded");
        var unitsBase = JSON.parse(body);
        fs.readFile('../static/GL/unitsWithSkill.json', function (err, content) {
            var oldUnits = JSON.parse(content);
            for (var index in unitsBase) {
                var baseUnit = unitsBase[index];
                var unit = oldUnits[baseUnit.name];
                var id = null;
                
                
                if (unit) {
                    for (var i in baseUnit.entries) {
                    var entry = baseUnit.entries[i];
                    if (entry.rarity == unit.max_rarity) {
                        id = i;
                    }
                }
                    unit.id = id;
                }
            }
            fs.writeFileSync('unitsWithSkill.json', JSON.stringify(oldUnits));
        });
    }
});