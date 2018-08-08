const express = require('express');
const firebase = require('../lib/firebase.js');
const drive = require('../lib/drive.js');
const Joi = require('joi');
const uuidV1 = require('uuid/v1');

const unAuthenticatedRoute = express.Router();
const authenticatedRoute = express.Router();

const idSchema = Joi.string().regex(/^([0-9]{9,10}$|dagger|sword|greatSword|katana|staff|rod|bow|axe|hammer|spear|harp|whip|throwing|gun|mace|fist|lightShield|heavyShield|hat|helm|clothes|lightArmor|heavyArmor|robe|accessory|materia|unavailable)$/, 'id');
const itemSlotSchema = {
    slot:Joi.number().min(0).max(9),
    id:idSchema,
    pinned:Joi.boolean()
};
const elementsSchema = [
    Joi.string().valid('fire'),
    Joi.string().valid('ice'),
    Joi.string().valid('lightning'),
    Joi.string().valid('water'),
    Joi.string().valid('earth'),
    Joi.string().valid('wind'),
    Joi.string().valid('light'),
    Joi.string().valid('dark')
];
const statsSchema = [
    Joi.string().valid('hp'),
    Joi.string().valid('mp'),
    Joi.string().valid('atk'),
    Joi.string().valid('def'),
    Joi.string().valid('mag'),
    Joi.string().valid('spr')
];

const itemEnchantmentsSchema =  [
    Joi.string().valid('rare'),
    Joi.string().valid('hp_15'),Joi.string().valid('hp_12'),Joi.string().valid('hp_10'),Joi.string().valid('hp_7'),Joi.string().valid('hp_5'),Joi.string().valid('hp_3'),Joi.string().valid('hp_1'),
    Joi.string().valid('mp_15'),Joi.string().valid('mp_12'),Joi.string().valid('mp_10'),Joi.string().valid('mp_7'),Joi.string().valid('mp_5'),Joi.string().valid('mp_3'),Joi.string().valid('mp_1'),
    Joi.string().valid('atk_15'),Joi.string().valid('atk_12'),Joi.string().valid('atk_10'),Joi.string().valid('atk_7'),Joi.string().valid('atk_5'),Joi.string().valid('atk_3'),Joi.string().valid('atk_1'),
    Joi.string().valid('def_15'),Joi.string().valid('def_12'),Joi.string().valid('def_10'),Joi.string().valid('def_7'),Joi.string().valid('def_5'),Joi.string().valid('def_3'),Joi.string().valid('def_1'),
    Joi.string().valid('mag_15'),Joi.string().valid('mag_12'),Joi.string().valid('mag_10'),Joi.string().valid('mag_7'),Joi.string().valid('mag_5'),Joi.string().valid('mag_3'),Joi.string().valid('mag_1'),
    Joi.string().valid('spr_15'),Joi.string().valid('spr_12'),Joi.string().valid('spr_10'),Joi.string().valid('spr_7'),Joi.string().valid('spr_5'),Joi.string().valid('spr_3'),Joi.string().valid('spr_1'),
    Joi.string().valid('autoRegen_4'),Joi.string().valid('autoRegen_3'),Joi.string().valid('autoRegen_2'),Joi.string().valid('autoRegen_1'),
    Joi.string().valid('autoRefresh_4'),Joi.string().valid('autoRefresh_3'),Joi.string().valid('autoRefresh_2'),Joi.string().valid('autoRefresh_1'),
    Joi.string().valid('autoProtect_5'),Joi.string().valid('autoProtect_4'),Joi.string().valid('autoProtect_3'),Joi.string().valid('autoProtect_2'),Joi.string().valid('autoProtect_1'),
    Joi.string().valid('autoShell_5'),Joi.string().valid('autoShell_4'),Joi.string().valid('autoShell_3'),Joi.string().valid('autoShell_2'),Joi.string().valid('autoShell_1')
];
const partyBuildSchema = Joi.object().keys({
    version: Joi.number().min(0),
    units: Joi.array().items(Joi.object().keys({
        id: idSchema.required(),
        rarity: Joi.number().min(1).max(7),
        enhancementLevels: Joi.array().items(Joi.number().min(0).max(2)).max(6),
        goal: Joi.string().max(200).required(),
        innateElements: Joi.array().items(elementsSchema),
        items: Joi.array().items(itemSlotSchema).max(10),
        itemEnchantments: Joi.array().items([Joi.allow(null), Joi.array().items(itemEnchantmentsSchema).max(3)]).max(10),
        esperId: Joi.string().max(50),
        esperPinned: Joi.boolean(),
        pots: Joi.object().keys({
            hp: Joi.number().min(0).max(1000),
            mp: Joi.number().min(0).max(1000),
            atk: Joi.number().min(0).max(99),
            def: Joi.number().min(0).max(99),
            mag: Joi.number().min(0).max(99),
            spr: Joi.number().min(0).max(99),
        }),
        buffs: Joi.object().keys({
            hp: Joi.number().min(0).max(600),
            mp: Joi.number().min(0).max(600),
            atk: Joi.number().min(0).max(600),
            def: Joi.number().min(0).max(600),
            mag: Joi.number().min(0).max(600),
            spr: Joi.number().min(0).max(600),
            lbFillRate: Joi.number().min(0).max(600)
        }),
        lbShardsPerTurn: Joi.number().min(0).max(100),
        mitigation: Joi.object().keys({
            global: Joi.number().min(0).max(100),
            physical: Joi.number().min(0).max(100),
            magical: Joi.number().min(0).max(100)
        }),
        level: Joi.number().min(0).max(120)
    })).required(),
    "monster":Joi.object().keys({
        "races": Joi.array().items(
            Joi.string().valid('aquatic'),
            Joi.string().valid('beast'),
            Joi.string().valid('bird'),
            Joi.string().valid('bug'),
            Joi.string().valid('demon'),
            Joi.string().valid('dragon'),
            Joi.string().valid('human'),
            Joi.string().valid('machine'),
            Joi.string().valid('plant'),
            Joi.string().valid('undead'),
            Joi.string().valid('stone'),
            Joi.string().valid('spirit')
        ),
        "elementalResist": Joi.object().keys({
            fire:Joi.number().integer(),
            ice:Joi.number().integer(),
            water:Joi.number().integer(),
            lightning:Joi.number().integer(),
            earth:Joi.number().integer(),
            wind:Joi.number().integer(),
            light:Joi.number().integer(),
            dark:Joi.number().integer()
        }),
        "def": Joi.number().integer(),
        "spr": Joi.number().integer(),
    }),
    "itemSelector": Joi.object().keys({
        "mainSelector":[Joi.string().valid("all"),Joi.string().valid("owned"), Joi.string().valid("ownedAvailableForExpedition"), Joi.string().valid("shopRecipe")],
        "additionalFilters": Joi.array().max(5).items([
            Joi.string().valid("includeEasilyObtainableItems"),
            Joi.string().valid("includeChocoboItems"),
            Joi.string().valid("includeTMROfOwnedUnits"),
            Joi.string().valid("includeTrialRewards"),
            Joi.string().valid("exludeEvent"),
            Joi.string().valid("excludePremium"),
            Joi.string().valid("excludeTMR5"),
            Joi.string().valid("excludeSTMR"),
            Joi.string().valid("excludeNotReleasedYet")
        ])
    })
});

