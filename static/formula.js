const skillToken = "SKILL";
const baseVariables = ["HP","MP","ATK","DEF","MAG","SPR","MP_REFRESH","P_EVADE","M_EVADE", "EVO_MAG","P_DAMAGE","M_DAMAGE","H_DAMAGE", "F_DAMAGE","P_DAMAGE_MAG", "P_DAMAGE_MULTICAST", "P_DAMAGE_SPR", "P_DAMAGE_DEF", "P_DAMAGE_MAG_MULTICAST", "P_DAMAGE_SPR_MULTICAST", "P_DAMAGE_DEF_MULTICAST", "F_DAMAGE_ATK","M_DAMAGE_SPR","J_DAMAGE", "S_DAMAGE","R_FIRE","R_ICE","R_THUNDER", "R_LIGHTNING","R_WATER","R_EARTH","R_WIND","R_LIGHT","R_DARK","R_POISON","R_BLIND","R_SLEEP","R_SILENCE","R_PARALYSIS","R_CONFUSION","R_DISEASE","R_PETRIFICATION","R_DEATH","I_DISABLE","LB", "ACCURACY", "LB_DAMAGE"];
const elementVariables = ["E_FIRE", "E_ICE", "E_THUNDER", "E_WATER", "E_EARTH", "E_WIND", "E_LIGHT", "E_DARK", "E_NONE"];
const operators = ["/","*","+","-",">", "OR", "AND"];
const booleanResultOperators=[">", "OR", "AND"];
const operatorPrecedence = {
    "/": 4,
    "*": 4,
    "+": 3,
    "-": 3,
    ">": 2,
    "OR": 1,
    "AND": 1
}
const attributeByVariable = {
    "HP":"hp",
    "MP":"mp",
    "ATK":"atk",
    "DEF":"def",
    "MAG":"mag",
    "SPR":"spr",
    "MP_REFRESH":"mpRefresh",
    "P_EVADE":"evade.physical",
    "M_EVADE":"evade.magical",
    "EVO_MAG":"evoMag",
    "P_DAMAGE":"physicalDamage",
    "P_DAMAGE_MULTICAST":"physicalDamageMultiCast",
    "M_DAMAGE":"magicalDamage",
    "H_DAMAGE":"hybridDamage",
    "J_DAMAGE":"jumpDamage",
    "F_DAMAGE":"fixedDamageWithPhysicalMecanism",
    "P_DAMAGE_MAG":"magDamageWithPhysicalMecanism",
    "P_DAMAGE_SPR":"sprDamageWithPhysicalMecanism",
    "P_DAMAGE_DEF":"defDamageWithPhysicalMecanism",
    "P_DAMAGE_MAG_MULTICAST":"magDamageWithPhysicalMecanismMultiCast",
    "P_DAMAGE_SPR_MULTICAST":"sprDamageWithPhysicalMecanismMultiCast",
    "P_DAMAGE_DEF_MULTICAST":"defDamageWithPhysicalMecanismMultiCast",
    "F_DAMAGE_ATK":"atkDamageWithFixedMecanism",
    "M_DAMAGE_SPR":"sprDamageWithMagicalMecanism",
    "S_DAMAGE":"summonerSkill",
    "R_FIRE":"resist|fire.percent",
    "R_ICE":"resist|ice.percent",
    "R_LIGHTNING":"resist|lightning.percent",
    "R_THUNDER":"resist|lightning.percent",
    "R_WATER":"resist|water.percent",
    "R_EARTH":"resist|earth.percent",
    "R_WIND":"resist|wind.percent",
    "R_LIGHT":"resist|light.percent",
    "R_DARK":"resist|dark.percent",
    "R_POISON":"resist|poison.percent",
    "R_BLIND":"resist|blind.percent",
    "R_SLEEP":"resist|sleep.percent",
    "R_SILENCE":"resist|silence.percent",
    "R_PARALYSIS":"resist|paralysis.percent",
    "R_CONFUSION":"resist|confuse.percent",
    "R_DISEASE":"resist|disease.percent",
    "R_PETRIFICATION":"resist|petrification.percent",
    "R_DEATH":"resist|death.percent",
    "LB":"lbPerTurn",
    "ACCURACY": "accuracy"
};

