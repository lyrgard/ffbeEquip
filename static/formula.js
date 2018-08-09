const baseVariables = ["HP","MP","ATK","DEF","MAG","SPR","MP_REFRESH","P_EVADE","M_EVADE","P_DAMAGE","M_DAMAGE","H_DAMAGE", "F_DAMAGE","P_DAMAGE_MAG", "P_DAMAGE_MULTICAST", "P_DAMAGE_SPR", "P_DAMAGE_DEF", "P_DAMAGE_MAG_MULTICAST", "P_DAMAGE_SPR_MULTICAST", "P_DAMAGE_DEF_MULTICAST", "F_DAMAGE_ATK","M_DAMAGE_SPR","J_DAMAGE", "S_DAMAGE","R_FIRE","R_ICE","R_THUNDER","R_WATER","R_EARTH","R_WIND","R_LIGHT","R_DARK","R_POISON","R_BLIND","R_SLEEP","R_SILENCE","R_PARALYSIS","R_CONFUSION","R_DISEASE","R_PETRIFICATION","R_DEATH","I_DISABLE","LB"];
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
    "LB":"lbPerTurn"
};
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
    "I_THUNDER" : "R_THUNDER > 100",
    "I_WATER" : "R_WATER > 100",
    "I_WIND" : "R_WIND > 100",
    "I_EARTH" : "R_EARTH > 100",
    "I_LIGHT" : "R_LIGHT > 100",
    "I_DARK" : "R_DARK > 100",
}

var elementVariablesUsed = [];

function parseFormula(formula) {
    formula = formula.toUpperCase();
    formula = formula.replace("MAXIMIZE","");
    formula = formula.replace("WITH",";");
    formula = formula.replace("|"," OR ");
    elementVariablesUsed = [];
    
    for (var abbreviation in abbreviations) {
        formula = formula.replace(abbreviation, abbreviations[abbreviation]);
    }
    var separatorIndex = formula.indexOf(";");
    if (separatorIndex == -1) {
        var parsedFormula = parseExpression(formula, 0);
        if (booleanResultOperators.includes(parsedFormula.type)) {
            alert("Maximize goal must result to a value, not to a boolean");
            return;
        }
        return parsedFormula;
    } else {
        var parsedFormula = parseExpression(formula.substr(0,separatorIndex), 0);
        var condition = parseExpression(formula.substr(separatorIndex + 1).split(";").join(" AND "), separatorIndex + 1);
        
        if (booleanResultOperators.includes(parsedFormula.type)) {
            alert("Maximize goal must result to a value, not to a boolean");
            return;
        }
        if (parsedFormula && condition) {
            var result = {"type":"condition", "condition":condition, "formula":parsedFormula};
            if (elementVariablesUsed.length > 0) {
                result.elements = elementVariablesUsed;
            }
            return result;
        }
        
    }
}

function parseExpression(formula, pos) {
    var currentVar = "";
    var outputQueue = [];
    var operatorStack = [];
    var tokenInfo;
    while(tokenInfo = getNextToken(formula)) {
        var token = tokenInfo.token;
        
        if (baseVariables.includes(token)) {
            outputQueue.push({"type":"value", "name":attributeByVariable[token]});
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

function getNextToken(formula) {
    var currentVar = "";
    var pos = 0;
    while(pos < formula.length) {
        var char = formula.substr(pos, 1);
        pos++;
        if (char == " ") {
            if (currentVar.length != 0) {
                return {"token": currentVar, "read":pos - 1};
            }
            continue;
        }
        if (operators.includes(char) || char === "(" || char === ")") {
            if (currentVar.length != 0) {
                return {"token": currentVar, "read":pos - 1};
            } else {
                return {"token": char, "read":pos};
            }
        } else {
            currentVar += char;
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
        if (value2.type != "elementCondition" && !booleanResultOperators.includes(value1.type)) {
            alert("Error. Right part of a " + operator + " must evaluate to a boolean.");
            return false;
        }
    } else if (operator == ">") {
        if (value1.type != "value" && !operators.includes(value1.type)) {
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

function parseConditions(formula, pos) {
    while (formula.startsWith(" ")) {
        formula = formula.substr(1);
        pos++;
    }
    var separatorIndex = formula.indexOf(";");
    if (separatorIndex == -1) {
        var condition = parseCondition(formula, pos);
        if (condition) {
            if (condition.type == "threshold") {
                return {"thresholds": [{"value":condition.value, "goal":condition.goal}]}
            } else {
                return {"elements": [condition.value]}
            }
        }
    } else {
        var firstCondition = parseCondition(formula.substr(0,separatorIndex), 0);
        var otherConditions = parseConditions(formula.substr(separatorIndex + 1), separatorIndex + 1);
        if (firstCondition && otherConditions) {
            if (firstCondition.type == "threshold") {
                if (!otherConditions.thresholds) { otherConditions.thresholds = []; }
                otherConditions.thresholds.push({"value":firstCondition.value, "goal":firstCondition.goal})
            } else {
                if (!otherConditions.elements) { otherConditions.elements = []; }
                if (firstCondition.value != "none" && otherConditions.elements.includes("none")) {
                    alert("Error : impossible to force no element AND " + firstCondition.value + " element");
                    return undefined;
                } else if (firstCondition.value == "none" && otherConditions.elements.length >= 0) {
                    alert("Error : impossible to force no element AND " + otherConditions.elements );
                    return undefined;
                }
                otherConditions.elements.push(firstCondition.value)
            }
            return otherConditions;
        }
    }
}

function parseCondition(formula, pos) {
    while (formula.startsWith(" ")) {
        formula = formula.substr(1);
        pos++;
    }
    var gtPos = formula.indexOf(">")
    if (gtPos >= 0) {
        var expression = parseExpression(formula.substr(0,gtPos), pos);
        var constant = parseConstant(formula.substr(gtPos + 1), gtPos + 1);
        if (expression && constant) {
            return {"type":"threshold" ,"value":expression, "goal":constant.value};
        }
    } else {
        formula = formula.trim();
        if (elementVariables.includes(formula)) {
            return {"type":"element" ,"value":formula.substr(2).toLocaleLowerCase().replace("thunder", "lightning")};
        } else {
            alert("Error at position " + pos + ". Condition does not contains \">\".");       
        }
    }
    
    return;
}

function formulaToString(formula, useParentheses = false) {
    if (!formula) {
        return "EMPTY FORMULA";
    }
    return "Maximize " + innerFormulaToString(formula);
}

function innerFormulaToString(formula, useParentheses = false) {
    if (formula.type == "value") {
        return getVariableName(formula.name);
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

// To test on NODE JS
/*function alert(message) {console.log("ALERT : " + message)};
console.log(parseFormula(process.argv[2]));
console.log(formulaToString(parseFormula(process.argv[2])));*/
