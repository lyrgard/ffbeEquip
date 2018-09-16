importScripts('../constants.js?4');
importScripts('common.js?4');
importScripts('unitBuild.js?4');
importScripts('treeComparator.js?4');
importScripts('esperTreeComparator.js?4');
importScripts('itemTreeComparator.js?4');
importScripts('buildOptimizer.js?4');
importScripts('ennemyStats.js?4');


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
            optimizer.desirableElements = messageData.desirableElements;
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