const simpleImunityValues = ["resist|poison.percent","resist|blind.percent","resist|sleep.percent","resist|silence.percent","resist|paralysis.percent","resist|confuse.percent","resist|disease.percent","resist|petrification.percent","resist|death.percent"];
const simpleResistValues = ["resist|fire.percent","resist|ice.percent","resist|lightning.percent","resist|water.percent","resist|earth.percent","resist|wind.percent","resist|light.percent","resist|dark.percent"];

var formulaByVariable = {
    "physicalDamage":                   {"type":"skill", "id":"0","name":"1x physical ATK damage", "formulaName":"physicalDamage", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1}}},
    "magicalDamage":                    {"type":"skill", "id":"0","name":"1x magical MAG damage", "formulaName":"magicalDamage", "value": {"type":"damage", "value":{"mecanism":"magical", "damageType":"mind", "coef":1}}},
    "hybridDamage":                     {"type":"skill", "id":"0","name":"1x hybrid ATK damage", "formulaName":"hybridDamage", "value": {"type":"damage", "value":{"mecanism":"hybrid", "coef":1}}},
    "jumpDamage":                       {"type":"skill", "id":"0","name":"1x jump damage", "formulaName":"jumpDamage", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1, "jump":true}}},
    "magDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical MAG damage", "formulaName":"magDamageWithPhysicalMecanism", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"mind", "coef":1}}},
    "sprDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical SPR damage", "formulaName":"sprDamageWithPhysicalMecanism", "formulaName":"physicalDamage", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"mind", "coef":1, "use":{"stat":"spr"}}}},
    "defDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical DEF damage", "formulaName":"defDamageWithPhysicalMecanism", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1, "use":{"stat":"def"}}}},
    "sprDamageWithMagicalMecanism":     {"type":"skill", "id":"0","name":"1x physical SPR damage", "formulaName":"sprDamageWithMagicalMecanism", "value": {"type":"damage", "value":{"mecanism":"magical", "damageType":"mind", "coef":1, "use":{"stat":"spr"}}}},
}
const abbreviations = {
    "I_AILMENTS" : "I_POISON; I_BLIND; I_SLEEP; I_SILENCE; I_PARALYSIS; I_CONFUSION; I_DISEASE; I_PETRIFICATION",
    "I_DISABLE" : "I_SLEEP; I_PARALYSIS; I_CONFUSION; I_PETRIFICATION",
    "I_POISON" : "R_POISON > 100",
    "I_BLIND" : "R_BLIND > 100",
    "I_SLEEP" : "R_SLEEP > 100",
    "I_SILENCE": "R_SILENCE > 100",
    "I_PARALYSIS" : "R_PARALYSIS > 100",
    "I_CONFUSION" : "R_CONFUSION > 100",
    "I_DISEASE" : "R_DISEASE > 100",
    "I_PETRIFICATION" : "R_PETRIFICATION > 100",
    "I_DEATH" : "R_DEATH > 100",
    "I_PHYSICAL" : "P_EVADE > 100",
    "I_FIRE" : "R_FIRE > 100",
    "I_ICE" : "R_ICE > 100",
    "I_LIGHTNING" : "R_LIGHTNING > 100",
    "I_THUNDER" : "R_LIGHTNING > 100",
    "I_WATER" : "R_WATER > 100",
    "I_WIND" : "R_WIND > 100",
    "I_EARTH" : "R_EARTH > 100",
    "I_LIGHT" : "R_LIGHT > 100",
    "I_DARK" : "R_DARK > 100",
}

var elementVariablesUsed = [];
var caracts = [];

function parseFormula(formula, unit) {
    formula = formula.toUpperCase();
    formula = formula.replace("MAXIMIZE","");
    formula = formula.replace("WITH",";");
    formula = formula.replace("|"," OR ");
    elementVariablesUsed = [];
    caracts = [];
    var result;
    
    for (var abbreviation in abbreviations) {
        formula = formula.replace(abbreviation, abbreviations[abbreviation]);
    }
    var separatorIndex = formula.indexOf(";");
    if (separatorIndex == -1) {
        var parsedFormula = parseExpression(formula, 0, unit);
        if (booleanResultOperators.includes(parsedFormula.type)) {
            alert("Maximize goal must result to a value, not to a boolean");
            return;
        }
        result = parsedFormula;
    } else {
        var parsedFormula = parseExpression(formula.substr(0,separatorIndex), 0, unit);
        var condition = parseExpression(formula.substr(separatorIndex + 1).split(";").join(" AND "), separatorIndex + 1, unit);
        
        if (booleanResultOperators.includes(parsedFormula.type)) {
            alert("Maximize goal must result to a value, not to a boolean");
            return;
        }
        if (parsedFormula && condition) {
            result = {"type":"condition", "condition":condition, "formula":parsedFormula};
            if (elementVariablesUsed.length > 0) {
                result.elements = elementVariablesUsed;
            }
        }
    }
    if (caracts.includes("stack")) {
        result.stack = true;
    }
    return result;
}

