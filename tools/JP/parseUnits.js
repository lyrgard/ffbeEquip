import fs from 'fs';
import request from 'request';
import PNG from 'pngjs';
import * as commonParse from '../commonParseUnit.js'
import { exit } from 'process';

let filterGame = [];
let filterUnits = ["199000101", "256000301"]

var enhancementsByUnitId = {};
var glNameById = {};
var dev = false;
var imgUrls;

function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-jp/master/' + filename, {"gzip": true}, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(filename + " downloaded");
                var result = JSON.parse(body);
                fs.writeFileSync('./sources/' + filename, body);
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
                        fs.readFile('units.json', function (err, nameDatacontent) {
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
                                    manageNV(units);
                                    for (var unitId in units) {
                                        var unitIn = units[unitId];
                                        if (!filterGame.includes(unitIn["game_id"]) && !unitId.startsWith("7") && !unitId.startsWith("8") && !unitId.startsWith("9") && unitIn.name &&!filterUnits.includes(unitId)) {
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

function manageNV(units) {
    const braveShiftUnitIdByBaseUnitId = [];
    const baseUnitIdByNVUnitId = {};
    for (var unitId in units) {
        const unitIn = units[unitId];
        if (unitIn.rarity_max == 7) {
            const baseUnitId = unitId.substring(0, unitId.length -1);
            let nvIds = Object.keys(unitIn.entries).filter(id => !id.startsWith(baseUnitId));
            
            nvIds.forEach(nvId => {
                unitIn.rarity_max = 'NV';
                unitIn.entries[nvId].rarity = 'NV';
                baseUnitIdByNVUnitId[nvId] = unitId;
                unitIn.nv_upgrade = unitIn.entries[nvId].nv_upgrade;
            });
            if (unitIn.rarity_min == 7) {
                unitIn.rarity_max = 'NV';
                unitIn.rarity_min = 'NV';
                Object.values(unitIn.entries).forEach(e => e.rarity = 'NV');
                //baseUnitIdByNVUnitId[nvIds[0]] = unitId;
                unitIn.nv_upgrade = Object.values(unitIn.entries)[0].nv_upgrade;
                if (unitId.endsWith('17') || unitId.endsWith('27') || unitId.endsWith('37')) {
                    const baseUnitCommonPart = unitId.substring(0, unitId.length - 2);
                    let potentialBaseUnits = Object.keys(units).filter(k => k.startsWith(baseUnitCommonPart) && k < unitId && (k.endsWith('3')||k.endsWith('4') || k.endsWith('5') || k.endsWith('7'))).sort();
                    if (potentialBaseUnits.length) {
                        baseUnitIdByNVUnitId[unitId] = potentialBaseUnits[0];
                        braveShiftUnitIdByBaseUnitId.push({baseUnitId: potentialBaseUnits[0], braveShiftedUnitId: unitId});
                        unitIn.base_id = potentialBaseUnits[0];
                    }
                }
            }
        }
    }
    braveShiftUnitIdByBaseUnitId.forEach(data => {
        let baseId = data.baseUnitId;
        if (!units[data.baseUnitId] && baseUnitIdByNVUnitId[data.baseUnitId]) {
            baseId = baseUnitIdByNVUnitId[data.baseUnitId];
        }
        units[baseId].braveShiftedUnitId = data.braveShiftedUnitId;
        units[data.braveShiftedUnitId].nv_upgrade = units[baseId].nv_upgrade;
    });
}


function treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, maxRarity = unitIn["rarity_max"]) {
    var unit = {};
    unit.data = {};
    
    var data = unit.data;
    var unitData;
    
    var unitStats = {"minStats":{}, "maxStats":{}, "pots":{}};

    for (let entryId in unitIn.entries) {
        if (unitIn.entries[entryId].rarity == maxRarity) {
            unitData = unitIn.entries[entryId];
            for (var statIndex in commonParse.stats) {
                var stat = commonParse.stats[statIndex];
                unitStats.minStats[stat.toLowerCase()] = unitData["stats"][stat][0];
                unitStats.maxStats[stat.toLowerCase()] = unitData["stats"][stat][1];
                unitStats.pots[stat.toLowerCase()] = unitData["stats"][stat][2];
            }

            if (unitIn.entries[entryId]["stat_pattern"]) {
                data["stats_pattern"] = unitIn.entries[entryId]["stat_pattern"];
            }
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

    var unitIdInEntries = Object.keys(unitIn.entries).find(key => unitIn.entries[key].rarity == maxRarity);

    data["roles"] = unitIn.entries[unitIdInEntries].roles.map(role => commonParse.unitRoles[role]);

    if (glNameById[unitId]) {
        data["name"] = glNameById[unitId];
        data["jpname"] = unitIn["name"];
    } else {
        data["name"] = unitIn["name"];    
    }

    data["max_rarity"] = maxRarity;
    data["min_rarity"] = unitIn["rarity_min"];

    data["stats"] = unitStats;
    data["sex"] = unitIn.sex.toLowerCase();
    data["equip"] = commonParse.getEquip(unitIn.equip); 
    data["id"] = unitId;
    
    data["enhancementSkills"] = [];
    for (let skillIndex in unitIn.skills) {
        if (unitIn.skills[skillIndex].rarity.startsWith && unitIn.skills[skillIndex].rarity.startsWith('NV+')) {
            unitIn.skills[skillIndex].exLevel = parseInt(unitIn.skills[skillIndex].rarity.substring(3,unitIn.skills[skillIndex].rarity.length));
            unitIn.skills[skillIndex].rarity = 'NV';
        }
    }

    data["enhancementSkills"] = [];
    for (let skillIndex in unitIn.skills) {
        if (unitIn.skills[skillIndex].rarity > unitIn.rarity_max) {
            continue; // don't take into account skills for a max rarity not yet released
        }
        var skillId = unitIn.skills[skillIndex].id.toString();
        if (enhancementsByUnitId[unitId] && enhancementsByUnitId[unitId][skillId]) {
            if (!skills[skillId]) console.log(unitIn.name, unitId);
            data["enhancementSkills"].push(skills[skillId].name);
        }
    }
    
    data.skills = commonParse.getPassives(unitId, unitIn.skills, skills, lbs, enhancementsByUnitId[unitId], maxRarity, unitData, data);

    if (unitIn.braveShiftedUnitId && maxRarity == 'NV') {
        data["braveShift"] = unitIn.braveShiftedUnitId;
    }
    if (unitIn.base_id != unitId) {
        data["braveShifted"] = unitIn.base_id;
    }
    //unitIn.nv_upgrade //isn't null or undefined
    if (maxRarity == 'NV' && unitIn.nv_upgrade != null && unitIn.nv_upgrade != undefined) {
        data.equip.push("visionCard");
        data.exAwakenings = [
            lowerCaseKeys(unitIn.nv_upgrade[0].stats),
            lowerCaseKeys(unitIn.nv_upgrade[1].stats),
            lowerCaseKeys(unitIn.nv_upgrade[2].stats),
        ]
        data.fragmentId = Object.keys(unitIn.nv_upgrade[0].materials).filter(id => unitIn.nv_upgrade[0].materials[id] % 25 === 0)[0];
    }
    
    data.skills = commonParse.getPassives(unitId, unitIn.skills, skills, lbs, enhancementsByUnitId[unitId], maxRarity, unitData, data);
    
    verifyImage(unitId, data["min_rarity"], data["max_rarity"]);
    
    if ((maxRarity == 7 || maxRarity == 'NV') && unitIn.rarity_min != 'NV') {
        data["6_form"] = treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, 6).data;
    }
    if (maxRarity == 'NV' && unitIn.rarity_min != 'NV') {
        data["7_form"] = treatUnit(unitId, unitIn, skills, lbs, enhancementsByUnitId, 7).data;
    }
    
    return unit;
}

function lowerCaseKeys(obj) {
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        delete obj[key];
        obj[key.toLowerCase()] = value;
    });
    return obj;
}

function assureArray(input) {
    if (Array.isArray(input)) {
        return input;
    } else {
        return [input];
    }
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
