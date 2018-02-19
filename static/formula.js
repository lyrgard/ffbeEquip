const baseVariables = ["HP","MP","ATK","DEF","MAG","SPR","MP_REFRESH","P_EVADE","M_EVADE","P_DAMAGE","M_DAMAGE","H_DAMAGE","M_P_DAMAGE","R_FIRE","R_ICE","R_THUNDER","R_WATER","R_EARTH","R_WIND","R_LIGHT","R_DARK","R_POISON","R_BLIND","R_SLEEP","R_SILENCE","R_PARALYSIS","R_CONFUSION","R_DISEASE","R_PETRIFICATION","R_DEATH","I_DISABLE","LB"];
const operators = ["/","*","+","-"];
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
    "M_DAMAGE":"magicalDamage",
    "H_DAMAGE":"hybridDamage",
    "M_P_DAMAGE":"magicalDamageWithPhysicalMecanism",
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
    "I_PHYSICAL" : "P_EVADE > 100"
}

function parseFormula(formula) {
    formula = formula.toUpperCase();
    for (var abbreviation in abbreviations) {
        formula = formula.replace(abbreviation, abbreviations[abbreviation]);
    }
    var separatorIndex = formula.indexOf(";");
    if (separatorIndex == -1) {
        return parseExpression(formula, 0);
    } else {
        var parsedFormula = parseExpression(formula.substr(0,separatorIndex), 0);
        var conditions = parseConditions(formula.substr(separatorIndex + 1), separatorIndex + 1);
        if (parsedFormula && conditions) {
            return {"type":"conditions", "conditions":conditions, "formula":parsedFormula};
        }
    }
}

function parseExpression(formula, pos) {
    for (var index = operators.length; index--; ) {
        var operatorPosition = formula.indexOf(operators[index]);
        if (operatorPosition > -1) {
            var value1 = parseExpression(formula.substr(0,operatorPosition), pos);
            var value2 = parseExpression(formula.substr(operatorPosition + operators[index].length), pos + operatorPosition + operators[index].length);
            if (value1 && value2) {
                return {"type":operators[index], "value1":value1, "value2":value2};
            } else {
                return;
            }
        }
    }
    while (formula.startsWith(" ")) {
        formula = formula.substr(1);
        pos++;
    }
    if (formula == "") {
        alert("Error at position " + pos + ". Expected variable.");
        return;
    }
    for (var index = baseVariables.length; index--; ) {
        if (formula.startsWith(baseVariables[index])) {
            formula = formula.substr(baseVariables[index].length);
            pos += baseVariables[index].length;
            while (formula.startsWith(" ")) {
                formula = formula.substr(1);
                pos++;
            }
            if (formula != "") {
                alert("Error at position " + pos + ". Expected operator.");
                return;
            }
            return {"type":"value", "name":attributeByVariable[baseVariables[index]]};
        }
    }
    var constant = parseConstant(formula, pos);
    if (constant) {
        return constant;
    }
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
            return [condition];
        }
    } else {
        var firstCondition = parseCondition(formula.substr(0,separatorIndex), 0);
        var otherConditions = parseConditions(formula.substr(separatorIndex + 1), separatorIndex + 1);
        if (firstCondition && otherConditions) {
            otherConditions.splice(0,0,firstCondition);
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
            return {"value":expression, "goal":constant.value};
        }
    } else {
        alert("Error at position " + pos + ". Condition does not contains \">\".");    
    }
    
    return;
}

function formulaToString(formula) {
    if (!formula) {
        return "EMPTY FORMULA";
    }
    if (formula.type == "value") {
        return getVariableName(formula.name);
    } else if (formula.type == "constant") {
        return formula.value.toString();
    } else if (formula.type == "conditions") {
        var result = formulaToString(formula.formula);
        for (var index = 0, len = formula.conditions.length; index < len ;index ++) {
            result += "; " + formulaToString(formula.conditions[index].value) + ' > ' + formula.conditions[index].goal;
        }
        for (var abbreviation in abbreviations) {
            result = result.replace(abbreviations[abbreviation], abbreviation);
        }
        result = result.replace(abbreviations["I_AILMENTS"], "I_AILMENTS");
        return result;
    } else {
        return formulaToString(formula.value1) + ' ' + formula.type + ' ' + formulaToString(formula.value2);
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