function parseExpression(formula, pos, unit) {
    var currentVar = "";
    var outputQueue = [];
    var operatorStack = [];
    var tokenInfo;
    while(tokenInfo = getNextToken(formula)) {
        var token = tokenInfo.token;
        
        if (token.startsWith("MULTICAST(") && token.endsWith(")")) {
            var skills = token.substr(10, token.length - 11).split(",").map(x => x.trim()).map(x => getFormulaFromSkillToken(x, unit));
            outputQueue.push({"type":"multicast", "skills":skills});
        } else if (token.startsWith("SKILL(") && token.endsWith(")")) {
            var skillFormula = getFormulaFromSkillToken(token, unit);
            if (skillFormula) {
                outputQueue.push(skillFormula);
            } else {
                alert("Error. skill not understood : " + token);
                return;
            }
        } else if (token == "LB_DAMAGE") {
            outputQueue.push(formulaFromSkill(unit.lb));
        } else if (baseVariables.includes(token)) {
            if (formulaByVariable[attributeByVariable[token]]) {
                outputQueue.push(formulaByVariable[attributeByVariable[token]]);
            } else {
                outputQueue.push({"type":"value", "name":attributeByVariable[token]});
            }
        } else if (token.startsWith("LB_") && baseVariables.includes(token.substr(3))) {
            outputQueue.push({"type":"value", "name":attributeByVariable[token.substr(3)], "lb":true});
        } else if (elementVariables.includes(token)) {
            var element = token.substr(2).toLocaleLowerCase().replace("thunder", "lightning");
            outputQueue.push({"type":"elementCondition", "element":element});
            if (!elementVariablesUsed.includes(element) && element != "none") {
                elementVariablesUsed.push(element);   
            }
        } else if (!isNaN(token)) {
            outputQueue.push({"type":"constant", "value":+token});
        } else if (operators.includes(token)) {
            while (operatorStack[operatorStack.length-1] != "(" && operatorPrecedence[operatorStack[operatorStack.length-1]] >= operatorPrecedence[token]) {
                var popResult = popOperator(operatorStack, outputQueue);
                if (!popResult) {
                    return;
                }
            }
            operatorStack.push(token);
        } else if (token == "(") {
            operatorStack.push(token);
        } else if (token == ")") {
            while (operatorStack[operatorStack.length-1] != "(") {
                var popResult = popOperator(operatorStack, outputQueue);
                if (!popResult) {
                    return;
                }
            }
            if (operatorStack[operatorStack.length-1] == "(") {
                operatorStack.pop();
            } else {
                alert("Error. Mismatched parentheses.");
                return;
            }
        } else {
            alert("Error at position " + pos + ". " + token + " is not a valid variable.");
            return;
        }
        formula = formula.substr(tokenInfo.read);
        pos += tokenInfo.read;
    }
    while (operatorStack.length > 0) {
        if (operatorStack[operatorStack.length-1] == "(") {
            alert("Error. Mismatched parentheses.");
            return;
        } else {
            var popResult = popOperator(operatorStack, outputQueue);
            if (!popResult) {
                return;
            }
        }
    }
    if (outputQueue.length != 1) {
        alert("Error. Malformed expression.");
        return;
    }
    return outputQueue[0];
}

function getFormulaFromSkillToken(token, unit) {
    if (token.startsWith("SKILL(") && token.endsWith(")")) {
        var upgradeTriggerUsed = false;
        var skillName = token.substr(6, token.length - 7);
        var skill = getSkillFromName(skillName, unit);
        if (!skill) {
            skill = getSkillFromId(skillName, unit);
        }
        return formulaFromSkill(skill);
    } else {
        return null;
    }
}

