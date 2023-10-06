import fs, { write } from 'fs';

let searchTerms = [
    "Seal of ",
    "HP/SPR +20%",
    "HP/DEF +20%",
    "HP +40%",
    "ATK +40%",
    "MP +40%",
    "High Tide",
    "Projectile Prowess"
];

let blackList = [
    100065
]

let foundSkills = {};

try {
    // Read the file content
    let data = fs.readFileSync('./sources/skills.json', 'utf8');
    
    // Parse the data into a JSON object
    let skills = JSON.parse(data);

    // Loop through the skills
   // Loop through the skills
    Object.keys(skills).forEach(function (key) {
        const skill = skills[key];
        
        // Loop through the search terms
        for (let term of searchTerms) {
            // Check if the skill name contains the search term
            if (skill.name.includes(term) && !blackList.includes(skill.id)) {
                // Define subterm
                let subterm = "Lv.";
                
                // Check the conditions for "Seal of " and subterm
                if (term === "Seal of " && !skill.name.includes(subterm)) {
                    continue; // Skip to the next iteration
                }

                if (term == "High Tide") {
                    // the only acceptable other alternative to High Tide is High Tide+ but should also allow just High Tide
                    if (skill.name.includes("High Tide+") || skill.name == "High Tide") {
                        // do nothing
                    } else {
                        continue;
                    }
                }

                // Define effect string
                let effectString = skill.effects[0];
                if (effectString.includes("Increase ")) {
                    // Remove "Increase " from the effect string
                    effectString = effectString.replace("Increase ", "");
                }

                // if the effectString contains ( or ) then remove them.
                if (effectString.includes("(") || effectString.includes(")")) {
                    effectString = effectString.replace("(", "");
                    effectString = effectString.replace(")", "");
                }

                // if the effect String contains a space then and and then another space, remove all of that from the string
                if (effectString.includes(" and ")) {
                    effectString = effectString.replace(" and ", "/");
                }

                let rawEffect = skill?.effects_raw[0];
                let enchant = {};

                // + X % to a stat
                if ((rawEffect[0] == 0 || rawEffect[0] == '') && (rawEffect[1] == 3 || rawEffect[1] == '') && rawEffect[2] == 1) {
                    var effectData = rawEffect[3]
                    addStat(enchant, "hp%", effectData[4]);
                    addStat(enchant, "mp%", effectData[5]);
                    addStat(enchant, "atk%", effectData[0]);
                    addStat(enchant, "def%", effectData[1]);
                    addStat(enchant, "mag%", effectData[2]);
                    addStat(enchant, "spr%", effectData[3]);

                    // + static X to a stat
                } else if (rawEffect[2] == 89) {
                    var effectData = rawEffect[3];
                    if (!enchant.staticStats) enchant.staticStats = {};
                    addStat(enchant.staticStats, "hp", effectData[4]);
                    addStat(enchant.staticStats, "mp", effectData[5]);
                    addStat(enchant.staticStats, "atk", effectData[0]);
                    addStat(enchant.staticStats, "def", effectData[1]);
                    addStat(enchant.staticStats, "mag", effectData[2]);
                    addStat(enchant.staticStats, "spr", effectData[3]);

                    //lbFillRate
                } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 31) {
                var lbFillRate = rawEffect[3][0];
                addStat(enchant, "lbFillRate", lbFillRate);
                }

                let skillObject = {
                    "id": skill.id,
                    "name": skill.name,
                    "effects": effectString,
                    "enchant": enchant,
                }
                // loop over the foundSkills to make sure that there is no skills with the same ID OR name
                // if there is, then skip to the next iteration other wise add it to the foundSkills object
                let found = false;
                Object.keys(foundSkills).forEach(function (key) {
                    const foundSkill = foundSkills[key];
                    if (foundSkill.id == skillObject.id || foundSkill.name == skillObject.name) {
                        found = true;
                    } 
                });

                if (found) {
                    continue;
                } else {
                    foundSkills[skillObject.id] = skillObject;
                }
            }   
        }
    });

} catch (err) {
    // Handle any errors during the file read or JSON parse
    console.error(err);
}

writeToFileInOrder(foundSkills)


function addStat(enchant, stat, value) {
    if (value != 0) {
        if (!enchant[stat]) {
            enchant[stat] = 0;
        }
        enchant[stat] += value;
    }
}


function writeToFileInOrder(data) {
    // Creating a write stream to write the data to the file line by line
    const writeStream = fs.createWriteStream('./itemEnchants.json');
  
    // Writing the opening bracket for the JSON object
    writeStream.write('{\n');
  
    // Getting the keys of the data object and sorting them based on the name attribute of the individual objects
    const keys = Object.keys(data).sort((a, b) => data[a].name.localeCompare(data[b].name));
  
    // Iterating over the sorted keys and writing each key-value pair to the file
    keys.forEach((key, index) => {
      // Stringifying the key-value pair and appending a comma if it is not the last key
      const suffix = index === keys.length - 1 ? '\n' : ',\n';
      writeStream.write(`  "${key}": ${JSON.stringify(data[key], null, 2)}${suffix}`);
    });
  
    // Writing the closing bracket for the JSON object
    writeStream.write('}\n');
  
    // Closing the write stream
    writeStream.end();
  }
  