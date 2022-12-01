import fs from 'fs';

let itemProperties = ["id","name", "access", "maxNumber", "eventNames", "wikiEntry","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","staticStats","evoMag","evade","singleWieldingOneHanded","singleWielding", "dualWielding", "oneWeaponMastery", "chainMastery", "accuracy","damageVariance", "jumpDamage", "lbFillRate", "lbPerTurn", "element","partialDualWield","resist","ailments","killers","mpRefresh","esperStatsBonus","lbDamage", "drawAttacks", "skillEnhancement","special","allowUseOf","guts", "evokeDamageBoost","exclusiveSex","exclusiveUnits","exclusiveRoles","equipedConditions","tmrUnit", "stmrUnit" ,"icon","sortId","notStackableSkills", "rarity", "skills", "autoCastedSkills", "counterSkills", "startOfTurnSkills","conditional"];
let falsePositives = ["404003200", "302004300"]

console.log("Starting");
fs.readFile('./data.json', function (err, content) {
    var result = {"items": []}
    let items = JSON.parse(content);
    
    Object.keys(items).forEach((item, value) => {
        let currentName = items[item].name

        let english = checkForJapanese(currentName.toString())

        if (english === true) {
            items[item].access.forEach((accessType)=> {
                if (accessType === 'not released yet'){
                    console.log("Found English unreleased: " + currentName)
                    if (currentName.includes('Dark')){
                        items[item].access = ['darkVisions']
                    } else if (currentName.includes('Coeurl Whip') || 
                               currentName.includes('Bunny Mask') || 
                               currentName.includes('Summer Cap') ||
                               currentName.includes("Physalis's Swimsuit") ||
                               currentName.includes("Moog Beach Ball") ||
                               currentName.includes("Little Mermaid's Hairband")){
                        items[item].access = ['event']
                    } else if (currentName.includes('Fixed Dice')) {
                        items[item].access = ['TMR-4*']
                    } else if (falsePositives.includes(items[item].id)){
                        console.log("Marking " + currentName + " as not released (false positive)")
                        items[item].access = ['not released yet']
                    }
                    else {
                        items[item].access = ['released']
                    }
                }
            })
        } else {
            items[item].access.forEach((accessType)=> {
                if (!accessType.includes('not released yet')){
                    items[item].access = ['not released yet']
                }
            })
        }
    });

    result.items = items;

    fs.writeFile('../../static/GL/data.json', formatOutput(result.items), (err) => {
        console.log(err)
    })
});

function checkForJapanese(checkString){
    let allowedChars = new RegExp(/^[\u00C0-\u017Fa-zA-Z0-9' !@#$%^&*+()-’]+$/)

    return allowedChars.test(checkString)
}

function formatOutput(items) {

    var result = "[\n";
    var first = true;
    for (var index in items) {
        var item = items[index]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t"
        result += formatItem(item);
    }
    result += "\n]";
    return result;
}

function formatItem(item) {
    let result = "{";
    var firstProperty = true;
    for (var propertyIndex in itemProperties) {
        var property = itemProperties[propertyIndex];
        if (item[property]) {
            if (firstProperty) {
                firstProperty = false;
            } else {
                result += ", ";
            }
            try {
                result+= "\"" + property + "\":" + JSON.stringify(item[property]);
            } catch (err) {
                console.log(item)
                console.log(err)
            }
        }
    }
    result += "}";
    return result;
}