function getNextToken(formula) {
    var currentVar = "";
    var pos = 0;
    var readingFunction = false;
    var openedBracketInFunction = 0;
    while(pos < formula.length) {
        var char = formula.substr(pos, 1);
        pos++;
        if (!readingFunction && char == " ") {
            if (currentVar.length != 0) {
                return {"token": currentVar, "read":pos - 1};
            }
            continue;
        }
        if (!readingFunction && (operators.includes(char) || char === "(" || char === ")")) {
            if (currentVar.length != 0) {
                if ((currentVar == "MULTICAST" || currentVar == "SKILL") && char === "(") {
                    readingFunction = true;
                    currentVar += char;
                } else {
                    return {"token": currentVar, "read":pos - 1};    
                }
            } else {
                return {"token": char, "read":pos};
            }
        } else {
            currentVar += char;
            if (readingFunction) {
                if (char == "(") {
                    openedBracketInFunction++;
                } else if (char == ")") {
                    if (openedBracketInFunction == 0) {
                        return {"token": currentVar, "read":pos};
                    } else {
                        openedBracketInFunction--;
                    }
                }
            }
        }
    }
    if (currentVar.length != 0) {
        return {"token": currentVar, "read":pos};
    } else {
        null;
    }
}

function popOperator(operatorStack, outputQueue) {
    var operator = operatorStack.pop();
    if (outputQueue.length < 2) {
        alert("Error. Malformed expression.");
        return false;
    }
    var value2 = outputQueue.pop();
    var value1 = outputQueue.pop();
    if (operator == "OR" || operator == "AND") {
        if (value1.type != "elementCondition" && !booleanResultOperators.includes(value1.type)) {
            alert("Error. Left part of a " + operator + " must evaluate to a boolean.");
            return false;
        }
        if (value2.type != "elementCondition" && !booleanResultOperators.includes(value2.type)) {
            alert("Error. Right part of a " + operator + " must evaluate to a boolean.");
            return false;
        }
    } else if (operator == ">") {
        if (value1.type != "value" && value1.type != "skill" && !operators.includes(value1.type)) {
            alert("Error. Left part of a " + operator + " must evaluate to a value.");
            return false;
        }
        if (value2.type != "constant") {
            alert("Error. Right part of a " + operator + " must evaluate to a constant.");
            return false;
        }
    } else {
        if (booleanResultOperators.includes(value1.type)) {
            alert("Error. Left part of a " + operator + " must not evaluate to a boolean.");
            return false;
        }
        if (booleanResultOperators.includes(value2.type)) {
            alert("Error. Right part of a " + operator + " must not evaluate to a boolean.");
            return false;
        }
    }
    outputQueue.push({"type":operator, "value1":value1, "value2":value2});
    return true;
}

function parseConstant(formula, pos) {
    while (formula.startsWith(" ")) {
        formula = formula.substr(1);
        pos++;
    }
    formula = formula.trim();
    if (!isNaN(formula)) {
        return {"type":"constant", "value":+formula}
    }
    alert("Error at position " + pos + ". Expected constant.");
}

function getSkillFromName(skillName, unitWithSkills) {
    if (skillName.endsWith("_UPGRADED")) {
        skillName = skillName.substr(0, skillName.length - 9);
    }
    skillName = skillName.toLocaleUpperCase();
    var skill;
    if (unitWithSkills.lb.name.toLocaleUpperCase() == skillName) {
        skill = unitWithSkills.lb;
    } else {
        for (var i = unitWithSkills.actives.length; i--;) {
            if (unitWithSkills.actives[i].name.toLocaleUpperCase() == skillName) {
                skill = unitWithSkills.actives[i];
                break;
            }
        }
        if (!skill) {
            for (var i = unitWithSkills.magics.length; i--;) {
                if (unitWithSkills.magics[i].name.toLocaleUpperCase() == skillName) {
                    skill = unitWithSkills.magics[i];
                    break;
                }
            }
        }
        if (!skill) {
            for (var i = unitWithSkills.passives.length; i--;) {
                if (unitWithSkills.passives[i].name.toLocaleUpperCase() == skillName) {
                    skill = unitWithSkills.passives[i];
                    break;
                }
            }
        }
    }
    return skill;
}

