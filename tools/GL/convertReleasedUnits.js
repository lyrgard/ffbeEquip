import e from 'express';
import fs from 'fs'
import request from 'request'


console.log("Starting");


fs.readFile('../../static/GL/releasedUnits.json', function (err, content) {
    var releasedUnitsIn = JSON.parse(content);
    fs.readFile('../../static/GL/units.json', function (err, content) {
        let unitsIn = JSON.parse(content);
        let releasedUnitsOut = {};
        let releasedOK = Object.keys(releasedUnitsIn)
        Object.keys(unitsIn).forEach(unitId => { 
            if (!releasedOK.includes(unitId)){
                if (unitsIn[unitId].max_rarity == 'NV') {
                    let checkSkillsForJP = unitsIn[unitId]?.enhancementSkills;
                    if (checkSkillsForJP && checkSkillsForJP !== undefined) {
                        if (checkForJapanese(checkSkillsForJP[0])){
                            console.log("\"" + unitsIn[unitId].id + "\":" + unitsIn[unitId].name)
                            releasedUnitsIn[unitId] = {
                                "type": "summon",
                                "name": unitsIn[unitId].name
                            }
                        }
                    }
                }
            }
        })
        
        fs.writeFileSync('../../static/GL/releasedUnits.json', JSON.stringify(releasedUnitsIn));
    });
});

function checkForJapanese(checkString){
    let allowedChars = new RegExp(/^[\u00C0-\u017Fa-zA-Z0-9' !@#$%^&*+()-’]+$/)

    return allowedChars.test(checkString)
}

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

