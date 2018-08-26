const fs = require('fs');
const express = require('express');
const jv = require('json-validation');

const route = express.Router();

route.post('/:server/corrections', async (req, res) => {
    var validator = new jv.JSONValidation();
    var data = req.body;
    if (Object.keys(data).length > 10) {
        res.status(400).send({error: "Only a maximum of 10 corrections can be send at a time"});
        return;
    }
    for (var key in data) {
        if (isNaN(parseInt(key))) { 
            res.status(400).send({error: key + " is not valid as an item key"});
            return;
        }
        var result = validator.validate(data[key], schemaData);
        if (!result.ok) {
            res.status(400).send({error: "JSON has the following errors: " + result.errors.join(", ") + " at path " + result.path});
            return;
        }
    }
    
    var fileName = 'static/' + req.params.server + '/corrections.json';
    var tempItems = {};
    var modifiedItems = 0;
    if (fs.existsSync(fileName)) {
        tempItems = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    }
    for (var key in data) {
        tempItems[key] = data[key];
        modifiedItems++;
    }
    if (Object.keys(tempItems).length > 2000) {
        res.status(500).send({error: "The file is too big on the server"});
    } else {
        fs.writeFileSync(fileName, JSON.stringify(tempItems).replace(/\},\{/g, '},\n\t{').replace(/^\[/g, '[\n\t').replace(/\]$/g, '\n]'));
        res.status(201).send({
            modified: modifiedItems,
            total: Object.keys(tempItems).length
        });
    }
    
});

var schemaData = {
    "type": "object",
    "properties": {
        "access" : {
            "type": "array",
            "maxItems": 6,
            "required": true,
            "items": {"type": "string", "enum": ["shop","chest","quest","trial","chocobo","event","colosseum","key","TMR-1*","TMR-2*","TMR-3*","TMR-4*","TMR-5*","recipe","recipe-shop","recipe-chest","recipe-quest","recipe-event","recipe-colosseum","recipe-key","trophy","recipe-trophy","premium","STMR","not released yet"]}
        },
    }
}

module.exports = route;
