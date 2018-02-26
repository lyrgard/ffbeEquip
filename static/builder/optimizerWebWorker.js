importScripts('../constants.js');
importScripts('common.js');
importScripts('unitBuild.js');
importScripts('treeComparator.js');
importScripts('esperTreeComparator.js');
importScripts('itemTreeComparator.js');
importScripts('buildOptimizer.js');


var optimizer = null;
var number;

onmessage = function(event) {
    var messageData = JSON.parse(event.data);
    switch(messageData.type) {
        case "init":
            optimizer = new BuildOptimizer(messageData.espers, messageData.allItemVersions);
            number = messageData.number;
            break;
        case "setData":
            var unitBuild = new UnitBuild(messageData.unit, messageData.fixedItems, messageData.baseValues);
            unitBuild.innateElements = messageData.innateElements,
            unitBuild.formula = messageData.formula;
            optimizer.unitBuild = unitBuild;
            optimizer.dataByType = messageData.dataByType;
            optimizer.dataWithCondition = messageData.dataWithCondition;
            optimizer.dualWieldSources = messageData.dualWieldSources;
            optimizer.ennemyStats = messageData.ennemyStats;
            optimizer.useEspers = messageData.useEspers;
            optimizer.alreadyUsedEspers = messageData.alreadyUsedEspers;
            break;
        case "optimize":
            optimizer.optimizeFor(
                messageData.typeCombinations, 
                function(build, value) {
                    postMessage(JSON.stringify({"type":"betterBuildFound","build":build,"value":value}));
                }
            );
            postMessage(JSON.stringify({"type":"finished", "number":number}));
            break;
    }
}