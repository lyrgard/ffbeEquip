const express = require('express');
const firebase = require('../lib/firebase.js');
const Joi = require('joi');
const uuidV1 = require('uuid/v1');

const route = express.Router();

const idSchema = Joi.string().regex(/^[0-9]{9}$/, 'id');
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
const partyBuildSchema = Joi.object().keys({
    "units":Joi.array().items(Joi.object().keys({
        "id": idSchema.required(),
        "rarity": Joi.number().min(1).max(7),
        "goal": Joi.string().length(200).required(),
        "innateElements": Joi.array().items(elementsSchema),
        "items": Joi.array().items(idSchema).length(10),
        "esperId": idSchema,
        "pots": Joi.array().items(Joi.object().keys({
            "name": statsSchema,
            "value": Joi.number().min(0).max(99)
        })),
        "buffs": Joi.array().items(Joi.object().keys({
            "name": statsSchema.concat(Joi.string().valid('lbFillRate')),
            "value": Joi.number().min(0).max(600)
        })),
        "lbShardsPerTurn": Joi.number().min(0).max(100),
        "mitigation": Joi.object().keys({
            "global": Joi.number().min(0).max(100),
            "physical": Joi.number().min(0).max(100),
            "magical": Joi.number().min(0).max(100)
        })
        
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
        "elementalResist": Joi.array().items(
            Joi.object().keys({
                "name":elementsSchema,
                "value": Joi.number().integer().required()
            })
        ),
        "def": Joi.number().integer(),
        "spr": Joi.number().integer(),
    }),
    "itemSector": Joi.object().keys({
        "mainSelector":[Joi.string().valid("all"),Joi.string().valid("owned"), Joi.string().valid("ownedAvailableForExpedition"), Joi.string().valid("shopRecipe")],
        "additionalFilters": Joi.array().items([
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

route.post('/:server/partyBuild', async (req, res) => {
  const { server } = req.params;
  const data = req.body;

  const { error, value } = Joi.validate(data, partyBuildSchema);

    console.log("TOTO");
    console.log(error);
  if (error) {
    return res.status(400).json({"id" : error});
  } else {
    return res.status(200).json(value);    
  }
  /*var fileName = uuidV1();
  var file = firebase.file("PartyBuilds/" + fileName); 
  await file.save(JSON.stringify(data), {"contentType":"application/json"});*/

  
});

module.exports = route;
