import fs from 'fs';
import path from 'path';
const __dirname = process.cwd();


// Async function to read the file then parse the JSON
async function readData(filename) {
    // read the file
    const data = await fs.promises.readFile(path.join(__dirname, filename), 'utf8');

    // parse the file
    const parsedData = JSON.parse(data);
    // return the parsed data
    return parsedData;
}

let foundData = {
    female: 0,
    male: 0,
    unknown: 0
}

let males = [];
let females = [];
let others = [];

readData('sources/units.json')
    .then(data => {
        Object.keys(data).forEach(key => {
            // check data[key].sex and count each sex found in foundData
            if (data[key]?.sex && data[key].sex.includes("Female") && data[key].rarity_min === 7) {
                foundData["female"] += 1;
                females.push(data[key].name);
            } else if (data[key]?.sex && data[key].sex.includes("Male") && data[key].rarity_min === 7) {
                foundData["male"] += 1;
                males.push(data[key].name);
            } else {
                if (data[key].rarity_min === 7) {
                    foundData["unknown"] += 1;
                    others.push(data[key].name);
                }
            }
        })

        // output the foundData to console
        console.log(foundData);
    })

