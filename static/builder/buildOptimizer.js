class BuildOptimizer {
    constructor(allItemVersions, buildCounterUpdateCallback) {
        this.allItemVersions = allItemVersions;
        this.goalVariation = "avg";
        this._alreadyUsedEspers = [];
        this.buildCounter = 0;
        this.buildCounterUpdateCallback = buildCounterUpdateCallback;
        this.typeByIndex = {
            0: 'weapon',
            1: 'weapon',
            2: 'head',
            3: 'body',
            4: 'accessory',
            5: 'accessory',
            6: 'materia',
            7: 'materia',
            8: 'materia',
            9: 'materia'
        };
        this.alreadyTried = [];
        this.equipableBySlot = {};
        this.dataByType;
    }
    
    
    
    set unitBuild(unitBuild) {
        this._unitBuild = unitBuild;
        this._unitBuild.prepareEquipable();
        for (let i = 0; i <= 10; i++) {
            this.equipableBySlot[i] = this._unitBuild.equipable[i].join('_');
        }
    }
    
    set itemPools(dataByType) {
        this._itemPools = {};
        this.dataByType = dataByType;
    }
    
    getItemPoolForSlot(i) {
        if (this._itemPools[this.equipableBySlot[i]]) {
            return this._itemPools[this.equipableBySlot[i]];
        } else {
            var itemPool = new ItemPool(4, this._unitBuild.involvedStats, this.ennemyStats, this.desirableElements, [], []);
            this.equipableBySlot[i].split('_').forEach(type => {
                itemPool.addItems(this.dataByType[type]);    
            });
            itemPool.prepare();
            this._itemPools[this.equipableBySlot[i]] = itemPool;
            return itemPool;
        }
    }
    
    set alreadyUsedEspers(alreadyUsedEspers) {
        this._alreadyUsedEspers = alreadyUsedEspers;
    }
    
    optimizeFor(betterBuildFoundCallback) {
        this.buildCounter = 0;
        this.betterBuildFoundCallback = betterBuildFoundCallback;
        
        
        var build = [null, null, null, null, null, null, null, null, null, null,null];
        this.findBestBuild(9, build);
        this.buildCounterUpdateCallback(this.buildCounter);
    }
    
    findBestBuild(index, build) {
        if (this._unitBuild.fixedItems[index]) {
            this.tryItem(index, build, this._unitBuild.fixedItems[index]);
        } else {
            let itemPool = this.getItemPoolForSlot(index);
            var foundAnItem = false;
            for (var i = itemPool.keptItems.length; i--;) {
                if (itemPool.keptItems[i].active) {
                    var item = itemPool.take(i);
                    console.log(`${index} - ${item.name}`);
                    this.tryItem(index, build, item);
                    itemPool.putBack(i);
                    foundAnItem = true;
                }
            }

            if (!foundAnItem) {
                this.tryItem(index, build, null);
            }
            build[index] == null;
        }
    }

    tryItem(index, build, item) {
        build[index] = item;
        if (index == 0) {
            var value = calculateBuildValueWithFormula(build, this._unitBuild, this.ennemyStats, this._unitBuild.formula, this.goalVariation, this.useNewJpDamageFormula);
            if ((value != -1 && this._unitBuild.buildValue[this.goalVariation] == -1) || value[this.goalVariation] > this._unitBuild.buildValue[this.goalVariation]) {
            
                this._unitBuild.build = build.slice();
                if (value.switchWeapons) {
                    var tmp = this._unitBuild.build[0];
                    this._unitBuild.build[0] = this._unitBuild.build[1];
                    this._unitBuild.build[1] = tmp;       
                }
                this._unitBuild.buildValue = value;
                this.betterBuildFoundCallback(this._unitBuild.build, this._unitBuild.buildValue, 0);
            }
            let tried = build.map(item => item ? item.name : 'null').join('__');
            if (this.alreadyTried.includes(tried)) {
                console.log('Already tried : ' + tried);
            } else {
                this.alreadyTried.push(tried)
            }
            this.buildCounter++;
            if (this.buildCounter % 500 === 0) {
                postMessage(JSON.stringify({"type":"buildCounterUpdate", "counter":this.buildCounter}));
                this.buildCounter = 0;
            }
        } else {
            this.findBestBuild(index - 1, build);
        }
    }
}
