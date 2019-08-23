var fs = require('fs');
var request = require('request');
var PNG = require('pngjs').PNG;
var commonParse = require('../commonParseUnit');

filterGame = [];
filterUnits = ["199000101", "256000301"]

var unitNamesById = {};
var unitIdByTmrId = {};
var enhancementsByUnitId = {};
var oldItemsAccessById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;
var glNameById = {};
var dev = false;
var imgUrls;

function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-jp/master/' + filename, function (error, response, body) {
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
    getData('skills_ability.json', function (skills) {
        getData('skills_passive.json', function (passives) {
            getData('skills_magic.json', function (magics) {
                Object.keys(skills).forEach(skillId => {
                    skills[skillId].active = true;
                    skills[skillId].type = "ABILITY";
                });
                Object.keys(passives).forEach(skillId => {
                    skills[skillId] = passives[skillId];
                    skills[skillId].active = false;
                    skills[skillId].type = "PASSIVE";
                });
                Object.keys(magics).forEach(skillId => {
                    skills[skillId] = magics[skillId];
                    skills[skillId].active = true;
                    skills[skillId].type = "MAGIC";
                });
                getData('limitbursts.json', function (lbs) {
                    getData('enhancements.json', function (enhancements) {
                        fs.readFile('../../static/JP/units.json', function (err, nameDatacontent) {
                            var nameData = JSON.parse(nameDatacontent);
                            for (var unitId in nameData) {
                                glNameById[unitId] = nameData[unitId].name;
                            }
                            fs.readFile('../../static/GL/units.json', function (err, nameDatacontent) {
                                fs.readFile('../imgUrls.json', function (err, imgUrlContent) {
                                    var nameData = JSON.parse(nameDatacontent);
                                    imgUrls = JSON.parse(imgUrlContent);
                                    for (var unitId in nameData) {
                                        if (nameData[unitId].name != "undefined" && nameData[unitId].name != "null") {
                                            glNameById[unitId] = nameData[unitId].name;
                                        }
                                    }
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

                                    fs.writeFileSync('unitsWithPassives.json', commonParse.formatOutput(unitsOut));
                                    fs.writeFileSync('units.json', commonParse.formatSimpleOutput(unitsOut));
                                    fs.writeFileSync('unitSearch.json', commonParse.formatForSearch(unitsOut));
                                    fs.writeFileSync('unitsWithSkill.json', commonParse.formatForSkills(unitsOut));
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

function treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, maxRariry = unitIn["rarity_max"]) {
    var unit = {};
    unit.data = {};
    
    var data = unit.data;
    var unitData;
    
    var unitStats = {"minStats":{}, "maxStats":{}, "pots":{}};
    for (entryId in unitIn.entries) {
        if (unitIn.entries[entryId].rarity == maxRariry) {
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
    if (glNameById[unitId]) {
        data["name"] = glNameById[unitId];
        data["jpname"] = unitIn["name"];
    } else {
        data["name"] = unitIn["name"];    
    }
    data["max_rarity"] = maxRariry;
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
    
    data.skills = commonParse.getPassives(unitId, unitIn.skills, skills, lbs, enhancementsByUnitId[unitId], maxRariry, unitData, data);
    
    verifyImage(unitId, data["min_rarity"], data["max_rarity"]);
    
    if (maxRariry == 7) {
        data["6_form"] = treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, 6).data;
    }
    
    return unit;
}



function verifyImage(serieId, minRarity, maxRarity) {
    for (var i = minRarity; i <= maxRarity; i++) {
        var unitId = serieId.substr(0, serieId.length - 1) + i;
        var basePath = "../../static/img/units/";
        var illus = "unit_ills_" + unitId + ".png";
        var icon = "unit_icon_" + unitId + ".png";
        var filePath = basePath + illus;
        if (!fs.existsSync(filePath)) {
            // if (imgUrls[illus]) {
            //     download(imgUrls[illus],filePath);
            // } else {
            //     console.log("!! Img url not known : " + illus);
            // }
            console.log("Missing image : " + illus);
        }
        var filePath = basePath + icon;
        if (!fs.existsSync(filePath)) {
            // if (imgUrls[icon]) {
            //     download(imgUrls[icon],filePath);
            // } else {
            //     console.log("!! Img url not known : " + icon);
            // }
            console.log("Missing image : " + icon);
        }
    }
}

var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        if (err || res.statusCode == 404) {
            console.log("!! unable to download image : " + uri);
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
                console.log("!! unable to download image : " + uri);
            });
        }
    });
};
