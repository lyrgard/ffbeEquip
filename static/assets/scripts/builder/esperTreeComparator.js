class EsperTreeComparator {
    
    static sort(espers, alreadyUsedEspers, involvedStats, ennemyStats) {
        var keptEsperRoot = {"parent":null,"children":[],"root":true};
        for (var index in espers) {
            if (!alreadyUsedEspers.includes(espers[index].id)) {
                var newTreeEsper = {"esper":espers[index],"parent":null,"children":[],"equivalents":[]};
                TreeComparator.insertItemIntoTree(keptEsperRoot, newTreeEsper, involvedStats, ennemyStats, null, null, 1, EsperTreeComparator.getComparison, EsperTreeComparator.getDepth);
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
                var coef1 = 1;
                var coef2 = 1;
                if (treeNode1.esper.esperStatsBonus && treeNode1.esper.esperStatsBonus.all[stats[index]]) {
                    coef1 += treeNode1.esper.esperStatsBonus.all[stats[index]] / 100;
                }
                if (treeNode2.esper.esperStatsBonus && treeNode2.esper.esperStatsBonus.all[stats[index]]) {
                    coef2 += treeNode2.esper.esperStatsBonus.all[stats[index]] / 100;
                }
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, stats[index], coef1, coef2));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, percentValues[stats[index]]));
            } else if (stats[index] == "physicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(treeNode1.esper, treeNode2.esper,"physical", ennemyStats.races));
            } else if (stats[index] == "magicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(treeNode1.esper, treeNode2.esper,"magical", ennemyStats.races));
            } else if (stats[index].startsWith("resist")) {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, stats[index]));
            } else if (stats[index] == "lbPerTurn") {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, "lbPerTurn.min"));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, "lbFillRate"));
            } else if (stats[index] == "lbDamage") {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, "lbDamage"));
            } else if (stats[index] == "evade.physical" || stats[index] == "evade.magical") {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.esper, treeNode2.esper, stats[index]));
            }
        }
        return TreeComparator.combineComparison(comparisionStatus);
    }

    static getDepth(treeItem, currentDepth) {
        return currentDepth + 1;
    }
}