function getSkillFromId(skillId, unitWithSkills) {
    var skill;
    
    for (var i = unitWithSkills.actives.length; i--;) {
        if (unitWithSkills.actives[i].id == skillId) {
            skill = unitWithSkills.actives[i];
            break;
        }
    }
    if (!skill) {
        for (var i = unitWithSkills.magics.length; i--;) {
            if (unitWithSkills.magics[i].id == skillId) {
                skill = unitWithSkills.magics[i];
                break;
            }
        }
    }
    if (!skill) {
        for (var i = unitWithSkills.passives.length; i--;) {
            if (unitWithSkills.passives[i].id == skillId) {
                skill = unitWithSkills.passives[i];
                break;
            }
        }
    }
    return skill;
}


function formulaFromSkill(skill) {
    var canBeGoal = false;
    var hasStack = false;
    var isUpgradable = false;
    var formula;
    var isLb = false;
    
    var effects;
    if (skill.maxEffects) {
        effects = skill.maxEffects;
        isLb = true;
    } else {
        effects = skill.effects;
    }
    for (var i = 0, len = effects.length; i < len; i++) {
        if (!effects[i].effect) {
            return {"type": "skill", "id":skill.id, "name":skill.name, "notSupported":true};
        }
        var formulaToAdd = formulaFromEffect(effects[i]);
        if (formulaToAdd) {
            if (formulaToAdd.notSupported) {
                return {"type": "skill", "id":skill.id, "name":skill.name, "notSupported":true};
            }
            if (formulaToAdd.type == "damage" || formulaToAdd.type == "heal" || formulaToAdd.type == "skill") {
                canBeGoal = true;
            }
            if (formulaToAdd.value.stack) {
                hasStack = true;
            }
            if (!formula) {
                formula = formulaToAdd;
            } else {
                formula = {
                    "type": "+",
                    "value1": formula,
                    "value2": formulaToAdd
                }
            }
        }
    }
    if (formula) {
        formula = {"type": "skill", "id":skill.id, "name":skill.name, "value":formula, "stack":hasStack, "lb":isLb};
    }
    if (canBeGoal) {
        if (hasStack && !caracts.includes("stack")) {
            caracts.push("stack");
        }
        return formula;
    }
    return null;
}

function formulaFromEffect(effect) {
    if (effect.effect.damage) {
        var coef = effect.effect.damage.coef;
        return {"type":"damage", "value":effect.effect.damage};
    } else if (effect.effect.imperil) {
        return {
            "type": "imperil",
            "value": effect.effect.imperil
        }
    } else if (effect.effect.statsBuff) {
        return {
            "type": "statsBuff",
            "value": effect.effect.statsBuff
        }
    } else if (effect.effect.break) {
        return {
            "type": "break",
            "value": effect.effect.break
        }
    } else if (effect.effect.imbue) {
        return {
            "type": "imbue",
            "value": effect.effect.imbue
        }
    } else if (effect.effect.killers) {
        return {
            "type": "killers",
            "value": effect.effect
        }
    } else if (effect.effect.cooldownSkill) {
        return formulaFromSkill(effect.effect.cooldownSkill);
    }
    return null;
}

function formulaToString(formula, useParentheses = false) {
    if (!formula) {
        return "EMPTY FORMULA";
    }
    return "Maximize " + innerFormulaToString(formula);
}

function innerFormulaToString(formula, useParentheses = false) {
    if (formula.type == "skill") {
        if (formula.lb) {
            return "LB_DAMAGE";
        } else if (formula.formulaName) {
            return getVariableName(formula.formulaName);
        } else {
            return "SKILL(" + formula.id + ")";
        }
    } else if (formula.type == "multicast") {
        return "MULTICAST(" + formula.skills.map(innerFormulaToString).join(",") + ")";
    } else if (formula.type == "value") {
        var name = getVariableName(formula.name);
        if (formula.lb) {
            name = "LB_" + name
        }
        return name;
    } else if (formula.type == "constant") {
        return formula.value.toString();
    } else if (formula.type == "elementCondition") {
        return "E_" + formula.element.replace("lightning","thunder").toUpperCase();    
    } else if (formula.type == "condition") {
        var result = innerFormulaToString(formula.formula) + " with " + innerFormulaToString(formula.condition);
        for (var abbreviation in abbreviations) {
            result = result.replace(abbreviations[abbreviation], abbreviation);
        }
        result = result.replace(abbreviations["I_AILMENTS"], "I_AILMENTS");
        return result;
    } else {
        var result = "";
        if (useParentheses) {
            result += "(";
        }
        result += innerFormulaToString(formula.value1, true) + ' ' + formula.type + ' ' + innerFormulaToString(formula.value2, true);
        if (useParentheses) {
            result += ")";
        }
        return result;
    }
}

