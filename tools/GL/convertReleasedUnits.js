import fs from 'fs'
import unorm from 'unorm';

const { nfkc } = unorm;


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

function checkForJapanese(inputString) {
    const allowedRegex = /^[a-zA-Z0-9' !@#$%^&*()+\[\]:@{-~À-ÿ´’.,:;!?'"&$%#(){}\[\]+<>=\/*\s\u2191\-]+$/u;
  const normalizedString = unorm.nfc(inputString);
  if (!allowedRegex.test(normalizedString)) {
    return false;
  }
  for (const char of normalizedString) {
    if (/[\u3040-\u30ff\u31f0-\u31ff\u4e00-\u9faf\uff00-\uffef]/.test(char)) {
      return false;
    }
  }
  return true;
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

