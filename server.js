const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sessions = require('client-sessions');

const jv = require('json-validation');

const config = require('./config.js');
const drive = require('./server/routes/drive.js');
const links = require('./server/routes/links.js');
const oauth = require('./server/routes/oauth.js');
const errorHandler = require('./server/middlewares/boom.js');
const authRequired = require('./server/middlewares/oauth.js');

const app = express();
app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, '/static/')));
if (config.isDev) {
  app.use(morgan('dev'));
}
app.use(sessions({
  cookieName: 'OAuthSession',
  secret: config.secret,
}));
app.use(bodyParser.json());

app.use('/', oauth);
app.use('/links', links);
app.use('/', authRequired, drive);

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

app.use(errorHandler);

if (module === require.main) {
  const server = app.listen(config.port, () => {
    console.log(`App server running at http://localhost:${config.port}`);
  });
}

module.exports = app;
