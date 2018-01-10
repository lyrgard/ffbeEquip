class Piramidata {

    static getPiramidataImageLink(unitBuild) {
        var link = "http://ffbe.piramidata.eu/Unit/GetConfigurationImage?" +
            "unitname=" + encodeURIComponent(unitBuild.unit.name) + 
            "&rarity=" + unitBuild.unit.max_rarity +
            "&pothp=" + unitBuild.baseValues.hp.pots +
            "&potmp=" + unitBuild.baseValues.mp.pots +
            "&potatk=" + unitBuild.baseValues.atk.pots +
            "&potdef=" + unitBuild.baseValues.def.pots +
            "&potmag=" + unitBuild.baseValues.mag.pots +
            "&potspr=" + unitBuild.baseValues.spr.pots;
        if (unitBuild.build[10]) {
            link += "&espername=" + encodeURIComponent(Piramidata.getEsperName(unitBuild)) + 
                "&esperhp=" + unitBuild.build[10].hp + 
                "&espermp=" + unitBuild.build[10].mp +
                "&esperatk=" + unitBuild.build[10].atk +
                "&esperdef=" + unitBuild.build[10].def +
                "&espermag=" + unitBuild.build[10].mag +
                "&esperspr=" + unitBuild.build[10].spr;
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
        if (unitBuild.build[10]) {
            var result = unitBuild.build[10].name + " ";
            for (var i = 0; i < unitBuild.build[10].maxLevel; i++) {
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
}