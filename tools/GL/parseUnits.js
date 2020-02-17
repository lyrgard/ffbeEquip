var fs = require('fs');
var request = require('request');
var PNG = require('pngjs').PNG;
var commonParse = require('../commonParseUnit');



filterGame = [20001, 20002, 20007, 20008, 20011, 20012];
filterUnits = ["100014604","100014504","100014703","100014405", "199000101", "332000105", "256000301", "204002104", "204002003", "204001904", "204001805", "100017005", "307000303", "307000404", "307000204", "100027005", "318000205"]

const languages = ["en", "zh", "ko", "fr", "de", "es"];

var unitNamesById = {};
var unitIdByTmrId = {};
var enhancementsByUnitId = {};
var latentSkillsByUnitId = {};
var oldItemsAccessById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;
var jpNameById = {};

var languageId;

var dev = process.argv.length > 2 && process.argv[2] == "dev";
if (dev) {
    console.log("dev mode : ON");
} else {
    console.log("dev mode : OFF");
}

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
                        getData('unit_latent_skills.json', function (latentSkills) {
                            request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-jp/master/units.json', function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    console.log("jp units downloaded");
                                    var jpUnits = JSON.parse(body);
                                    fs.readFile('../imgUrls.json', function (err, imgUrlContent) {
                                        imgUrls = JSON.parse(imgUrlContent);

                                        fs.readFile('../../static/JP/units.json', function (err, nameDatacontent) {

                                            var nameData = JSON.parse(nameDatacontent);
                                            for (var unitId in nameData) {
                                                jpNameById[unitId] = nameData[unitId].name;
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
                                            let enhancedLatentAbilities = [];
                                            Object.keys(latentSkills).forEach(id => {
                                                let latentSkill = latentSkills[id];
                                                let unitId = latentSkill.units[0].toString();
                                                if (latentSkill.next_id) {
                                                    if (!enhancementsByUnitId[unitId]) {
                                                        enhancementsByUnitId[unitId] = {};
                                                    }
                                                    enhancementsByUnitId[unitId][latentSkill.skill_id.toString()] = latentSkills[latentSkill.next_id].skill_id.toString();
                                                    enhancedLatentAbilities.push(latentSkills[latentSkill.next_id].skill_id.toString());
                                                }
                                                if (!enhancedLatentAbilities.includes(latentSkill.skill_id.toString())) {
                                                    if (!latentSkillsByUnitId[unitId]) {
                                                        latentSkillsByUnitId[unitId] = [];
                                                    }
                                                    latentSkillsByUnitId[unitId].push(latentSkill.skill_id.toString());
                                                }
                                            });

                                            let unitIds = [];
                                            for (var unitId in units) {
                                                var unitIn = units[unitId];
                                                if (!filterGame.includes(unitIn["game_id"]) && !unitId.startsWith("9") && unitIn.name && !filterUnits.includes(unitId)) {
                                                    unitIds.push(unitId);
                                                }
                                            }
                                            getJPUnitData(unitIds, function (jpUnitsString, jpUnitsWithPassiveString, jpUnitsWithSkillString, jpUnitSearchString) {
                                                getCustomUnitData(function (customUnitsString, customUnitsWithPassiveString, customUnitsWithSkillString, customUnitSearchString) {
                                                    for (languageId = 0; languageId < languages.length; languageId++) {

                                                        var unitsOut = {};
                                                        unitIds.forEach(unitId => {
                                                            var unitIn = units[unitId];
                                                            var unitOut = treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, jpUnits, latentSkillsByUnitId);
                                                            unitsOut[unitOut.data.id] = unitOut.data;
                                                        });

                                                        var filename = 'unitsWithPassives.json';
                                                        if (languageId != 0) {
                                                            filename = 'unitsWithPassives_' + languages[languageId] + '.json';
                                                        }
                                                        let string = commonParse.formatOutput(unitsOut);
                                                        string = string.substr(0, string.length - 1) + ',\n' + jpUnitsWithPassiveString + ',\n' + customUnitsWithPassiveString + '\n}';
                                                        fs.writeFileSync(filename, string);
                                                        filename = 'units.json';
                                                        if (languageId != 0) {
                                                            filename = 'units_' + languages[languageId] + '.json';
                                                        }
                                                        string = commonParse.formatSimpleOutput(unitsOut);
                                                        string = string.substr(0, string.length - 1) + ',\n' + jpUnitsString + ',\n' + customUnitsString + '\n}';
                                                        fs.writeFileSync(filename, string);

                                                        if (languageId == 0) {
                                                            string = commonParse.formatForSearch(unitsOut);
                                                            string = string.substr(0, string.length - 1) + ',\n' + jpUnitSearchString + ',\n' + customUnitSearchString + '\n]';
                                                            fs.writeFileSync('unitSearch.json', string);

                                                            string = commonParse.formatForSkills(unitsOut);
                                                            string = string.substr(0, string.length - 1) + ',\n' + jpUnitsWithSkillString + ',\n' + customUnitsWithSkillString + '\n}';
                                                            fs.writeFileSync('unitsWithSkill.json', string);
                                                        }
                                                    }
                                                });
                                            });
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});

function getJPUnitData(glUnitIds, callback) {
    fs.readFile('../../static/JP/units.json', function (err, content) {
        let jpUnits = JSON.parse(content);
        let jpUnitsString = Object.keys(jpUnits)
            .filter(unitId => !glUnitIds.includes(unitId))
            .map(unitId => '  "' + unitId + '":' + JSON.stringify(jpUnits[unitId]))
            .join(',\n');
        fs.readFile('../../static/JP/unitsWithPassives.json', function (err, content) {
            let jpUnitsWithPassive = JSON.parse(content);
            let jpUnitsWithPassiveString = Object.keys(jpUnitsWithPassive)
                .filter(unitId => !glUnitIds.includes(unitId))
                .map(unitId => '  "' + unitId + '":' + JSON.stringify(jpUnitsWithPassive[unitId]))
                .join(',\n');
            fs.readFile('../../static/JP/unitsWithSkill.json', function (err, content) {
                let jpUnitsWithSkill = JSON.parse(content);
                let jpUnitsWithSkillString = Object.keys(jpUnitsWithSkill)
                    .filter(unitId => !glUnitIds.includes(unitId))
                    .map(unitId => '  "' + unitId + '":' + JSON.stringify(jpUnitsWithSkill[unitId]))
                    .join(',\n');
                fs.readFile('../../static/JP/unitSearch.json', function (err, content) {
                    let jpUnitSearch = JSON.parse(content);
                    let jpUnitSearchString = jpUnitSearch
                        .filter(entry => !glUnitIds.includes(entry.id))
                        .map(entry => ' ' + JSON.stringify(entry))
                        .join(',\n');
                    
                    callback(jpUnitsString, jpUnitsWithPassiveString, jpUnitsWithSkillString, jpUnitSearchString);
                });
            });
        });
    });
}

function getCustomUnitData(callback) {
    fs.readFile('../../static/custom/GL/units.json', function (err, content) {
        let customUnits = JSON.parse(content);
        let customUnitsString = Object.keys(customUnits)
            .map(unitId => '  "' + unitId + '":' + JSON.stringify(customUnits[unitId]))
            .join(',\n');
        fs.readFile('../../static/custom/GL/unitsWithPassives.json', function (err, content) {
            let customUnitsWithPassive = JSON.parse(content);
            let customUnitsWithPassiveString = Object.keys(customUnitsWithPassive)
                .map(unitId => '  "' + unitId + '":' + JSON.stringify(customUnitsWithPassive[unitId]))
                .join(',\n');
            fs.readFile('../../static/custom/GL/unitsWithSkill.json', function (err, content) {
                let customUnitsWithSkill = JSON.parse(content);
                let customUnitsWithSkillString = Object.keys(customUnitsWithSkill)
                    .map(unitId => '  "' + unitId + '":' + JSON.stringify(customUnitsWithSkill[unitId]))
                    .join(',\n');
                fs.readFile('../../static/custom/GL/unitSearch.json', function (err, content) {
                    let customUnitSearch = JSON.parse(content);
                    let customUnitSearchString = customUnitSearch
                        .map(entry => ' ' + JSON.stringify(entry))
                        .join(',\n');
                    
                    callback(customUnitsString, customUnitsWithPassiveString, customUnitsWithSkillString, customUnitSearchString);
                });
            });
        });
    });
}

function treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, jpUnits, latentSkillsByUnitId, maxRarity = unitIn["rarity_max"] ) {
    var unit = {};
    unit.data = {};
    
    var data = unit.data;
    var unitData;
    
    var unitStats = {"minStats":{}, "maxStats":{}, "pots":{}};
    
    var unreleased7Star = false;
    
    if (jpUnits && unitIn["rarity_max"] == 6 && unitIn.skills && unitIn.skills[unitIn.skills.length - 1].rarity == 7) {
        var maxRarityInGLData = 0;
        for (entryId in unitIn.entries) {
            if (unitIn.entries[entryId].rarity > maxRarityInGLData) {
                maxRarityInGLData = unitIn.entries[entryId].rarity;
            }
        }
        if (maxRarityInGLData == 6) {
            var jpUnitIn = jpUnits[unitId];
            if (jpUnitIn) {
                for (entryId in jpUnitIn.entries) {
                    if (jpUnitIn.entries[entryId].rarity == 7) {
                        unitData = jpUnitIn.entries[entryId];
                    }
                }
                if (unitData) {
                    unreleased7Star = true;
                    maxRarity = 7;
                    data.unreleased7Star = true;
                }
            }
        }
    }
    
    if (!unitData) {
        for (entryId in unitIn.entries) {
            if (unitIn.entries[entryId].rarity == maxRarity) {
                unitData = unitIn.entries[entryId];
                break;
            }
        }
    }
    
    if (!unitData) {
        console.log(unitData);
    }
    
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
    
    data["name"] = unitIn.names[languageId];
    if (!data.name) {
        data.name = jpNameById[unitId];
    }
    if (!data.name) {
        data.name = unitIn.name;
    }
    if (languageId != 0) {
        data.wikiEntry = unitIn.name.replace(' ', '_');
    }
    data["max_rarity"] = unitIn["rarity_max"];
    if (unreleased7Star) {
        data["max_rarity"] = 7;
    }
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
    
    data.skills = commonParse.getPassives(unitId, unitIn.skills, skills, lbs, enhancementsByUnitId[unitId], maxRarity, unitData, data, latentSkillsByUnitId);
    
    if (!dev && languageId == 0 && jpUnits) {
        verifyImage(unitId, data["min_rarity"], data["max_rarity"]);
    }
    
    if (maxRarity == 7) {
        data["6_form"] = treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, null, latentSkillsByUnitId, 6).data;
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
