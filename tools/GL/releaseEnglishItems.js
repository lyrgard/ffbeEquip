import fs from 'fs';

console.log("Starting");
fs.readFile('../../static/GL/data.json', function (err, content) {
    var result = JSON.parse(content);
    
    Object.keys(result).forEach((item, value) => {
        let currentName = result[item].name
        let english = checkForJapanese(currentName.toString())

        if (english === true) {
            result[item].access.forEach((accessType)=> {
                if (accessType === 'not released yet'){
                    console.log("Found English unreleased: " + currentName)
                    if (currentName.includes('Dark')){
                        result[item].access = ['darkVisions']
                    } else if (currentName.includes('Coeurl Whip') || 
                               currentName.includes('Bunny Mask') || 
                               currentName.includes('Summer Cap') ||
                               currentName.includes("Physalis's Swimsuit") ||
                               currentName.includes("Moog Beach Ball") ||
                               currentName.includes("Little Mermaid's Hairband")){
                        result[item].access = ['event']
                    } else if (currentName.includes('Fixed Dice')) {
                        result[item].access = ['TMR-4*']
                    } else {
                        result[item].access = ['released']
                    }
                }
            })
        }
    });

    fs.writeFile('../../static/GL/data.json', JSON.stringify(result), (err) => {
        console.log(err)
    })
});

function checkForJapanese(checkString){
    let asciiChars = new RegExp('[^\x00-\x7F]+')

    return /^[\x00-\x7F]*$/.test(checkString)
}