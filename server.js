var express = require('express');
const bodyParser = require('body-parser');
var fs = require('fs');
var jv = require('json-validation');
var app = express();


app.use(bodyParser.json());

app.post('/items/temp', function(req, res) {
    var result = (new jv.JSONValidation()).validate(req.body, schema);
    if (result.ok) {
        var tempItems = [];
        if (fs.existsSync('tempData.json')) {
            tempItems = JSON.parse(fs.readFileSync('tempData.json', 'utf8'));    
        }
        tempItems = tempItems.concat(req.body);
        
        fs.writeFileSync('tempData.json', JSON.stringify(tempItems).replace(/\},\{/g, '},\n\t{').replace(/^\[/g, '[\n\t').replace(/\]$/g, '\n]'));
        res.status(201).send();
    } else {
        res.status(400).send("JSON has the following errors: " + result.errors.join(", ") + " at path " + result.path);
    }
});

app.use(express.static(__dirname)); //where your static content is located in your filesystem);
app.listen(3000); //the port you want to use

function checkItems(items) {
    if (items instanceof Array) {
        if (items.length > 10) {
            return false;
        }
        for (var index in items) {
            if (!checkItem(items[index])) {
                return false;
            }
            return true;
        }
    }
    return false;
}

var schemaPercent = { 
    "type": "object",
    "properties": {
        "name"  : {"type": "string", "required": true, "maxLength": 50 },
        "percent"  : {"type": "number", "required": true}
    }
};

var schema = {
    "type": "array",
    "maxItems": 20,
    "items": { 
        "type": "object",
        "properties": {
            "name"  : {"type": "string", "required": true, "maxLength": 50 },
            "type"  : {"type": "string", "required": true, "maxLength": 50 },
            "hp"    : {"type": "number"},
            "hp%"   : {"type": "number"},
            "mp"    : {"type": "number"},
            "mp%"   : {"type": "number"},
            "atk"   : {"type": "number"},
            "atk%"  : {"type": "number"},
            "def"   : {"type": "number"},
            "def%"  : {"type": "number"},
            "mag"   : {"type": "number"},
            "mag%"  : {"type": "number"},
            "spr"   : {"type": "number"},
            "spr%"  : {"type": "number"},
            "evade" : {"type": "number"},
            "element" : {"type": "string", "enum": ['fire','ice','lightning','water','earth','wind','light','dark']},
            "resist"  : {
                "type": "array",
                "maxItems": 16,
                "items": schemaPercent
            },
            "ailments"  : {
                "type": "array",
                "maxItems": 8,
                "items": schemaPercent
            },
            "killers"  : {
                "type": "array",
                "maxItems": 12,
                "items": schemaPercent
            },
            "special" : {
                "type": "array", 
                "maxItems": 10, 
                "items": {"type": "string","maxLength": 200}
            },
            "tmrUnit": {"type":"string", "maxLength": 50},
            "exclusiveSex" : {"type": "string", "enum": ["male", "female"]},
            "exclusiveUnits": {
                "type": "array", 
                "maxItems": 10, 
                "items": {"type": "string","maxLength": 50}
            },
            "condition": {"type": "string","maxLength": 200},
            "access": {
                "type": "array", 
                "maxItems": 10, 
                "items": {"type": "string","maxLength": 50}
            }
        }
    }
}