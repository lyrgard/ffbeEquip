importScripts('../constants.js');
importScripts('common.js');
importScripts('unitBuild.js');
importScripts('treeComparator.js');
importScripts('esperTreeComparator.js');
importScripts('itemTreeComparator.js');
importScripts('buildOptimizer.js');


var optimizer = null;

onmessage = function(event) {
    switch(event.data.type) {
        case "init":
            optimizer = new BuildOptimizer(event.data.espers, event.data.allItemVersions);
            console.log("worker ready");
            break;
        case "setData":
            console.log("unitSelected received");
            var unitBuild = new UnitBuild(event.data.unit, event.data.fixedItems, event.data.baseValues);
            unitBuild.formula = event.data.formula;
            optimizer.unitBuild = unitBuild;
            optimizer.dataByType = event.data.dataByType;
            optimizer.dataWithCondition = event.data.dataWithCondition;
            optimizer.dualWieldSources = event.data.dualWieldSources;
            break;
        case "optimize":
            console.log("optimize received");
            optimizer.optimizeFor(
                event.data.typeCombinations, 
                event.data.alreadyUsedItems, 
                event.data.alreadyUsedEspers,
                function(numberCalculated) {
                    postMessage({"type":"incrementCalculated","numberCalculated":numberCalculated})
                },
                function(build, value) {
                    postMessage({"type":"betterBuildFound","build":build,"value":value});
                },
                event.data.ennemyStats
            );
            postMessage({"type":"finished"});
            break;
    }
}