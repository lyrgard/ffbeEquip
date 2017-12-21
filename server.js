const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sessions = require('client-sessions');

const jv = require('json-validation');
const DriveConfig = require('drive-config');

const config = require('./server/config.js');
const links = require('./server/routes/links.js');
const oauth = require('./server/routes/oauth.js');
const authRequired = require('./server/middlewares/oauth.js');

const app = express();

let inventoryFile = null;
let unitsFile = null;

if (process.argv.length > 2) {
    if (process.argv[2] != "null") {
        inventoryFile = process.argv[2];
        console.log("using " + process.argv[2] + " as inventory source");
    }
}
if (process.argv.length > 3) {
    unitsFile = process.argv[3];
    console.log("using " + process.argv[3] + " as units source");
}

app.use(express.static(path.join(__dirname, '/static/')));
app.use(morgan('dev'));
app.use(sessions({
  cookieName: 'OAuthSession',
  secret: config.secret,
}));
app.use(bodyParser.json());

app.get('/googleOAuthUrl', oauth.authorize);
app.get('/googleOAuthSuccess', oauth.callback);
app.get('/googleOAuthLogout', oauth.logout);

app.get('/links/:shortId', links.get);
app.post('/links', links.insert);

const driveRouter = express.Router();
driveRouter.use(authRequired);

driveRouter.post('/:server/items/temp', function(req, res) {
    var result = (new jv.JSONValidation()).validate(req.body, schemaData);
    if (result.ok) {
        var fileName = 'static/' + req.params.server + '/tempData.json';
        var items = sanitize(req.body);
        var tempItems = [];
        if (fs.existsSync(fileName)) {
            tempItems = JSON.parse(fs.readFileSync(fileName, 'utf8'));
        }
        tempItems = tempItems.concat(items);
        if (tempItems.length > 2000) {
            res.status(500).send();
        } else {
            fs.writeFileSync(fileName, JSON.stringify(tempItems).replace(/\},\{/g, '},\n\t{').replace(/^\[/g, '[\n\t').replace(/\]$/g, '\n]'));
            res.status(201).send();
        }
    } else {
        res.status(400).send("JSON has the following errors: " + result.errors.join(", ") + " at path " + result.path);
    }
});

driveRouter.put("/:server/itemInventory", function(req, res) {
    saveFileToGoogleDrive(req, res, "itemInventory");
});

driveRouter.put("/:server/units", function(req, res) {
    saveFileToGoogleDrive(req, res, "units");
});

driveRouter.get("/:server/itemInventory", function(req, res) {
    if (inventoryFile == null) {
        getFileFromGoogleDrive(req, res, "itemInventory", function (result) {
            if (result) {
                if (result === Array) {
                    res.status(200).json({});
                } else {
                    if (req.params.server == "GL") {
                        result = migrateFromNameToId(result);
                    }
                }
                res.status(200).json(result);
            }
        });
    } else {
        res.status(200).json(JSON.parse(fs.readFileSync(inventoryFile, 'utf8')));
    }
});

driveRouter.get("/:server/units", function(req, res) {
    if (unitsFile == null) {
        getFileFromGoogleDrive(req, res, "units", function (result) {
            res.status(200).json(result);
        });
    } else {
        res.status(200).json(JSON.parse(fs.readFileSync(unitsFile, 'utf8')));
    }
});

function saveFileToGoogleDrive(req, res, paramFileName) {
    let driveConfigClient = getDriveConfigClient(req, res);
    if (!driveConfigClient) return;

    var data = req.body;
    data.version = 3;

    var fileName = paramFileName + "_" + req.params.server + ".json"
    driveConfigClient.getByName(fileName).then(files => {
        if (files.length > 0) {
            driveConfigClient.update(files[0].id, JSON.stringify(data)).then(file => {
                res.status(200).json(file);
            }).catch(err => {
                console.log(err);
                res.status(500).send(err);
            });
        } else {
            driveConfigClient.create(fileName, JSON.stringify(data)).then(file => {
                res.status(200).json(file);
            }).catch(err => {
                console.log(err);
                res.status(500).send(err);
            });
        }
    }).catch(err => {
        console.log(err);
        res.status(500);
    });
}

function getFileFromGoogleDrive(req, res, paramFileName, callback) {
    let driveConfigClient = getDriveConfigClient(req, res);
    if (!driveConfigClient) {
        return;
    }
    var fileName = paramFileName + "_" + req.params.server + ".json"
    driveConfigClient.getByName(fileName).then(files => {
        if (files.length > 0) {
            callback(files[0].data);
        } else {
            // Migration to GL/JP files.
            if (req.params.server == "GL") {
                driveConfigClient.getByName(paramFileName + ".json").then(files => {
                    if (files.length > 0) {
                        callback(files[0].data);
                    } else {
                        callback({});
                    }
                });
            } else {
                callback({});
            }
        }
    }).catch(err => {
        console.log(err);
        res.status(500).send(err);
    });
}

function getDriveConfigClient(req, res) {
  return new DriveConfig(req.OAuth2Client);
}

