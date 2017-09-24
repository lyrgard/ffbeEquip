'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var jv = require('json-validation');
var google = require('googleapis');
var app = express();
let driveConfig = require('drive-config');
var inventoryFile = null;


if (process.argv.length > 2) {
    inventoryFile = process.argv[2];
    console.log("using " + process.argv[2] + " as inventory source");
}

app.use(cookieParser());
app.use(bodyParser.json());

app.post('/items/temp', function(req, res) {
    var result = (new jv.JSONValidation()).validate(req.body, schemaData);
    if (result.ok) {
        var items = sanitize(req.body);
        var tempItems = [];
        if (fs.existsSync('static/tempData.json')) {
            tempItems = JSON.parse(fs.readFileSync('static/tempData.json', 'utf8'));    
        }
        tempItems = tempItems.concat(items);
        if (tempItems.length > 2000) {
            res.status(500).send();
        } else {
            fs.writeFileSync('static/tempData.json', JSON.stringify(tempItems).replace(/\},\{/g, '},\n\t{').replace(/^\[/g, '[\n\t').replace(/\]$/g, '\n]'));
            res.status(201).send();
        }
    } else {
        res.status(400).send("JSON has the following errors: " + result.errors.join(", ") + " at path " + result.path);
    }
});

app.get('/googleOAuthUrl', function(req, res) {
    var url = getOAuthUrl();
    res.status(200).json({"url": url});
});

app.get('/googleOAuthSuccess', function(req, res) {
    var googleOAuthAccessToken = req.query.code;
    var oauth2Client = new OAuth2(
        googleOAuthCredential.web.client_id,
        googleOAuthCredential.web.client_secret,
        googleOAuthCredential.web.redirect_uris[0]
    );
    oauth2Client.getToken(googleOAuthAccessToken, function(err, tokens) {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        if(!err) {
            res.cookie('googleOAuthAccessToken', JSON.stringify(tokens));
            res.status(303).location('http://ffbeEquip.lyrgard.fr').send();
        } else {
            console.log(err);
            res.status(500).send(err);
        }
    }); 
});

app.put("/itemInventory", function(req, res) {
    var googleOAuthAccessToken = req.cookies['googleOAuthAccessToken'];
    if (!googleOAuthAccessToken) {
        res.status(401).send();
        return;
    } else {
        googleOAuthAccessToken = JSON.parse(googleOAuthAccessToken);
    }
    var data = req.body;

    console.log("Saving inventory : ");
    console.log(data);
    
    var oauth2Client = new OAuth2(
        googleOAuthCredential.web.client_id,
        googleOAuthCredential.web.client_secret,
        googleOAuthCredential.web.redirect_uris[0]
    );
    oauth2Client.setCredentials(googleOAuthAccessToken);
    let driveConfigClient = new driveConfig(oauth2Client);
    driveConfigClient.getByName("itemInventory.json").then(files => {
        if (files.length > 0) {
            driveConfigClient.update(files[0].id, JSON.stringify(data)).then(file => {
                console.log(file);
                res.status(200).json(file);
            }).catch(err => {
                console.log(err);
                res.status(500).send(err);
            });
        } else {
            driveConfigClient.create("itemInventory.json", JSON.stringify(data)).then(file => {
                console.log(file);
                res.send();
            }).catch(err => {
                console.log(err);
                res.status(500).send(err);
            });
        }
    }).catch(err => {
        console.log(err);
        res.status(500);
    });   
});

app.get("/itemInventory", function(req, res) {
    if (inventoryFile == null) {
        var googleOAuthAccessToken = req.cookies['googleOAuthAccessToken'];
        if (!googleOAuthAccessToken) {
            res.status(401).send();
            return;
        } else {
            googleOAuthAccessToken = JSON.parse(googleOAuthAccessToken);
        }

        var oauth2Client = new OAuth2(
            googleOAuthCredential.web.client_id,
            googleOAuthCredential.web.client_secret,
            googleOAuthCredential.web.redirect_uris[0]
        );
        oauth2Client.setCredentials(googleOAuthAccessToken);
        let driveConfigClient = new driveConfig(oauth2Client);
        driveConfigClient.getByName("itemInventory.json").then(files => {
            if (files.length > 0) {
                console.log(files);
                if (files[0].data.constructor === Array) {
                    console.log("Old array inventory, transformed into object")
                    res.status(200).json({});
                } else {
                    res.status(200).json(files[0].data);
                }
            } else {
                console.log("new Inventory sent");
                res.status(200).json({});
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send(err);
        });
    } else {
        res.status(200).json(JSON.parse(fs.readFileSync(inventoryFile, 'utf8')));
    }
});

app.use(express.static(__dirname + '/static/')); //where your static content is located in your filesystem);
app.listen(3000); //the port you want to use

var OAuth2 = google.auth.OAuth2;
var googleOAuthCredential;

var scopes = [
    'https://www.googleapis.com/auth/drive.appfolder'
];
var fileMetadata = {
  'name': 'itemInventory.json',
  'parents': [ 'appDataFolder']
};

fs.readFile('googleOAuth/client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    
    googleOAuthCredential = JSON.parse(content);
});

function getOAuthUrl() {
    var oauth2Client = new OAuth2(
        googleOAuthCredential.web.client_id,
        googleOAuthCredential.web.client_secret,
        googleOAuthCredential.web.redirect_uris[0]
    );
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        // Optional property that passes state parameters to redirect URI
        // state: { foo: 'bar' }
    });
}


var safeValues = ["type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evade","element","resist","ailments","killers","exclusiveSex","dualWield","equipedConditions","server"];

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
            "dualWield":{"type": "string","maxLength": 30},
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