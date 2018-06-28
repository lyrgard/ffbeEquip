const baseStats = ['hp','mp','atk','def','mag','spr'];
const filters = ["types","elements","ailments","killers","accessToRemove","additionalStat"];
const elementList = ['fire','ice','lightning','water','earth','wind','light','dark'];
const ailmentList = ['poison','blind','sleep','silence','paralysis','confuse','disease','petrification','death'];
const killerList = ['aquatic','beast','bird','bug','demon','dragon','human','machine','plant','undead','stone','spirit'];
const typeList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "lightArmor", "heavyArmor", "robe",  "accessory", "materia"];
const typeListWithEsper = typeList.concat(["esper"]);
const weaponList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist"];
const shieldList = ["lightShield", "heavyShield"];
const headList = ["hat", "helm"];
const bodyList = ["clothes", "robe", "lightArmor", "heavyArmor"];
const accessList = ["shop","chest","quest","trial","chocobo","event","colosseum","key","TMR-1*","TMR-2*","TMR-3*","TMR-4*","TMR-5*", "STMR","recipe-shop","recipe-chest","recipe-quest","recipe-event","recipe-colosseum","recipe-key","trophy","recipe-trophy","premium"];
const typeCategories = {"dagger":"Category:Daggers", "sword":"Category:Swords", "greatSword":"Category:Great_Swords", "katana":"Category:Katanas", "staff":"Category:", "rod":"Category:Rods", "bow":"Category:Bows", "axe":"Category:Axes", "hammer":"Category:Hammers", "spear":"Category:Spears", "harp":"Category:Harps", "whip":"Category:Whips", "throwing":"Category:Throwing_Weapons", "gun":"Category:Guns", "mace":"Category:Maces", "fist":"Category:Fists", "lightShield":"Category:Light_Shields", "heavyShield":"Category:Heavy_Shields", "hat":"Category:Hats", "helm":"Category:Helms", "clothes":"Category:Clothes", "lightArmor":"Category:Light_Armors", "heavyArmor":"Category:Heavy_Armors", "robe":"Category:Robes", "accessory":"Category:Accessories", "materia":"Ability_Materia"};
const percentValues = {
    "hp": "hp%",
    "mp": "mp%",
    "atk": "atk%",
    "def": "def%",
    "mag": "mag%",
    "spr": "spr%"
};
const goalValuesCaract = {
    "physicalDamage":                   {"statsToMaximize":["atk"], "type": "physical"},
    "magicalDamage":                    {"statsToMaximize":["mag"], "type": "magical"},
    "hybridDamage":                     {"statsToMaximize":["atk","mag"], "type": "physical"},
    "jumpDamage":                       {"statsToMaximize":["atk"], "type": "physical"},
    "magDamageWithPhysicalMecanism":    {"statsToMaximize":["mag"], "type": "physical"},
    "sprDamageWithPhysicalMecanism":    {"statsToMaximize":["spr"], "type": "physical"},
    "defDamageWithPhysicalMecanism":    {"statsToMaximize":["def"], "type": "physical"},
    "sprDamageWithMagicalMecanism":     {"statsToMaximize":["spr"], "type": "magical"},
    "atkDamageWithFixedMecanism":       {"statsToMaximize":["atk"], "type": "none"},
    "physicalDamageMultiCast":          {"statsToMaximize":["atk"], "type": "physical"},
    "fixedDamageWithPhysicalMecanism":  {"statsToMaximize":[], "type": "physical"},
    "summonerSkill":                    {"statsToMaximize":["mag","spr"], "type": "none"},
};
const itemEnhancementLabels = {
    "rare":{
        "dagger": "+100% LB fill rate", 
        "sword": "HP/ATK + 15%", 
        "greatSword": "HP/ATK + 15%", 
        "katana": "HP/ATK + 15%", 
        "staff": "SPR/MP + 15%", 
        "rod": "MAG/MP +15%", 
        "bow": "ATK/MAG +15%", 
        "axe": "ATK +30%", 
        "hammer": "HP/DEF +15%", 
        "spear": "HP/ATK +15%", 
        "harp": "HP/SPR +15%", 
        "whip": "MP +30%", 
        "throwing": "HP/MP +15%", 
        "gun": "ATK +30%", 
        "mace": "HP +30%", 
        "fist": "HP/ATK +15%"
    },
    "hp_15": "HP +15%", "hp_12": "HP +12%", "hp_10": "HP +10%", "hp_7": "HP +7%", "hp_5": "HP +5%", "hp_3": "HP +3%", "hp_1": "HP +1%",
    "mp_15": "MP +15%", "mp_12": "MP +12%", "mp_10": "MP +10%", "mp_7": "MP +7%", "mp_5": "MP +5%", "mp_3": "MP +3%", "mp_1": "MP +1%",
    "atk_15": "ATK +15%", "atk_12": "ATK +12%", "atk_10": "ATK +10%", "atk_7": "ATK +7%", "atk_5": "ATK +5%", "atk_3": "ATK +3%", "atk_1": "ATK +1%",
    "def_15": "DEF +15%", "def_12": "DEF +12%", "def_10": "DEF +10%", "def_7": "DEF +7%", "def_5": "DEF +5%", "def_3": "DEF +3%", "def_1": "DEF +1%",
    "mag_15": "MAG +15%", "mag_12": "MAG +12%", "mag_10": "MAG +10%", "mag_7": "MAG +7%", "mag_5": "MAG +5%", "mag_3": "MAG +3%", "mag_1": "MAG +1%",
    "spr_15": "SPR +15%", "spr_12": "SPR +12%", "spr_10": "SPR +10%", "spr_7": "SPR +7%", "spr_5": "SPR +5%", "spr_3": "SPR +3%", "spr_1": "SPR +1%",
    "autoRegen_4": "Auto-Regen 4","autoRegen_3": "Auto-Regen 3","autoRegen_2": "Auto-Regen 2","autoRegen_1": "Auto-Regen 1",
    "autoRefresh_4": "Auto-Refresh 2","autoRefresh_1": "Auto-Refresh 1",
    "autoProtect_5": "Auto-Protect 5","autoProtect_4": "Auto-Protect 4","autoProtect_3": "Auto-Protect 3","autoProtect_2": "Auto-Protect 2","autoProtect_1": "Auto-Protect 1",
    "autoShell_5": "Auto-Shell 5","autoShell_4": "Auto-Shell 4","autoShell_3": "Auto-Shell 3","autoShell_2": "Auto-Shell 2","autoShell_1": "Auto-Shell 1",
};
const itemEnhancementAbilities = {
    "rare":{
        "dagger": {"lbFillRate":100}, 
        "sword": {"hp%":15, "atk%":15}, 
        "greatSword": {"hp%":15, "atk%":15}, 
        "katana": {"hp%":15, "atk%":15}, 
        "staff": {"mp%":15, "spr%":15}, 
        "rod": {"mp%":15, "mag%":15}, 
        "bow": {"atk%":15, "mag%":15}, 
        "axe": {"atk%":30}, 
        "hammer": {"hp%":15, "def%":15}, 
        "spear": {"hp%":15, "atk%":15}, 
        "harp": {"hp%":15, "spr%":15}, 
        "whip": {"mp%":30}, 
        "throwing": {"hp%":15, "mp%":15}, 
        "gun": {"atk%":30}, 
        "mace": {"hp%":30}, 
        "fist": {"hp%":15, "atk%":15}
    },
    "hp_15": {"hp%":15}, "hp_12": {"hp%":12}, "hp_10": {"hp%":10}, "hp_7": {"hp%":7}, "hp_5": {"hp%":5}, "hp_3": {"hp%":3}, "hp_1": {"hp%":1},
    "mp_15": {"mp%":15}, "mp_12": {"mp%":12}, "mp_10": {"mp%":10}, "mp_7": {"mp%":7}, "mp_5": {"mp%":5}, "mp_3": {"mp%":3}, "mp_1": {"mp%":1},
    "atk_15": {"atk%":15}, "atk_12": {"atk%":12}, "atk_10": {"atk%":10}, "atk_7": {"atk%":7}, "atk_5": {"atk%":5}, "atk_3": {"atk%":3}, "atk_1": {"atk%":1},
    "def_15": {"def%":15}, "def_12": {"def%":12}, "def_10": {"def%":10}, "def_7": {"def%":7}, "def_5": {"def%":5}, "def_3": {"def%":3}, "def_1": {"def%":1},
    "mag_15": {"mag%":15}, "mag_12": {"mag%":12}, "mag_10": {"mag%":10}, "mag_7": {"mag%":7}, "mag_5": {"mag%":5}, "mag_3": {"mag%":3}, "mag_1": {"mag%":1},
    "spr_15": {"spr%":15}, "spr_12": {"spr%":12}, "spr_10": {"spr%":10}, "spr_7": {"spr%":7}, "spr_5": {"spr%":5}, "spr_3": {"spr%":3}, "spr_1": {"spr%":1}
}