unAuthenticatedRoute.post('/partyBuild', async (req, res) => { 
  const data = req.body;

    
  const { error, value } = Joi.validate(data, partyBuildSchema);

  var id = uuidV1();

  if (error) {
    console.log(error);
    return res.status(400).json(error);
  } else {
    var file = firebase.file("PartyBuilds/" + id + ".json"); 
    file.save(JSON.stringify(value), {"contentType":"application/json"}, function(err) {
        if (err) {
            return res.status(500).json(err);    
        } else {
            return res.status(200).json({"id":id});    
        }
    });
    
  }
});

authenticatedRoute.put('/:server/publicUnitCollection', async (req, res) => { 
  const { server } = req.params;
  const data = req.body;
  const auth = req.OAuth2Client;  
    
  let settings = await drive.readJson(auth, `settings_${server}.json`, {});
  var id;
  if (settings && settings.unitCollection) {
      id = settings.unitCollection;
  } else {
      id = uuidV1();
  }

  var file = firebase.file("UnitCollections/" + id + ".json"); 
  file.save(JSON.stringify(data), {"contentType":"application/json"}, async function(err) {
    if (err) {
      return res.status(500).json(err);    
    } else {
      if (!settings) {
          settings = {};
      }
      if (settings.unitCollection != id) {
          settings.unitCollection = id;
          await drive.writeJson(auth, `settings_${server}.json`, settings);
      }
      return res.status(200).json({"id":id});    
    }
  });
});

module.exports = {
    "unAuthenticatedRoute" : unAuthenticatedRoute,
    "authenticatedRoute" : authenticatedRoute
}