function migrateFromNameToId(itemInventory) {
    if (itemInventory && (!itemInventory.version || itemInventory.version < 2)) {
        var items = JSON.parse(fs.readFileSync('static/GL/data.json', 'utf8'));
        var itemIdByName = {};
        for (var index in items) {
            itemIdByName[items[index].name] = items[index].id;
        }
        itemIdByName["Blade Mastery"] = "504201670";
        itemIdByName["Zwill Crossblade"] = "1100000083";
        itemIdByName["Zwill Crossblade (FFT)"] = "301002000";
        itemIdByName["Imperial Helm (Item)"] = "404001100";
        itemIdByName["Defender (FFT)"] = "303002400";
        itemIdByName["Save the Queen"] = "303001400";
        var newItemInventory = {};
        for (var index in itemInventory) {
            if (itemIdByName[index]) {
                newItemInventory[itemIdByName[index]] = itemInventory[index];
            } else {
                newItemInventory[index] = itemInventory[index];
            }
        }
        return newItemInventory;
    } else if (itemInventory.version == 2 && itemInventory["303003500"]) {
        itemInventory["303001400"] = itemInventory["303003500"];
        delete itemInventory["303003500"];
    }
    return itemInventory;
}

var safeValues = ["type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evade","doubleHand","element","resist","ailments","killers","exclusiveSex","partialDualWield","equipedConditions","server"];

function sanitize(body) {
    var items = [];
    for (var i in body) {
        var item = {};
        item.name = escapeHtml(body[i].name);
        if (body[i].jpname) {
            item.jpname = escapeHtml(body[i].jpname);
        }
        for (var j in safeValues) {
            if (body[i][safeValues[j]]) {
                item[safeValues[j]] = body[i][safeValues[j]];
            }
        }
        if (body[i].special) {
            item.special = [];
            for (var k = 0; k < body[i].special.length; k++) {
                item.special.push(escapeHtml(body[i].special[k]));
            }
        }
        if (body[i].tmrUnit) {
            item.tmrUnit = escapeHtml(body[i].tmrUnit);
        }
        if (body[i].exclusiveUnits) {
            item.exclusiveUnits = [];
            for (var k = 0; k < body[i].exclusiveUnits.length; k++) {
                item.exclusiveUnits.push(escapeHtml(body[i].exclusiveUnits[k]));
            }
        }
        if (body[i].access) {
            item.access = [];
            for (var k = 0; k < body[i].access.length; k++) {
                item.access.push(escapeHtml(body[i].access[k]));
            }
        }
        item.userPseudo = escapeHtml(body[i].userPseudo);
        items.push(item);
    }
    return items;
}

var schemaPercent = {
    "type": "object",
    "properties": {
        "name"  : {"type": "string", "required": true, "enum": ['fire','ice','lightning','water','earth','wind','light','dark','poison','blind','sleep','silence','paralysis','confuse','disease','petrification','aquatic','beast','bird','bug','demon','dragon','human','machine','plant','undead','stone','spirit']},
        "percent"  : {"type": "number", "required": true}
    }
};

var schemaData = {
    "type": "array",
    "maxItems": 20,
    "items": {
        "type": "object",
        "properties": {
            "name"  : {"type": "string", "required": true, "maxLength": 50 },
            "jpname"  : {"type": "string", "maxLength": 50 },
            "type"  : {"type": "string", "required": true, "enum": ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "robe", "lightArmor", "heavyArmor", "accessory", "materia"] },
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
            "evade" : {
                "type": "object",
                "properties": {
                    "physical":{"type": "number"},
                    "magical":{"type": "number"},
                }
            },
            "element" : {
                "type": "array",
                "maxItems": 8,
                "items": {"type": "string", "enum": ['fire','ice','lightning','water','earth','wind','light','dark']}
            },
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
            "partialDualWield":{
                "type": "array",
                "maxItems": 15,
                "items":{"type": "string","enum": ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist"]}
            },
            "singleWieldingOneHanded":{
                "type": "object",
                "properties": {
                    "hp"    : {"type": "number"},
                    "mp"    : {"type": "number"},
                    "atk"   : {"type": "number"},
                    "def"   : {"type": "number"},
                    "mag"   : {"type": "number"},
                    "spr"   : {"type": "number"}
                }
            },
            "singleWielding":{
                "type": "object",
                "properties": {
                    "hp"    : {"type": "number"},
                    "mp"    : {"type": "number"},
                    "atk"   : {"type": "number"},
                    "def"   : {"type": "number"},
                    "mag"   : {"type": "number"},
                    "spr"   : {"type": "number"}
                }
            },
            "equipedConditions": {
                "type": "array",
                "maxItems": 3,
                "items": {"type": "string","enum": ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "robe", "lightArmor", "heavyArmor"]}
            },
            "access": {
                "type": "array",
                "maxItems": 10,
                "minItems": 1,
                "required": true,
                "items": {"type": "string","maxLength": 50}
            },
            "server": {"type": "string","enum": ["JP","GL"]},
            "userPseudo": {"type": "string", "required": true,"maxLength": 200}
        }
    }
}

var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml (string) {
  return String(string).replace(/[&<>"`=\/]/g, function (s) {
    return entityMap[s];
  });
}

app.use(driveRouter);

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

if (module === require.main) {
  const server = app.listen(config.port, () => {
    console.log(`App server running at http://localhost:${config.port}`);
  });
}

module.exports = app;
