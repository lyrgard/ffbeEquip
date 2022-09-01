import fs from 'fs';
import request from 'request';

let dev = true;

const manualOverrides= {
    "11011": "FFRK",
    "20032": "Fullmetal Alchemist",
}   

//Get the latest game file from aEngimatic
function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/' + filename, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(filename + " downloaded");
                var result = JSON.parse(body);
                fs.writeFileSync('./GL/sources/' + filename, body);
                callback(result);
            } else {
                console.log(error);
            }
        });
    } else {
        fs.readFile('../static/GL/' + filename, function (err, content) {
            if (err) {
                console.log(err)
            }
            var result = JSON.parse(content);
            callback(result);
        });
    }
}

console.log("Starting to collect series...")
let currentlyFoundSeries = {}
getData('units.json', function (units) {
    Object.keys(units).forEach((unitId) => {
        if (units[unitId].game_id && !currentlyFoundSeries.hasOwnProperty(units[unitId].game_id)) {
            let gameName = units[unitId].game ? units[unitId].game : "Other";
            if (gameName.toString().toLowerCase() === "other" || gameName === "null"){
                Object.keys(manualOverrides).forEach((game) => {
                    if (manualOverrides[game].includes(unitId)){
                        gameName = [game].toString()
                    }else{
                        gameName = "Other"
                    }
                })
            }
            currentlyFoundSeries[units[unitId].game_id] = gameName;
        }
    })
    console.log(currentlyFoundSeries)
    writeToFile(currentlyFoundSeries)
});

function writeToFile(currentlyFoundSeries) {
    fs.writeFileSync("series.json", JSON.stringify(currentlyFoundSeries, null, '\t'))
}


