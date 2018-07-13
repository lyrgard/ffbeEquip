var fs = require('fs');
var request = require('request');

var stats = ["HP","MP","ATK","DEF","MAG","SPR"];
var elements = ["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"];
var ailments = ["poison", "blind", "sleep", "silence", "paralysis", "confuse", "disease", "petrification"];

var typeMap = {
    1: 'dagger',
    2: 'sword',
    3: 'greatSword',
    4: 'katana',
    5: 'staff',
    6: 'rod',
    7: 'bow',
    8: 'axe',
    9: 'hammer',
    10: 'spear',
    11: 'harp',
    12: 'whip',
    13: 'throwing',
    14: 'gun',
    15: 'mace',
    16: 'fist',
    30: 'lightShield',
    31: 'heavyShield',
    40: 'hat',
    41: 'helm',
    50: 'clothes',
    51: 'lightArmor',
    52: 'heavyArmor',
    53: 'robe',
    60: 'accessory'
}

var raceMap = {
    1: 'beast',
    2: 'bird',
    3: 'aquatic',
    4: 'demon',
    5: 'human',
    6: 'machine',
    7: 'dragon',
    8: 'spirit',
    9: 'bug',
    10: 'stone',
    11: 'plant',
    12: 'undead'
}

var ailmentsMap = {
    "Poison": "poison",
    "Blind": "blind",
    "Sleep": "sleep",
    "Silence": "silence",
    "Paralyze": "paralysis",
    "Confusion": "confuse",
    "Disease": "disease",
    "Petrify": "petrification",
    "Death": "death"
}

var elementsMap = {
    1: 'fire',
    2: 'ice',
    3: 'lightning',
    4: 'water',
    5: 'wind',
    6: 'earth',
    7: 'light',
    8: 'dark'
}

filterGame = [];
filterUnits = []

var unitNamesById = {};
var unitIdByTmrId = {};
var enhancementsByUnitId = {};
var oldItemsAccessById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;
var glNameById = {};
var dev = false;

function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-jp/master/' + filename, function (error, response, body) {
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

// {"type":"event","name":"Yun"},

console.log("Starting");
getData('units.json', function (units) {
    fs.readFile('../../static/GL/releasedUnits.json', function (err, glDatacontent) {
        var glData = JSON.parse(glDatacontent);
        var unitsOut = {};
        var result = "{\n";
        var first = true;
        for (var unitId in units) {
            var unitIn = units[unitId];
            if (!filterGame.includes(unitIn["game_id"]) && !unitId.startsWith("9") && unitIn.name &&!filterUnits.includes(unitId)) {
                if (first) {
                    first = false;
                } else {
                    result += ",";
                }
                if (glData[unitId]) {
                    result += "\n\t\"" + unitId + "\": {\"type\":\"" + glData[unitId].type + "\",\"name\":\"" + glData[unitId].name + "\",\"jpname\":\"" +  unitIn.name + "\"}";
                } else {
                    result += "\n\t\"" + unitId + "\": {\"type\":\"unknown\",\"name\":\"" + unitIn.name + "\"}";
                }
            }
        }
        result += "\n}";
        fs.writeFileSync('releasedUnits.json', result);
    });
});

