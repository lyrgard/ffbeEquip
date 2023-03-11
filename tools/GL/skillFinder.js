// import data.json in this direcdtory using fs
import fs from 'fs';
import path from 'path';

// define dirname
const __dirname = path.resolve();

// wait for the data.json to be read and parsed
// create a function that will wait for the data.json to be read and parsed and then do something with it
async function readData(filename) {
    // read the file
    const data = await fs.promises.readFile(path.join(__dirname, filename), 'utf8');

    // parse the file
    const parsedData = JSON.parse(data);
    // return the parsed data
    return parsedData;
}

// create an array to store the skills
let skills = [];

// create an array for autoCastedSkills
let autoCastedSkills = [];

// create an array for specialSkills
let specialSkills = [];

// get the data THEN loop through it
readData('data.json').then(data => {
    // loop through the data and find skills with the attribute "skills"
    data.forEach(skill => {
        // if the skill has the attribute "skills"
        if (skill.skills) {
            // add the skill to the skills array
            skills.push(skill);
        }

        if (skill.autoCastedSkills) {
            autoCastedSkills.push(skill);
        }

        if (skill.special) {
            // loop through the skill.special array
            skill.special.forEach(specialSkill => {
                // if the specialSkill has "at the start of a battle or when revived" in it
                if (specialSkill.includes('at the start of a battle or when revived')) {
                    // look for a number in a parathesis in the specialSkill string
                    let specialSkillId = specialSkill.match(/\(([^)]+)\)/)[1];
                    
                    // get the data from readData(./sources/skills_passive.json) and then loop through it
                    readData('./sources/skills_ability.json').then(data => {
                        // loop through the data Object keys
                        Object.keys(data).forEach(key => {
                            // if the key is the same as the specialSkillId
                            if (key === specialSkillId) {
                                // add the skill to the specialSkills array
                                specialSkills.push({
                                    name: skill.name,
                                    special: data[key]
                                });
                            }
                        });
                    }).then(() => {
                        //the write the specialSkills to a file called foundSpecialSkills.json
                        fs.writeFile(path.join(__dirname, 'foundSpecialSkills.json'), JSON.stringify(specialSkills), err => {
                            // if there is an error
                            if (err) {
                                // log the error
                                console.log(err);
                            }
                        });
                    });
                }
            });
        }
    })
    // then write the skills to a file called foundSkills.json
    fs.writeFile(path.join(__dirname, 'foundSkills.json'), JSON.stringify(skills), err => {
        // if there is an error
        if (err) {
            // log the error
            console.log(err);
        }
    });

    // then write the autoCastedSkills to a file called foundAutoCastedSkills.json
    fs.writeFile(path.join(__dirname, 'foundAutoCastedSkills.json'), JSON.stringify(autoCastedSkills), err => {
        // if there is an error
        if (err) {
            // log the error
            console.log(err);
        }
    });

    // loop through the skills again and for reach skill object in the skills array with a desc attribute
    skills.forEach(skill => {
        // loop through the skill.skills array
        skill.skills.forEach(skillInArray => {
            // if the skill has an effects array
            if (skillInArray.effects) {
                // loop through each effect and print the skill name and the effect desc
                skillInArray.effects.forEach(effect => {
                    // print the skill name and the effect desc
                    //console.log(`${skill.name}: ${effect.desc}`);
                });
            }
        });
    });

    // loop through the autoCastedSkills again and for reach skill object in the autoCastedSkills array with a desc attribute
    autoCastedSkills.forEach(skill => {
        // loop through the skill.skills array
        skill.autoCastedSkills.forEach(skillInArray => {
            // if the skill has an effects array
            if (skillInArray.effects) {
                // loop through each effect and print the skill name and the effect desc
                skillInArray.effects.forEach(effect => {
                    // print the skill name and the effect desc
                    // append the skill name and the effect desc to a file called foundAutoCastedSkills.txt with a new line after each skill
                    fs.appendFile(path.join(__dirname, 'foundAutoCastedSkills.txt'), `${skill.name}: ${effect.desc}\n`, err => {
                        // if there is an error
                        if (err) {
                            // log the error
                            console.log(err);
                        }
                    });
                });
            }
        });
    });

    // loop through the specialSkills again and for reach skill object in the specialSkills array with a desc attribute
    specialSkills.forEach(skill => {
        // write the skill to the foundSpecialSkills.txt file
        fs.appendFile(path.join(__dirname, 'foundSpecialSkills.txt'), `${skill.name}: ${skill.special.desc}\n`, err => {
            // if there is an error
            if (err) {
                // log the error
                console.log(err);
            }
        });
    });
});


