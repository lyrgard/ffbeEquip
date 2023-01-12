// parse the dataVersion.js and iterate it.
import fs from 'fs'

console.log("Starting...")
fs.readFile('../../static/GL/dataVersion.json', function(err, content) {
    var dataVersion = JSON.parse(content)
    iterateDataVersion(dataVersion)

    if(err) {
        console.log(err)
    }
})

function iterateDataVersion(dataVersion) {
    dataVersion.version = dataVersion.version + 1;
    console.log("Setting new dataVersion to: " + dataVersion.version)
    fs.writeFileSync('../../static/GL/dataVersion.json', JSON.stringify(dataVersion))
}