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
    'weaponEnhancementList': [
        "rare_3", "rare_4",
        "hp_15", "hp_12", "hp_10", "hp_7", "hp_5", "hp_3", "hp_1",
        "mp_15", "mp_12", "mp_10", "mp_7", "mp_5", "mp_3", "mp_1",
        "atk_15", "atk_12", "atk_10", "atk_7", "atk_5", "atk_3", "atk_1",
        "def_15", "def_12", "def_10", "def_7", "def_5", "def_3", "def_1",
        "mag_15", "mag_12", "mag_10", "mag_7", "mag_5", "mag_3", "mag_1",
        "spr_15", "spr_12", "spr_10", "spr_7", "spr_5", "spr_3", "spr_1",
        "autoRegen_4", "autoRegen_3","autoRegen_2","autoRegen_1",
        "autoRefresh_2", "autoRefresh_1",
        "autoProtect_5", "autoProtect_4","autoProtect_3","autoProtect_2","autoProtect_1",
        "autoShell_5", "autoShell_4" ,"autoShell_3" ,"autoShell_2" ,"autoShell_1"
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
    
    'setDefaultEnhancements': function(enhancements) {
        if (Array.isArray(enhancements) && enhancements.every(e => FFBEEquipExternalControl.weaponEnhancementList.includes(e))) {
            return new Promise(function(resolve) {
                FFBEEquipExternalControl.iframe.contentWindow.postMessage(JSON.stringify({'type':'setDefaultEnhancements', 'value':enhancements}), '*');
                FFBEEquipExternalControl.listeners.defaultEnhancementsSet = resolve;
            });
        } else {
            alert('enhancements must be an array of valid enhancements value.');
        }
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
