FFBEEquipExternalControl = {
    'ffbeEquipUrl': 'https://ffbeEquip.com/builder.html',
    'iframe': null,
    'checkboxList': [
        'forceDoublehand',
        'forceDualWield',
        'tryEquipsources',
        'tryReduceOverCap',
        'forceTmrAbility',
        'useNewJpDamageFormula',
        'includeEasilyObtainableItems',
        'includeChocoboItems',
        'includeTMROfOwnedUnits',
        'includeTmrMoogles',
        'includeTrialRewards',
        'exludeEvent',
        'excludePremium',
        'excludeTMR5',
        'excludeSTMR',
        'excludeNotReleasedYet'
    ],
    requestId : 0,
    
    'init': function(iframe, loggedOut = false) {
        console.log("init");
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe = iframe;
            window.addEventListener("message", FFBEEquipExternalControl.handleMessage);
            let src = FFBEEquipExternalControl.ffbeEquipUrl;
            if (loggedOut) {
                src += "?o";
            }
            iframe.src = src;
            FFBEEquipExternalControl.listeners.ready = resolve;
        });
    },
    
    'selectUnit': function(unitId) {
        console.log("selectUnit " + unitId );
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'selectUnit', 'value':unitId}), '*');
            FFBEEquipExternalControl.listeners.unitSelected = resolve;
        });
    },

    'pinItem': function(itemId) {
        console.log("pinItem " + itemId );
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'pinItem', 'value':itemId, requestId: FFBEEquipExternalControl.requestId}), '*');
            FFBEEquipExternalControl.listeners['itemPinned' + FFBEEquipExternalControl.requestId++] = resolve;
        });
    },

    'setBuff': function(stat, value) {
        console.log("setBuff " + stat + ' ' + value );
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'setBuff', 'value':{stat:stat, value:value}, requestId: FFBEEquipExternalControl.requestId}), '*');
            FFBEEquipExternalControl.listeners['buffSet' + FFBEEquipExternalControl.requestId++] = resolve;
        });
    },

    'setBuffs': function(values) {
        return Promise.all(Object.keys(values).map(stat => FFBEEquipExternalControl.setBuff(stat, values[stat])));
    },

    'setPot': function(stat, value) {
        console.log("setPot " + stat + ' ' + value );
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'setPot', 'value':{stat:stat, value:value}, requestId: FFBEEquipExternalControl.requestId}), '*');
            FFBEEquipExternalControl.listeners['potSet' + FFBEEquipExternalControl.requestId++] = resolve;
        });
    },

    'setPots': function(values) {
        return Promise.all(Object.keys(values).map(stat => FFBEEquipExternalControl.setPot(stat, values[stat])));
    },

    'setMonsterStats': function (baseDef, baseSpr, defBreak = 0, sprBreak = 0, defBuff = 0, sprBuff = 0) {
        console.log(`setMonsterStats ${baseDef} ${baseSpr} ${defBreak} ${sprBreak} ${defBuff} ${sprBuff}`);
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({
                'type':'setMonsterStats',
                'value':{
                    baseDef:baseDef,
                    baseSpr:baseSpr,
                    defBreak: defBreak,
                    sprBreak: sprBreak,
                    defBuff: defBuff,
                    sprBuff: sprBuff
                }
            }), '*');
            FFBEEquipExternalControl.listeners.monsterStatsSet = resolve;
        });
    },

    'setMonsterElementalResist': function(element, value) {
        console.log("setMonsterElementalResist " + element + ' ' + value );
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'setMonsterElementalResist', 'value':{element:element, value:value}, requestId: FFBEEquipExternalControl.requestId}), '*');
            FFBEEquipExternalControl.listeners['monsterElementalResistSet' + FFBEEquipExternalControl.requestId++] = resolve;
        });
    },

    'setMonsterElementalResists': function(values) {
        return Promise.all(Object.keys(values).map(element => FFBEEquipExternalControl.setMonsterElementalResist(element, values[element])));
    },

    'setMonsterRaces': function(races) {
        console.log("setMonsterRaces " + JSON.stringify(races));
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'setMonsterRaces', 'value':races}), '*');
            FFBEEquipExternalControl.listeners.monsterRacesSet = resolve;
        });
    },

    'checkOption': function(optionName) {
        if (FFBEEquipExternalControl.checkboxList.includes(optionName)) {
            console.log("checkOption " + optionName);
            return new Promise(function (resolve) {
                FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({
                    'type': 'checkOption',
                    'value': optionName,
                    requestId: FFBEEquipExternalControl.requestId
                }), '*');
                FFBEEquipExternalControl.listeners['optionChecked' + FFBEEquipExternalControl.requestId++] = resolve;
            });
        } else {
            alert("Unknown checkbox name: " + optionName);
        }
    },

    'uncheckOption': function(optionName) {
        if (FFBEEquipExternalControl.checkboxList.includes(optionName)) {
            console.log("uncheckOption " + optionName);
            return new Promise(function (resolve) {
                FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({
                    'type': 'uncheckOption',
                    'value': optionName,
                    requestId: FFBEEquipExternalControl.requestId
                }), '*');
                FFBEEquipExternalControl.listeners['optionUnchecked' + FFBEEquipExternalControl.requestId++] = resolve;
            });
        } else {
            alert("Unknown checkbox name: " + optionName);
        }
    },
    
    'selectGoal': function(goal) {
        console.log("selectGoal " + goal );
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'selectGoal', 'value':goal, requestId: FFBEEquipExternalControl.requestId}), '*');
            FFBEEquipExternalControl.listeners['goalChanged' + FFBEEquipExternalControl.requestId++] = resolve;
        });
    },
    
    'build': function() {
        console.log("build");
        return new Promise(function(resolve) {
            FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'build', 'value':''}), '*');
            FFBEEquipExternalControl.listeners.buildFinished = resolve;
        });
    },
    
    'handleMessage': function(message) {
        //if(message.origin === 'https://ffbeEquip.com'){
            let data = JSON.parse(message.data);
            console.log('received Message : ' + data.type);
            if (FFBEEquipExternalControl.listeners[data.type]) {
                FFBEEquipExternalControl.listeners[data.type](data.value);
                FFBEEquipExternalControl.listeners[data.type] = null;
            }
        //}
    },
    
    'listeners': {
    },
    
    
}
