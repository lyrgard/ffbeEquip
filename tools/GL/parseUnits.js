var fs = require('fs');
var request = require('request');
var PNG = require('pngjs').PNG;
var commonParse = require('../commonParseUnit');



filterGame = [20001, 20002, 20007, 20008, 20011, 20012];
filterUnits = ["100014604","100014504","100014703","100014405", "199000101"]

const languages = ["en", "zh", "ko", "fr", "de", "es"];

var unitNamesById = {};
var unitIdByTmrId = {};
var enhancementsByUnitId = {};
var oldItemsAccessById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;

var languageId;

var dev = process.argv.length > 2 && process.argv[2] == "dev";

function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/' + filename, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(filename + " downloaded");
                var result = JSON.parse(body);
                callback(result);
            } else {
                console.log(error);
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
getData('units.json', function (units) {
    getData('skills.json', function (skills) {
        getData('limitbursts.json', function (lbs) {
            getData('enhancements.json', function (enhancements) {
                for (languageId = 0; languageId < languages.length; languageId++) {
                    for (var index in enhancements) {
                        var enhancement = enhancements[index];
                        for (var unitIdIndex in enhancement.units) {
                            var unitId = enhancement.units[unitIdIndex].toString();
                            if (!enhancementsByUnitId[unitId]) {
                                enhancementsByUnitId[unitId] = {};
                            }
                            enhancementsByUnitId[unitId][enhancement.skill_id_old.toString()] = enhancement.skill_id_new.toString();
                        }
                    }

                    var unitsOut = {};
                    for (var unitId in units) {
                        var unitIn = units[unitId];
                        if (!filterGame.includes(unitIn["game_id"]) && !unitId.startsWith("9") && unitIn.name &&!filterUnits.includes(unitId)) {
                            var unitOut = treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId);
                            unitsOut[unitOut.data.id] = unitOut.data;
                        }
                    }

                    var filename = 'unitsWithPassives.json';
                    if (languageId != 0) {
                        filename = 'unitsWithPassives_' + languages[languageId] +'.json';
                    }
                    fs.writeFileSync(filename, commonParse.formatOutput(unitsOut));
                    filename = 'units.json';
                    if (languageId != 0) {
                        filename = 'units_' + languages[languageId] +'.json';
                    }
                    fs.writeFileSync(filename, commonParse.formatSimpleOutput(unitsOut));

                    if (languageId == 0) {
                        fs.writeFileSync('unitSearch.json', commonParse.formatForSearch(unitsOut));
                        fs.writeFileSync('unitsWithSkill.json', commonParse.formatForSkills(unitsOut));
                    }
                }
            });
        });
    });
});

function treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, maxRarity = unitIn["rarity_max"]) {
    var unit = {};
    unit.data = {};
    
    var data = unit.data;
    var unitData;
    
    var unitStats = {"minStats":{}, "maxStats":{}, "pots":{}};
    for (entryId in unitIn.entries) {
        if (unitIn.entries[entryId].rarity == maxRarity) {
            unitData = unitIn.entries[entryId];
            for (var statIndex in commonParse.stats) {
                var stat = commonParse.stats[statIndex];
                unitStats.minStats[stat.toLowerCase()] = unitData["stats"][stat][0];
                unitStats.maxStats[stat.toLowerCase()] = unitData["stats"][stat][1];
                unitStats.pots[stat.toLowerCase()] = unitData["stats"][stat][2];
            }
            data["stats_pattern"] = unitData.stat_pattern;
            if (unitData.ability_slots != 4) {
                data["materiaSlots"] = unitData.ability_slots;
            }
            if (unitData.physical_resist) {
                data.mitigation = {"physical":unitData.physical_resist};
            }
            if (unitData.magical_resist) {
                if (!data.mitigation) {
                    data.mitigation = {};
                }
                data.mitigation.magical = unitData.magical_resist;  
            }
            break;
        }
    }
    data["name"] = unitIn.names[languageId];
    if (languageId != 0) {
        data.wikiEntry = unitIn.name.replace(' ', '_');
    }
    data["max_rarity"] = unitIn["rarity_max"];
    data["min_rarity"] = unitIn["rarity_min"];
    data["stats"] = unitStats;
    if (!unitIn.sex) {
        console.log(unitIn);
    }
    data["sex"] = unitIn.sex.toLowerCase();
    data["equip"] = commonParse.getEquip(unitIn.equip);
    data["id"] = unitId;
    
    data["enhancementSkills"] = [];
    for (skillIndex in unitIn.skills) {
        if (unitIn.skills[skillIndex].rarity > unitIn.rarity_max) {
            continue; // don't take into account skills for a max rarity not yet released
        }
        var skillId = unitIn.skills[skillIndex].id.toString();
        if (enhancementsByUnitId[unitId] && enhancementsByUnitId[unitId][skillId]) {
            data["enhancementSkills"].push(skills[skillId].name);
        }
    }
    
    data.skills = commonParse.getPassives(unitId, unitIn.skills, skills, lbs, enhancementsByUnitId[unitId], maxRarity, unitData, data);
    verifyImage(unitId, data["min_rarity"], data["max_rarity"]);
    
    if (maxRarity == 7) {
        data["6_form"] = treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, 6).data;
    }
    
    return unit;
}


function verifyImage(serieId, minRarity, maxRarity) {
    for (var i = minRarity; i <= maxRarity; i++) {
        var unitId = serieId.substr(0, serieId.length - 1) + i;
        var filePath = "../../static/img/units/unit_ills_" + unitId + ".png";
        if (!fs.existsSync(filePath)) {
            download("http://diffs.exviusdb.com/asset_files/global/unit_unit7_common/3/unit_ills_" + unitId + ".png",filePath);
        }
        var filePath = "../../static/img/units/unit_icon_" + unitId + ".png";
        if (!fs.existsSync(filePath)) {
            download("http://diffs.exviusdb.com/asset_files/global/unit_unit7_common/3/unit_icon_" + unitId + ".png",filePath);
        }
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