function getVariableName(attribute) {
    for (var variable in attributeByVariable) {
        if (attributeByVariable[variable] == attribute) {
            return variable;
        }
    }
}

function getSimpleConditions(formula) {
    var simpleConditions = {
        "forcedElements":[],
        "ailmentImunity":[],
        "elementalResist": {},
        "evasion": []
    }
    
    if (formula && formula.type == "condition") {
        innerGetSimpleConditions(formula.condition, simpleConditions);
    }
    return simpleConditions;
}

function innerGetSimpleConditions(formula, simpleConditions) {
    switch(formula.type) {
        case ">":
            if (formula.value1.type == "value" && formula.value2.type == "constant") {
                if (formula.value1.name.startsWith("resist|") && formula.value1.name.endsWith(".percent")) {
                    var resist = formula.value1.name.substr(7, formula.value1.name.length - 15);
                    if (ailmentList.includes(resist) && formula.value2.value == 100) {
                        if (!simpleConditions.ailmentImunity.includes(resist)) {
                            simpleConditions.ailmentImunity.push(resist);
                        }
                    }
                    else if (elementList.includes(resist)) {
                        if (!simpleConditions.elementalResist[resist] || simpleConditions.elementalResist[resist] < formula.value2.value) {
                            simpleConditions.elementalResist[resist] = formula.value2.value;
                        }
                    }
                } else if (formula.value1.name == "evade.physical" && formula.value2.value == 100) {
                    if (!simpleConditions.evasion.includes("evade.physical")) {
                        simpleConditions.evasion.push("evade.physical")    
                    }
                } else if (formula.value1.name == "accuracy" && formula.value2.value == 100) {
                    if (!simpleConditions.evasion.includes("accuracy")) {
                        simpleConditions.evasion.push("accuracy")    
                    }
                }
            }
            break;
        case "elementCondition":
            if (!simpleConditions.forcedElements.includes(formula.element)) {
                simpleConditions.forcedElements.push(formula.element);
            }
            break;
        case "AND":
            innerGetSimpleConditions(formula.value1, simpleConditions);
            innerGetSimpleConditions(formula.value2, simpleConditions);
            break;
    }
}

function makeSureFormulaHaveSimpleConditions(formula, simpleConditions) {
    var currentSimpleConditions = getSimpleConditions(formula);
    for (var i = simpleConditions.forcedElements.length; i--;) {
        if (!currentSimpleConditions.forcedElements.includes(simpleConditions.forcedElements[i])) {
            formula = addCondition(formula, {type:"elementCondition", "element":simpleConditions.forcedElements[i]});
            if (!formula.elements) {
                formula.elements = [];
            }
            if (!formula.elements.includes(simpleConditions.forcedElements[i])) {
                formula.elements.push(simpleConditions.forcedElements[i]);
            }
        }
    }
    for (var i = simpleConditions.ailmentImunity.length; i--;) {
        if (!currentSimpleConditions.ailmentImunity.includes(simpleConditions.ailmentImunity[i])) {
            formula = addCondition(
                formula, 
                {
                    type:">", 
                    "value1": {
                        type: "value",
                        "name": "resist|" + simpleConditions.ailmentImunity[i] + ".percent"
                    },
                    "value2": {
                        "type": "constant",
                        "value": 100
                    }
                }
            );
        }
    }
    var elements = Object.keys(simpleConditions.elementalResist);
    for (var i = elements.length; i--;) {
        if (!currentSimpleConditions.elementalResist[elements[i]] || currentSimpleConditions.elementalResist[elements[i]] < simpleConditions.elementalResist[elements[i]]) {
            formula = addCondition(
                formula, 
                {
                    type:">", 
                    "value1": {
                        type: "value",
                        "name": "resist|" + elements[i] + ".percent"
                    },
                    "value2": {
                        "type": "constant",
                        "value": simpleConditions.elementalResist[elements[i]]
                    }
                }
            );
        }
    }
    for (var i = simpleConditions.evasion.length; i--;) {
        if (!currentSimpleConditions.evasion.includes(simpleConditions.evasion[i])) {
            formula = addCondition(
                formula, 
                {
                    type:">", 
                    "value1": {
                        type: "value",
                        "name": simpleConditions.evasion[i]
                    },
                    "value2": {
                        "type": "constant",
                        "value": 100
                    }
                }
            );
        }
    }
    return formula; 
}

