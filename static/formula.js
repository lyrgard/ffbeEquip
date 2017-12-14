const baseVariables = ["HP","MP","ATK","DEF","MAG","SPR","MP_REFRESH","P_EVADE","M_EVADE","P_DAMAGE","M_DAMAGE","H_DAMAGE","M_P_DAMAGE"];
const operators = ["*"];
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
    "H_DAMAGE":"hibridDamage",
    "M_P_DAMAGE":"magicalDamageWithPhysicalMecanism"
};

function parseFormula(formula) {
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
    alert("Error at position " + pos + ". Expected variable.");
    return;
}

function parseConditions(formula, pos) {
    while (formula.startsWith(" ")) {
        formula = formula.substr(1);
        pos++;
    }
    var separatorIndex = formula.indexOf(";");
    if (separatorIndex == -1) {
        return [parseCondition(formula, pos)];
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
    for (var index = baseVariables.length; index--; ) {
        if (formula.startsWith(baseVariables[index])) {
            var variable = baseVariables[index];
            formula = formula.substr(baseVariables[index].length);
            while (formula.startsWith(" ")) {
                formula = formula.substr(1);
                pos++;
            }
            if (formula.startsWith(">")) {
                formula = formula.substr(1);
                while (formula.startsWith(" ")) {
                    formula = formula.substr(1);
                    pos++;
                }
                formula = formula.trim();
                var goal = parseInt(formula);
                if (!isNaN(goal)) {
                    return {"value":{"type":"value", "name":attributeByVariable[variable]}, "goal":goal};
                } else {
                    alert("Error at position " + pos + ". Expected number.");            
                }
            } else {
                alert("Error at position " + pos + ". Expected '>'.");            
            }
        }
    }
    alert("Error at position " + pos + ". Expected variable.");
    return;
}

function formulaToString(formula) {
    if (!formula) {
        return "EMPTY FORMULA";
    }
    if (formula.type == "value") {
        return formula.name;
    } else if (formula.type == "conditions") {
        var result = formulaToString(formula.formula);
        for (var index = 0, len = formula.conditions.length; index < len ;index ++) {
            result += "; " + formula.conditions[index].value.name + ' > ' + formula.conditions[index].goal;
        }
        return result;
    } else {
        return formulaToString(formula.value1) + ' ' + formula.type + ' ' + formulaToString(formula.value2);
    }
}

// To test on NODE JS
/*function alert(message) {console.log("ALERT : " + message)};
console.log(parseFormula(process.argv[2]));
console.log(formulaToString(parseFormula(process.argv[2])));*/