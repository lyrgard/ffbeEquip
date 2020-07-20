function getEffectDescription(effectEntry) {
    if (effectEntry.effect && effectEntry.effect.resist) {
        let resistByValues = getResistByValues(effectEntry.effect.resist);
        let html = Object.keys(resistByValues).sort().map(value => {
            let valueHtml = "+" + value + "% ";
            valueHtml += resistByValues[value].map(name => '<i class="icon icon-sm ' + getResistIconClass(name) + ' icon-stack stack-shield"></i>').join('');
            return valueHtml;
        }).join(', ');
        html += getEffectTurnsAndTargets(effectEntry.effect);
        html += getEquipedCondition(effectEntry.effect);
        return html;
    } else {
        return effectEntry.desc;
    }
}

function getResistByValues(resists) {
    let byValue = {};
    resists.forEach(r => {
        let valueList = byValue[r.percent];
        if (!valueList) {
            valueList = [];
            byValue[r.percent] = valueList;
        }
        valueList.push(r.name);
    });
    return byValue;
}

function getResistIconClass(resistName) {
    if (elementList.includes(resistName)) {
        return 'element-' + resistName;
    } else {
        return 'ailment-' + resistName;
    }
}

function getEffectTurnsAndTargets(effect) {
    let text = "";
    if (effect.turns) {
        text += ' for ' + effect.turns + ' turns';
    }
    switch (effect.target) {
        case 'SELF':
            text += ' to self';
            break;
        case 'ENEMY':
            switch (effect.area) {
                case 'ST':
                    text += ' to one enemy';
                    break;
                case 'AOE':
                    text += ' to all enemies';
                    break;
                case 'RND':
                    text += ' to one random enemy';
                    break;
            }
            break;
        case 'ALLY':
            switch (effect.area) {
                case 'ST':
                    text += ' to one ally';
                    break;
                case 'AOE':
                    text += ' to all allies';
                    break;
                case 'RND':
                    text += ' to one random ally';
                    break;
            }
            break;
            break;
        case 'ALLY_BUT_SELF':
            switch (effect.area) {
                case 'ST':
                    text += ' to one ally but self';
                    break;
                case 'AOE':
                    text += ' to all allies but self';
                    break;
                case 'RND':
                    text += ' to one random ally but self';
                    break;
            }
            break;
        case 'ANY':
            switch (effect.area) {
                case 'ST':
                    text += ' to one target';
                    break;
                case 'AOE':
                    text += ' to all allies or enemies';
                    break;
            }
            break;
    }
    return text;
}

function getEquipedCondition(effect) {
    if(effect.equipedConditions) {
        let text = ' if equiped with ';
        text += effect.equipedConditions.map(condition => {
            if (typeList.includes(condition)) {
                return '<i class="icon icon-sm equipment-' + condition + '"></i>';
            } else if (elementList.includes(condition)) {
                return '<i class="img imicon icon-sm element-' + condition + ' icon-stack stack-sword"></i>';
            } else {
                if (Array.isArray(condition)) {
                    return condition.map(itemId => '<img src="/assets/game/items/' + dataById[itemId].icon + '" class="icon icon-sm">' + dataById[itemId].name).join(' or ');
                } else {
                    return '<img src="/assets/game/items/' + dataById[condition].icon + '" class="icon icon-sm">' + dataById[condition].name;
                }

            }
        }).join(', ');
        return text;
    }
    return '';
}
