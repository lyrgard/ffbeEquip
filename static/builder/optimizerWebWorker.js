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
    switch(event.data.type) {
        case "init":
            optimizer = new BuildOptimizer(event.data.espers, event.data.allItemVersions);
            number = event.data.number;
            break;
        case "setData":
            var unitBuild = new UnitBuild(event.data.unit, event.data.fixedItems, event.data.baseValues);
            unitBuild.formula = event.data.formula;
            optimizer.unitBuild = unitBuild;
            optimizer.dataByType = event.data.dataByType;
            optimizer.dataWithCondition = event.data.dataWithCondition;
            optimizer.dualWieldSources = event.data.dualWieldSources;
            optimizer.ennemyStats = event.data.ennemyStats;
            optimizer.alreadyUsedEspers = event.data.alreadyUsedEspers;
            break;
        case "optimize":
            optimizer.optimizeFor(
                event.data.typeCombinations, 
                function(numberCalculated) {
                    postMessage({"type":"incrementCalculated","numberCalculated":numberCalculated})
                },
                function(build, value) {
                    postMessage({"type":"betterBuildFound","build":build,"value":value});
                }
            );
            postMessage({"type":"finished", "number":number});
            break;
    }
}