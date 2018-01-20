class EsperTreeComparator {
    
    static sort(espers, alreadyUsedEspers, involvedStats, ennemyStats) {
        var keptEsperRoot = {"parent":null,"children":[],"root":true};
        for (var index = 0, len = espers.length; index < len; index++) {
            if (!alreadyUsedEspers.includes(espers[index].name)) {
                var newTreeEsper = {"esper":espers[index],"parent":null,"children":[],"equivalents":[]};
                TreeComparator.insertItemIntoTree(keptEsperRoot, newTreeEsper, involvedStats, ennemyStats, null, 1, EsperTreeComparator.getComparison, EsperTreeComparator.getDepth);
            }
        }
        return keptEsperRoot;
    }
    
    static getComparison(treeNode1, treeNode2, stats, ennemyStats) {
        if (treeNode1.root) {
            return "strictlyWorse"; 
        }
        var comparisionStatus = [];
        for (var index = stats.length; index--;) {
            if (baseStats.includes(stats[index])) {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, stats[index]));
            } else if (stats[index] == "physicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(treeNode1.esper, treeNode2.esper,"physical", ennemyStats.races));
            } else if (stats[index] == "magicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(treeNode1.esper, treeNode2.esper,"magical", ennemyStats.races));
            } else if (stats[index].startsWith("resist")) {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, stats[index]));
            }
        }
        return TreeComparator.combineComparison(comparisionStatus);
    }

    static getDepth(treeItem, currentDepth) {
        return currentDepth + 1;
    }
}