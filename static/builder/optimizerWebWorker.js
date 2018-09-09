importScripts('../constants.js');
importScripts('common.js');
importScripts('unitBuild.js');
importScripts('treeComparator.js');
importScripts('esperTreeComparator.js');
importScripts('itemTreeComparator.js');
importScripts('buildOptimizer.js');
importScripts('ennemyStats.js');


var optimizer = null;
var number;
var server;
var useNew400Cap;

onmessage = function(event) {
    var messageData = JSON.parse(event.data);
    switch(messageData.type) {
        case "init":
            optimizer = new BuildOptimizer(messageData.allItemVersions);
            number = messageData.number;
            break;
        case "setData":
            var unitBuild = new UnitBuild(messageData.unit, messageData.fixedItems, messageData.baseValues);
            server = messageData.server;
            useNew400Cap = messageData.useNew400Cap;
            unitBuild.setLevel(messageData.level),
            unitBuild.innateElements = messageData.innateElements,
            unitBuild.formula = messageData.formula;
            optimizer.unitBuild = unitBuild;
            optimizer.dataByType = messageData.dataByType;
            optimizer.dataWithCondition = messageData.dataWithCondition;
            optimizer.dualWieldSources = messageData.dualWieldSources;
            optimizer.ennemyStats = messageData.ennemyStats;
            optimizer.useEspers = messageData.useEspers;
            optimizer.espers = messageData.espers;
            optimizer.alreadyUsedEspers = messageData.alreadyUsedEspers;
            optimizer.goalVariation = messageData.goalVariation;
            optimizer.useNewJpDamageFormula = messageData.useNewJpDamageFormula;
            break;
        case "optimize":
            optimizer.optimizeFor(
                messageData.typeCombinations, 
                function(build, value, freeSlots) {
                    postMessage(JSON.stringify({"type":"betterBuildFound","build":build,"value":value, "freeSlots": freeSlots}));
                }
            );
            postMessage(JSON.stringify({"type":"finished", "number":number}));
            break;
    }
}