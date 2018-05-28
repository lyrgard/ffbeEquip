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
const accessList = ["shop","chest","quest","trial","chocobo","event","colosseum","key","TMR-1*","TMR-2*","TMR-3*","TMR-4*","TMR-5*","recipe-shop","recipe-chest","recipe-quest","recipe-event","recipe-colosseum","recipe-key","trophy","recipe-trophy","premium"];
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
    "summonerSkill":                    {"statsToMaximize":["mag","spr"], "type": "none"},
};
