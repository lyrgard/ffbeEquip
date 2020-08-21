class Piramidata {

    static getImageLink(unitBuild) {
        var link = "http://www.kupoconfig.com/Unit/GetConfigurationImage?" +
            "unitname=" + encodeURIComponent(unitBuild.unit.name) + 
            "&rarity=" + unitBuild.unit.max_rarity +
            "&pothp=" + unitBuild.baseValues.hp.pots +
            "&potmp=" + unitBuild.baseValues.mp.pots +
            "&potatk=" + unitBuild.baseValues.atk.pots +
            "&potdef=" + unitBuild.baseValues.def.pots +
            "&potmag=" + unitBuild.baseValues.mag.pots +
            "&potspr=" + unitBuild.baseValues.spr.pots;
        if (unitBuild.build[11]) {
            link += "&espername=" + encodeURIComponent(Piramidata.getEsperName(unitBuild)) + 
                "&esperhp=" + unitBuild.build[11].hp * 100 + 
                "&espermp=" + unitBuild.build[11].mp  * 100+
                "&esperatk=" + unitBuild.build[11].atk  * 100+
                "&esperdef=" + unitBuild.build[11].def  * 100+
                "&espermag=" + unitBuild.build[11].mag  * 100+
                "&esperspr=" + unitBuild.build[11].spr * 100;
        } else {
            link += "&esperhp=0&espermp=0&esperatk=0&esperdef=0&espermag=0&esperspr=0";
        }
        link += "&rhand=" + Piramidata.getItemId(unitBuild, 0) +
            "&lhand=" + Piramidata.getItemId(unitBuild, 1) +
            "&head=" + Piramidata.getItemId(unitBuild, 2) +
            "&body=" + Piramidata.getItemId(unitBuild, 3) +
            "&acc1=" + Piramidata.getItemId(unitBuild, 4) +
            "&acc2=" + Piramidata.getItemId(unitBuild, 5) +
            "&ability1=" + Piramidata.getItemId(unitBuild, 6) +
            "&ability2=" + Piramidata.getItemId(unitBuild, 7) +
            "&ability3=" + Piramidata.getItemId(unitBuild, 8) +
            "&ability4=" + Piramidata.getItemId(unitBuild, 9) +
            "&enh1=" + encodeURIComponent(Piramidata.getEnhancementSkill(unitBuild, 0)) +
            "&enh2=" + encodeURIComponent(Piramidata.getEnhancementSkill(unitBuild, 1)) +
            "&enh3=" + encodeURIComponent(Piramidata.getEnhancementSkill(unitBuild, 2)) +
            "&enh4=" + encodeURIComponent(Piramidata.getEnhancementSkill(unitBuild, 3)) +
            "&enh5=" + encodeURIComponent(Piramidata.getEnhancementSkill(unitBuild, 4)) +
            "&enh6=" + encodeURIComponent(Piramidata.getEnhancementSkill(unitBuild, 5));
        return link;
    }

    static getItemId(unitBuild, slot) {
        if (unitBuild.build[slot] && !unitBuild.build[slot].placeHolder) {
            return unitBuild.build[slot].id;
        } else {
            return "0";
        }
    }

    static getEnhancementSkill(unitBuild, index) {
        if (unitBuild.unit.enhancementSkills && unitBuild.unit.enhancementSkills.length > index) {
            return unitBuild.unit.enhancementSkills[index] + " Awk+2";
        } else {
            return "";
        }
    }

    static getEsperName(unitBuild) {
        if (unitBuild.build[11]) {
            var result = unitBuild.build[11].name + " ";
            for (var i = 0; i < unitBuild.build[11].maxLevel; i++) {
                result += "★";
            }
            return result;
        } else {
            return "";
        }
    } 
}


class FFBEBen {
    static getFFBEBenImageLink(unitBuild) {
        var hash = "";
        hash += Number(unitBuild.unit.id).toString(36);
        for (var i = 0; i < 10; i++) {
            item = unitBuild.build[i];
            if (item) {
                hash += Number(item.id).toString(36);
            } else {
                hash += 999999999..toString(36);
            }
        }
        return "http://ffbeben.ch/" + hash + ".png";
    }
}
