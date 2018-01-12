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
            optimizer = new BuildOptimizer(event.data.data, event.data.espers);
            console.log("worker ready");
            break;
        case "unitSelected":
            console.log("unitSelected received");
            optimizer.unitBuild = event.data.unitBuild;
            break;
        case "optimize":
            console.log("optimize received");
            optimizer.optimizeFor(
                event.data.typeCombinations, 
                event.data.alreadyUsedItems, 
                event.data.alreadyUsedEspers,
                event.data.ennemyStats,
                function(numberCalculated) {
                    postMessage({"type":"incrementCalculated","numberCalculated":numberCalculated})
                },
                function(build, value) {
                    postMessage({"type":"betterBuildFound","build":build,"value":value})
                });
            break;
    }
}