function addCondition(formula, condition) {
    if (formula.type != "condition") {
        formula = {
            "type": "condition",
            "formula" : formula,
            "condition" : condition,
            "elements": formula.elements
        }
    } else {
        formula.condition = {
            "type": "AND",
            "value1": condition,
            "value2": formula.condition
        }
    }
    return formula;
}

function isSimpleFormula(formula) {
    switch(formula.type) {
        case "condition":
            return isSimpleFormula(formula.formula) && isSimpleFormula(formula.condition);
            break;
        case "multicast":
        case "elementCondition":
        case "skill" :
            return true;
            break;
        case "AND":
            return isSimpleFormula(formula.value1) && isSimpleFormula(formula.value2);
            break;
        case ">":
            if (formula.value1.type == "value" && formula.value2.type == "constant") {
                if (simpleImunityValues.includes(formula.value1.name) && formula.value2.type == "constant" && formula.value2.value == 100) {
                    return true;
                } else if (simpleResistValues.includes(formula.value1.name)) {
                    return true;
                }
            }
            return false;
            break;
        default:
            return false;
    }
}

function getSkillIds(formula) {
    if (formula.type == "skill") {
        if (formula.id) {
            return [formula.id];
        }
    } else if (formula.type == "multicast") {
        return formula.skills.map(skill => getSkillIds(skill)).reduce(
            (arr, ids) => {
                if (ids && ids.length > 0) {
                    return [...arr, ...ids];
                } else {
                    return arr;
                }
            },
            []
        );
    } else if (formula.type == "condition") {
        return getSkillIds(formula.formula).concat(getSkillIds(formula.condition));
    } else if (formula.type == "value" || formula.type == "constant" || formula.type == "elementCondition" || formula.type == "damage") {
        return [];
    } else {
        return getSkillIds(formula.value1).concat(getSkillIds(formula.value2));
    }
    return [];
}

function getMulticastSkillAbleToMulticast(skills, unit) {
    var passiveAndActives = unit.actives.concat(unit.passives);
    for (var i = passiveAndActives.length; i--;) {
        var skill = passiveAndActives[i];
        var multicastEffect;
        for (var j = skill.effects.length; j--;) {
            if (skill.effects[j].effect && skill.effects[j].effect.multicast) {
                multicastEffect = skill.effects[j].effect.multicast;
                break;
            }
        }
        if (multicastEffect) {
            switch(multicastEffect.type) {
                case "skills":
                    var possibleSkillIds = multicastEffect.skills.map(x => x.id.toString());
                    if (skills.every(x => possibleSkillIds.includes(x.id))) {
                        return skill;
                    }
                    break;
                case "magic":
                    if (skills.every(x => x.magic)) {
                        return skill;
                    }
                    break;
                case "whiteMagic":
                    if (skills.every(x => x.magic == "white")) {
                        return skill;
                    }
                    break;
                case "blackMagic":
                    if (skills.every(x => x.magic == "black")) {
                        return skill;
                    }
                    break;
            }
        }
    }
}


function hasStack(formula) { 
    if (!formula) {
        return false;
    }
    if (formula.type == "multicast") {
        for (var i = formula.skills.length; i--;) {
            if (hasStack(formula.skills[i])) {
                return true;
            }
        }
        return false;
    } else if (formula.type == "skill") {
        return formula.stack;
    } else if (formula.type == "condition") {
        return hasStack(formula.formula);
    } else {
        return false;
    }
}

// To test on NODE JS
/*function alert(message) {console.log("ALERT : " + message)};
console.log(parseFormula(process.argv[2]));
console.log(formulaToString(parseFormula(process.argv[2])));*/
