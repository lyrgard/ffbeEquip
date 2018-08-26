const fs = require('fs');
const express = require('express');
const Ajv = require('ajv');

const route = express.Router();

route.post('/:server/corrections', async (req, res) => {
    var ajv = new Ajv({allErrors: true, jsonPointers: true});

    var inputData = req.body;

    // Validate server param from URL
    if (req.params.server !== 'JP' && req.params.server !== 'GL') {
        res.status(400).send({error: "Unknown server"});
        return;
    }

    // Validate JSON data
    var valid = ajv.validate(schemaData, inputData);
    if (!valid) {
        res.status(400).send({error: ajv.errorsText(ajv.errors)});
        return;
    }
    
    // Retrieve existing file content
    var fileName = 'static/' + req.params.server + '/corrections.json';
    fs.exists(fileName, function (fileExists) {
        fs.readFile(fileName, 'utf8', function (err, fileContent) {
            var tempItems = {};
            if (err && fileExists) {
                res.status(500).send({error: "Could not read file on the server"});
                return;
            } else if (!err) {
                try {
                    tempItems = JSON.parse(fileContent);
                }
                catch(e) {
                    res.status(500).send({error: "Error while reading the file on the server: " + e});
                    return;
                }
            }

            // Set data
            var modifiedItems = 0;
            for (var key in inputData) {
                tempItems[key] = inputData[key];
                modifiedItems++;
            }

            // Check resulting length
            if (Object.keys(tempItems).length > 2000) {
                res.status(500).send({error: "The file is too big on the server"});
            } else {
                fs.writeFile(fileName, JSON.stringify(tempItems, null, '    '), 'utf8', function (err) {
                    if (err) {
                        res.status(500).send({error: "Failed to save file to the server"});
                    } else {
                        // Send back counters
                        res.status(201).send({
                            modified: modifiedItems,
                            total: Object.keys(tempItems).length
                        });
                    }
                });
            }
        });
    });
});

/* 
 * Schema for JSON input
 * 
 * Exemple of a valid input:
 *  {
 *      "301002200": {
 *          "access": ["event", "recipe", "trial"]
 *      },
 *      "301003000": {
 *          "access": ["event"],
 *          "maxNumber": 10
 *      },
 *      "302001200": {
 *          "access": ["quest", "recipe-chest"]
 *      }
 *  }
 * 
 * Use https://www.jsonschemavalidator.net/ to verify/check schema
 *
 */
var schemaData = {
	"$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "minProperties": 1,
    "maxProperties": 10,
    "patternProperties": {
        "^\\d+$" : {
            "type": "object",
            "properties": {
              	"maxNumber" : {
                  "type": "number",
                  "multipleOf": 1.0,
                  "minimum": 1,
                },
                "access" : {
                    "type": "array",
                    "maxItems": 6,
                    "uniqueItems": true,
                    "items": {
                        "type": "string", 
                        "enum": [
                            "shop","chest","quest","trial","chocobo","event","colosseum","key",
                            "TMR-1*","TMR-2*","TMR-3*","TMR-4*","TMR-5*","recipe","recipe-shop",
                            "recipe-chest","recipe-quest","recipe-event","recipe-colosseum","recipe-key",
                            "trophy","recipe-trophy","premium","STMR","not released yet"
                        ]
                    }
                },
            },
            "required": ["access"],
            "additionalProperties": false
        },
    },
    "additionalProperties": false
}

module.exports = route;
