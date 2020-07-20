var wikiBaseUrl = "http://exvius.gamepedia.com/",
    data,
    units,
    ownedUnits,
    itemInventory,
    ownedEspers,
    stat = '',
    types = [],
    elements = [],
    ailments = [],
    killers = [],
    accessToRemove = [],
    additionalStat = [],
    searchText = '',
    selectedUnitId = 0,
    server = "GL",
    language = "",
    saveTimeout,
    saveNeeded,
    savePublicLinkTimeout,
    savePublicLinkNeeded = false,
    mustSaveUnits = false,
    mustSaveInventory = false,
    mustSaveEspers = false,
    userSettings,
    lazyLoader = (window.LazyLoad) ? new LazyLoad({ elements_selector: 'img.lazyload' }) : null;

let isMobile = window.matchMedia("only screen and (max-width: 991px)").matches;

/* Request / Cancel Idle Callbacks ----------------------------------------------------------------- */

window.requestIdleCallback = window.requestIdleCallback ||
  function (cb) {
    var start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  }

window.cancelIdleCallback = window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  }

/* Check if localStorage is enable and available - Adapted from https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js */

var localStorageAvailable = function(){
  var enabled = false;
  if (window.localStorage) {
    var test = "test";
    try {
      localStorage.setItem(test, test);
      enabled = test === localStorage.getItem(test);
      localStorage.removeItem(test);
    } catch(e) {
      enabled = false;
    }
  }

  return enabled;
}();

/* Functions for Setting, Loading, and Toggling Themes --------------------------------------------- */

function setTheme(theme) {
  if (localStorageAvailable) {
    localStorage.setItem("theme", theme);
  }

  var themeRemove = 'ffbe_theme--game ffbe_theme--dark',
      themeAdd    = '';

  if (theme == 'dark') {
    themeRemove = 'ffbe_theme--game';
    themeAdd    = 'ffbe_theme--dark';
  } else if (theme == 'game') {
    themeRemove = 'ffbe_theme--dark';
    themeAdd    = 'ffbe_theme--game';
  }

  // Unset the Theme
  $('#themeSelector label').removeClass('active');
  $('#themeSelector input').attr('checked', false);

  $('#themeSelector #' + theme).attr('checked', true, function() {
    $(this).parent().addClass('active');
  });

  $('body').removeClass(themeRemove).addClass(themeAdd);
}

function loadTheme() {
  let theme = 'light';

  if (localStorageAvailable && localStorage.getItem("theme") === 'dark') {
    theme = 'dark';
  } else if (localStorageAvailable && localStorage.getItem("theme") === 'game') {
    theme = 'game';
  }

  setTheme(theme);
}

function onThemeChange() {
  var newTheme = $('#themeSelector input:checked').val();
  setTheme(newTheme);
}

function toggleTheme() {
  let theme = 'light';

  if ($('body').hasClass('ffbe_theme--dark')) {
    theme = 'game';
  } else if ($('body').hasClass('ffbe_theme--game')) {
    theme = 'dark';
  }

  setTheme(theme);
}

/* Functions for Setting, Loading, and Switching Languages ----------------------------------------- */

function switchTo(newServer) {
    if (newServer != server) {
        var serverParam = "";
        if (newServer == "JP") {
            serverParam = "?server=JP";
        }
        window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + serverParam + window.location.hash;
    }
}

function switchToLanguage(newLanguage) {
    if (newLanguage != language && server != "JP") {
        var languageParam = "";
        if (newLanguage != "en") {
            languageParam = "?l=" + newLanguage;
        }
        var serverParam = "";
        if (server == "JP") {
            serverParam = "?server=JP";
        }
        window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + languageParam + serverParam + window.location.hash;
    }
}

// Output HTML snippet for Image or Icon Display (with LazyLoad Support)
function getImageHtml(item, actionOnImage = undefined, isLazy = true) {
  var html         = '',
      image        = '',
      image_class  = '',
      image_src    = '',
      image_action = '';

  // Icon Stack: Exclusive
  if (item.special && item.special.includes("notStackable")) { image_class += ' icon-stack top-left stack-exclusive'; }

  // Icon Stack: Double-Handed
  if (item.special && item.special.includes("twoHanded")) { image_class += ' icon-stack top-left stack-doublehand'; }

  // JavaScript onClick Event
  if (actionOnImage) { image_action = ' onclick="' + actionOnImage + '"'; }

  if (isLazy == true && lazyLoader !== null) {
    image_src = 'data-src';
  } else {
    image_src = 'src';
  }

  if (item.icon) {
    if (isLazy == true && lazyLoader !== null) {
      image_class += ' lazyload ';
    }

    image = '<img ' + image_src + '="/assets/game/items/' + item.icon + '" class="' + image_class + '" />';

  // no lazyload for espers (uses CSS background)
  } else if (item.type == "esper") {
    image = '<i class="icon icon-sm esper-' + escapeName(item.name) + ' ' + image_class + '"></i>';

  // no image
  } else if (item.type == "unavailable") {

  } else {
    image = '<i class="icon icon-sm equipment-' + item.type + ' ' + image_class + '"></i>';
  }

  html = '<div class="getImageHtml"' + image_action + '>' + image + '</div>';

  return html;
}

// Output HTML snippet for Unit / Item Name
function getNameColumnHtml(item) {
    var html = '<div class="getNameColumnHtml--Name">';

    if (item.rarity) {
      html += '<span class="rarity itemRarity">' + item.rarity + '★</span> ';
    }

    if (item.placeHolder) {
        html += toLink(item.name, typeCategories[item.type]);
    } else if (item.wikiEntry) {
        html += toLink(item.name, item.wikiEntry);
    } else if (item.type == "unavailable") {
        // no name
    } else {
        html += toLink(item.name);
    }
    if (item.level) {
        html += '<span class="rarity itemLevel">level ' + item.level + '</span> ';
    }
    if (item.buildLink) {
        html += '<a href="' + item.buildLink + '" target="blank" class="buildLink"><span class="fa fa-external-link-alt wikiLink"></span></a>';
    }
    if (item.outclassedBy) {
        html += '<img src="/assets/game/icons/gil.png" class="outclassedByIcon" title="Can be sold. Strictly outclassed by ' + item.outclassedBy + '"></img>';
    }
    html += "</div>";
    if (item.jpname) {
        html += '<div>' + item.jpname + "</div>";
    }
    html += "<div class='getNameColumnHtml--Details'>";

    if (item.type != "esper" && item.type != "monster" && item.type != "fake") {
      html += '<i class="icon icon-sm equipment-' + item.type + '"></i>';
    }

    html += getStatDetail(item);
    html += '</div>';

    if (item.userPseudo) {
        html += "<div class='userPseudo'>item added by " + item.userPseudo + "</div>";
    }

    if (item.enhancements) {
        html += getEnhancements(item);
    }

    return html;
}

// Output HTML snippet for Attacks with Elemental Abilities
function getElementHtml(elements) {
  var html = '';

  for (var index in elements) {
    html += '<div class="getElementHtml"><i class="icon icon-sm element-' + elements[index] + ' icon-stack stack-sword"></i></div>';
  }

  return html;
}

// Output HTML snippet for Attacks with Ailments Abilities
function getAilmentsHtml(item) {
  var html = '';

  if (item.ailments) {
    let groupedByAilment = item.ailments.reduce((acc, ailment) => {
      let valueGroup = (acc[ailment.percent] = acc[ailment.percent] || []);
      if (!valueGroup.includes(ailment.name)) {
        valueGroup.push(ailment.name)
      }
      return acc;
    }, {});

    Object.keys(groupedByAilment).sort().reverse().forEach(percent => {
      groupedByAilment[percent].forEach(name => {
        html += '<div class="getAilmentsHtml"><i class="icon icon-sm ailment-' + name + ' icon-stack stack-sword"></i><span class="text">' + percent + '%</span></div>';
      })
    });
  }

  return html;
}

// Output HTML snippet for Resists (Elemental / Ailment) Icons
function getResistHtml(item) {
  var html_ele = '',
      html_ail = '';

  if (item.resist) {

    // Get Elemental Resistances
    let groupedByElementResist = item.resist.filter(resist => elementList.includes(resist.name)).reduce((acc, resist) => {
      let valueGroup = (acc[resist.percent] = acc[resist.percent] || []);
      if (!valueGroup.includes(resist.name)) {
        valueGroup.push(resist.name)
      }
      return acc;
    }, {});

    // Get Ailment Resistances
    let groupedByAilmentResist = item.resist.filter(resist => ailmentList.includes(resist.name)).reduce((acc, resist) => {
      let valueGroup = (acc[resist.percent] = acc[resist.percent] || []);
      if (!valueGroup.includes(resist.name)) {
        valueGroup.push(resist.name)
      }
      return acc;
    }, {});

    // Build Elemental Resistance Output
    Object.keys(groupedByElementResist).sort().reverse().forEach(percent => {
      groupedByElementResist[percent].forEach(name => {
        html_ele += '<div class="groupedByElementResist"><i class="icon icon-sm element-' + name + ' icon-stack stack-shield"></i><span class="text">' + percent + '%</span></div>';
      })
    });

    // Build Elemental Resistance Output
    Object.keys(groupedByAilmentResist).sort().reverse().forEach(percent => {
      groupedByAilmentResist[percent].forEach(name => {
        html_ail += '<div class="groupedByAilmentResist"><i class="icon icon-sm ailment-' + name + ' icon-stack stack-shield"></i><span class="text">' + percent + '%</span></div>';
      })
    });
  }

  return html_ele + html_ail;
}

// Output HTML snippet for Killer (Magical / Physical) Icons
function getKillersHtml(item) {
  var html      = '',
      html_phys = '',
      html_mag  = '';

  $(item.killers).each(function(index, killer) {
    if (killer.physical) {
      html_phys += '<div class="getKillersHtml killer-physical">';
      html_phys += '  <span class="icon icon-sm killer-physical-' + killer.name + '" title="' + killer.name + '"></span>';
      html_phys += '  <span class="text">' + killer.physical + '%</span>';
      html_phys += '</div>';
    }

    if (killer.physical) {
      html_mag += '<div class="getKillersHtml killer-magical">';
      html_mag += '  <span class="icon icon-sm killer-magical-' + killer.name + '" title="' + killer.name + '"></span>';
      html_mag += '  <span class="text">' + killer.magical + '%</span>';
      html_mag += '</div>';
    }
  });

  htnl += html_phys + html_mag;

  return html;
}

// Output HTML snippet for Unit Exclusivity
function getExclusiveUnitsHtml(item) {
  var first = true,
      unit_list = '';

  item.exclusiveUnits.forEach(exclusiveUnitId => {
    if (first) {
      first = false;
    } else {
      unit_list += ", ";
    }

    if (units[exclusiveUnitId]) {
      unit_list += toUnitLink(units[exclusiveUnitId]);
    } else {
      unit_list += "Not released yet unit";
    }
  });

  return '<div class="getExclusiveUnitsHtml">Only ' + unit_list + '</div>';
}


function toUnitLink(unit) {
  return '<a href="' + toUrl(unit.name) + '" target="_blank" class="unitLink" rel="noreferrer" onclick="event.stopPropagation();" title="' + unit.name + '"><img src="' + getMaxRarityUnitIcon(unit) + '"/></a>'
}

function getMaxRarityUnitIcon(unit) {
  return '/assets/game/units/unit_icon_' + unit.id.substr(0, unit.id.length -1) + (unit.max_rarity == 'NV' ? '7' : unit.max_rarity) + '.png';
}

function getSpecialHtml(item) {
	var special = [],
			html    = "";

  if (item.element)  { special.push(getElementHtml(item.element)); }
  if (item.ailments) { special.push(getAilmentsHtml(item)); }
  if (item.resist)   { special.push(getResistHtml(item)); }

  if (item.killers) {
    let killers = getKillerHtml(item.killers);
        special.push(killers.physical);
        special.push(killers.magical);
  }

  if (item.special && item.special.includes("dualWield")) {
    special.push(toHtml("[Dual Wield|ability_72.png]"));
  }

  if (item.partialDualWield) {
    var itemDual = '';
    for (var index in item.partialDualWield) {
      itemDual += "<i class='icon icon-sm equipment-" + item.partialDualWield[index] + "'></i>";
    }

    special.push(toHtml("[Dual Wield|ability_72.png] of ") + itemDual);
  }

  if (item.allowUseOf) {
    if (Array.isArray(item.allowUseOf)) {
      special.push('Allow use of ' + item.allowUseOf.map(allowUseOf => "<i class='icon icon-sm equipment-" + allowUseOf + " inline'></i>").join(", "));
    } else {
      special.push('Allow use of <i class="icon icon-sm equipment-' + item.allowUseOf + '"></i>');
    }
  }

  if (item.conditional) {
    special.push(getConditionalHtml(item.conditional));
  }

  if (item.evade) {
    if (item.evade.physical) {
      special.push('Evade Physical attacks ' + item.evade.physical + '%');
    }

    if (item.evade.magical) {
      special.push('Evade Magical attacks ' + item.evade.magical + '%');
    }
  }

  if (item.singleWielding) {
    for (var index in baseStats) {
      if (item.singleWielding[baseStats[index]]) {
        special.push('Increase equipment ' + baseStats[index].toUpperCase() + " (" + item.singleWielding[baseStats[index]] + "%) when single wielding");
      }
    }
  }

  if (item.singleWieldingOneHanded) {
    for (var index in baseStats) {
      if (item.singleWieldingOneHanded[baseStats[index]]) {
        special.push('Increase equipment ' + baseStats[index].toUpperCase() + " (" + item.singleWieldingOneHanded[baseStats[index]] + "%) when single wielding a one-handed weapon");
      }
    }
  }

  if (item.dualWielding) {
    for (var index in baseStats) {
      if (item.dualWielding[baseStats[index]]) {
        special.push('Increase equipment ' + baseStats[index].toUpperCase() + " (" + item.dualWielding[baseStats[index]] + "%) when dual wielding");
      }
    }
  }

  if (item.accuracy) {
    special.push('Increase Accuracy (' + item.accuracy + '%)');
  }

  if (item.singleWielding && item.singleWielding.accuracy) {
    special.push('Increase Accuracy (' + item.singleWielding.accuracy + "%) when single wielding");
  }

  if (item.singleWieldingOneHanded && item.singleWieldingOneHanded.accuracy) {
    special.push('Increase Accuracy (' + item.singleWieldingOneHanded.accuracy + "%) when single wielding a one-handed wreapon");
  }

  if (item.damageVariance) {
    special.push('Damage variance from x' + item.damageVariance.min + " to x"  + item.damageVariance.max + " (average : x" + (item.damageVariance.min + item.damageVariance.max)/2 + ")");
  }

  if (item.mpRefresh) {
    special.push('Recover MP (' + item.mpRefresh + "%) per turn");
  }

  if (item.jumpDamage) {
    special.push('Increase damage dealt by jump attacks by '+ item.jumpDamage + "%");
  }

  if (item.lbFillRate) {
    special.push('Increase LB gauge fill rate (' + item.lbFillRate + "%)");
  }

  if (item.lbDamage) {
    special.push('Increase LB damage (+' + item.lbDamage + "%)");
  }

  if (item.lbPerTurn) {
    var value;
    if (item.lbPerTurn.min == item.lbPerTurn.max) {
      value = item.lbPerTurn.min;
    } else {
      value = item.lbPerTurn.min + "-" + item.lbPerTurn.max;
    }
    special.push('Increase LB gauge each turn (' + value + ")");
  }

  if (item.evoMag) {
    special.push('Increase Esper summon damage by '+ item.evoMag + "%");
  }

  if (item.esperStatsBonus) {
    Object.keys(item.esperStatsBonus).forEach(esper => {
      if (esper === 'all') {
        special.push('Increase esper\'s bonus stats (' + item.esperStatsBonus.all.hp + "%)");
      } else {
        special.push('Increase ' + esper + "'s bonus stats (" + item.esperStatsBonus[esper].hp + "%)");
      }
    });
  }

  if (item.drawAttacks) {
    special.push("+" + item.drawAttacks + "% draw attacks");
  }

  if (item.breakability && (item.breakability.atk || item.breakability.def || item.breakability.mag || item.breakability.spr)) {
    special.push('Vulnerable to <span class="uppercase">' + baseStats.filter(s => item.breakability[s]).join("/") + '</span> breaks');
  }

  if (item.guts) {
    special.push('' + item.guts.chance + '% chance to set HP to 1 upon fatal damage, if HP was above ' + item.guts.ifHpOver + '% (max '+ item.guts.time +' times)');
  }

  if (item.evokeDamageBoost) {
    Object.keys(item.evokeDamageBoost).forEach(e => {
      if (e === 'all') {
        special.push('+' + item.evokeDamageBoost[e] + '% damage for esper summons and evoke skills');
      } else {
        special.push('+' + item.evokeDamageBoost[e] + '% ' + e + ' summon damage');
      }
    });
  }

  if (item.counterSkills) {
    item.counterSkills.forEach(counter => {
      var itemCounter = '';
      if (counter.maxTime) {
        itemCounter = ' (max ' + counter.maxTime + '/turn)';
      }

      special.push('<span class="d-block font-weight-bold text-uppercase text-xs">Counter ' + counter.counter + ' damage with</span><img class="icon icon-sm d-inline-block" src="/assets/game/items/' + counter.skill.icon + '">' + toLink(counter.skill.name) + '<br />' + counter.skill.effects.map(effect => effect.desc).join(', ') + itemCounter);
    });
  }

  if (item.skills) {
    item.skills.forEach(skill => {
      special.push('<img class="icon icon-sm d-inline-block" src="/assets/game/items/' + skill.icon + '">' + toLink(skill.name) + '<br />' + skill.effects.map(effect => effect.desc).join(', '));
    });
  }

  if (item.autoCastedSkills) {
    item.autoCastedSkills.forEach(skill => {
      special.push('<span class="d-block font-weight-bold text-uppercase text-xs">Cast at start of battle or when revived</span><img class="icon icon-sm d-inline-block" src="/assets/game/items/' + skill.icon + '">' + toLink(skill.name) + '<br />' + skill.effects.map(effect => effect.desc).join(', '));
    });
  }

  if (item.startOfTurnSkills) {
    item.startOfTurnSkills.forEach(skill => {
      special.push('<span class="d-block font-weight-bold text-uppercase text-xs">Cast at start of turn</span><img class="icon icon-sm d-inline-block" src="/assets/game/items/' + skill.skill.icon + '">' + toLink(skill.skill.name) + '<br />' + skill.skill.effects.map(effect => effect.desc).join(', '));
    });
  }

  if (item.special) {
    $(item.special).each(function (index, itemSpecial) {
      if (itemSpecial != "twoHanded" && itemSpecial != "notStackable" && itemSpecial != "dualWield") {
        special.push(toHtml(itemSpecial));
      }
    });
  }

  $(special).each(function(key, value) {
    if (value != "") {
      html += '<div class="list-group-item">' + value + '</div>'
    }
  });

  return html;
}

function getConditionalHtml(conditionals) {
    var html = "";
    conditionals.forEach(c => {
       if (c.equipedCondition && typeList.includes(c.equipedCondition)) {
           html += '<img class="icon" src="/assets/game/items/' + c.icon + '">';
           let first = true;
           baseStats.filter(s => c[s+'%']).forEach(s => {
               if (first) {
                   first = false;
               } else {
                   html += ', ';
               }
               html+= s.toUpperCase() + '+' + c[s+'%'] + '%';
           })
           html += ' if <i class="icon icon-sm equipment-' + c.equipedCondition + '"></i>';
       }
    });
    return html;
}

// Create an HTML span containing the stats of the item
var getStatDetail = function(item) {
    var detail = "";
    var first = true;
    var statsToDisplay = baseStats;
    if (item.type == "monster") {
        statsToDisplay = ["def", "spr"];
    }
    var statBonusCoef = 1;
    if (item.type == "esper") {
        if (item.esperStatsBonus) {
            if (item.esperStatsBonus.all) {
                statBonusCoef += item.esperStatsBonus.all["hp"] / 100;
            }
            if (item.esperStatsBonus[item.id]) {
                statBonusCoef += item.esperStatsBonus[item.id]["hp"] / 100;
            }
        }
        if (builds && builds[currentUnitIndex] && builds[currentUnitIndex].build) {
            for (var i = 0; i < builds[currentUnitIndex].build.length; i++) {
                if (i != 10) {
                    if (builds[currentUnitIndex].build[i] && builds[currentUnitIndex].build[i].esperStatsBonus) {
                        if (builds[currentUnitIndex].build[i].esperStatsBonus.all) {
                            statBonusCoef += builds[currentUnitIndex].build[i].esperStatsBonus.all["hp"] / 100;
                        }
                        if (builds[currentUnitIndex].build[i].esperStatsBonus[item.id]) {
                            statBonusCoef += builds[currentUnitIndex].build[i].esperStatsBonus[item.id]["hp"] / 100;
                        }
                    }
                }
            }
        }
        statBonusCoef = Math.min(3, statBonusCoef);
    }
    $(statsToDisplay).each(function(index, stat) {
        detail += "<span class='" + stat + "'>";

        if (item[stat]) {
            if (first) {
                first = false;
            } else {
                detail += ', ';
            }
            detail += stat + '+' + Math.floor(item[stat] * statBonusCoef);
        }
        if (item[stat+'%']) {
            if (first) {
                first = false;
            } else {
                detail += ', ';
            }
            detail += stat + '+' + item[stat+'%'] + '%';
        }

        detail += "</span>";

    });
    return '<div class="getStatDetail">' + detail + '</div>';
};

function getEnhancements(item) {
    var html = '<div class="getEnhancements">';
    var first = true;
    for (var i = 0, len = item.enhancements.length; i < len; i++) {
        if (first) {
            first = false;
            html += '<i class="icon icon-sm tab-enhance"></i><div class="stats">'
        } else {
            html += ", ";
        }
        var enhancement = item.enhancements[i];
        if (enhancement == "rare_3") {
            html += itemEnhancementLabels["rare_3"][item.type];
        } else if (enhancement == "rare_4") {
            html += itemEnhancementLabels["rare_4"][item.type];
        } else if (enhancement == "special_1") {
            html += itemEnhancementLabels["special_1"][item.id];
        } else {
            html += itemEnhancementLabels[enhancement];
        }
    }
    html += '</div></div>';
    return html;
}

function getEquipedConditionHtml(item) {
    var conditions = "";
    var first = true;
    for(var equipedConditionsIndex in item.equipedConditions) {
        if (first) {
            first = false;
        } else {
            conditions += " and ";
        }
        if (elementList.includes(item.equipedConditions[equipedConditionsIndex])) {
            conditions += "<i class='icon icon-xs mx-1 element-" + item.equipedConditions[equipedConditionsIndex] + "'></i>";
        } else {
            conditions += "<i class='icon icon-xs mx-1 equipment-" + item.equipedConditions[equipedConditionsIndex] + "'></i>";
        }
    }
    return '<div class="getEquipedConditionHtml">If equipped with ' + conditions + "</div>";
}

function displayItemLine(item, actionOnImage = "", isLazy = true) {
  var html = '';

  // type
  html += '<div class="displayItemLine_Image">';
  html += getImageHtml(item, actionOnImage, isLazy);
  html += '</div>';

  // name
  html += '<div class="displayItemLine_Name">';
  html += getNameColumnHtml(item);
  html += '</div>';

  // value
  if (item.calculatedValue) {
    html += '<div class="displayItemLine_Value">';
    html += item.calculatedValue;

    if (stat == 'inflict' || stat == 'evade' || stat == 'resist') {
      html += '%';
    }

    html += '</div>';
  }

  // special
  let special = getSpecialHtml(item);

  if (special.length != 0) {
    html += '<div class="list-group displayItemLine_Special">';
    html +=   special;
    html += '</div>';
  }

  //access
  html += '<div class="displayItemLine_Access">';
  html +=   getAccessHtml(item);
  html += '</div>';

  return html;
}

function getAccessHtml(item) {
  var html = '';

  $(item.access).each(function(index, itemAccess) {
    html += '<div class="getAccessHtml--Access';
    if (accessToRemove.length != 0 && !isAccessAllowed(accessToRemove, itemAccess)) {
      html += ' notSelected forbiddenAccess';
    }
    html += '">' + itemAccess + "</div>";
  });

  if (item.tmrUnit) {
    if (units[item.tmrUnit]) {
      html += '<div class="getAccessHtml--TMR">' + toLink(units[item.tmrUnit].name, units[item.tmrUnit].wikiEntry) + '</div>';
    } else {
      html += '<div class="getAccessHtml--TMR">TMR of not released yet unit (' + item.tmrUnit + ')</div>';
    }
  }

  if (item.stmrUnit) {
    if (units[item.stmrUnit]) {
      html += '<div class="getAccessHtml--STMR">' + toLink(units[item.stmrUnit].name) + '</div>';
    } else {
      html += '<div class="getAccessHtml--STMR">STMR of not released yet unit (' + item.stmrUnit + ')</div>';
    }
  }

  if (item.exclusiveUnits) {
    html += getExclusiveUnitsHtml(item);
  }

  if (item.exclusiveSex) {
    html += '<div class="getAccessHtml--Exclusive">Only ' + item.exclusiveSex + '</div>';
  }

  if (item.equipedConditions) {
    html += getEquipedConditionHtml(item);
  }

  return html;
}

// Some field in the data can use a special syntax to display link to the wiki. This is done by using brace ( blabla [name] blabla). This replace the parts inside braces by html links.
var toHtml = function(text) {
  var textWithAddedAnchors = text.replace(/(\[[^\]]*\])/g, function(v) {
    var vWithoutBrace = v.substring(1, v.length - 1);
    var token = vWithoutBrace.split("|");
    var result = "";

    if (token.length == 1) {
      result += '<span class="skill">' + toLink(token[0]) + '</span>';
    } else if (token.length == 2) {
      result += '<div class="skill skillWithImage">';
      result += '  <img class="icon" src="/assets/game/items/' + token[1] + '">';
      result += '  <span class="text">' + toLink(token[0]) + '</span>';
      result += '</div>';
   } else if (token.length == 3) {
      result += '<div class="skill skillWithImage">';
      result += '  <img class="icon" src="/assets/game/items/' + token[2] + '">';
      result += '  <span class="text">' + toLink(token[1], token[0]) + '</span>';
      result += '</div>';
    }

    return result;
  });

  return textWithAddedAnchors;
};

// Return the wiki url corresponding to the name
var toUrl = function(name) {
  if (name) {
    let link = wikiBaseUrl + encodeURIComponent(name.replace(/ /g, '_'));

    if (server == 'JP') {
      link += '/JP';
    }

    return link;

  }
};

var toLink = function(text, link = text, forceLinkDisplay = false) {
    if (server == "GL") {
        return text + '<a href="' + toUrl(link) + '" target="_blank" rel="noreferrer" onclick="event.stopPropagation();"><span class="fa fa-external-link-alt wikiLink"></span></a>';
    } else {
        if (forceLinkDisplay) {
            return  text + '<a href="' + toUrl(link) + '" target="_blank" rel="noreferrer" onclick="event.stopPropagation();"><span class="fa fa-external-link-alt wikiLink"></span></a>';
        } else {
            return  text;
        }

    }
}

function escapeName(string) {
    return String(string).replace(/[+%&': \(\)\.]/g, function (s) {
        return "_";
    });
}

// Function used to know if a keyboard key pressed is a number, to prevent non number to be entered
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( charCode != 37 && charCode != 39 && ((charCode > 31 && charCode < 48) || charCode > 57)) {
        return false;
    }
    return true;
};

function ucFirst(string) {
    return string ? (string.charAt(0).toUpperCase() + string.slice(1)) : undefined;
}

function isNumberOrMinus(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( charCode != 37 && charCode != 39 && ((charCode > 31 && charCode < 45) || (charCode > 54 && charCode < 48) || charCode > 57)) {
        return false;
    }
    return true;
};

function isEnter(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    return charCode == 13;
};

// Get the values for a filter type
var getSelectedValuesFor = function(type) {
    var values = [];
        $('.active>input[name='+ type +']').each(function() {
            values.push($(this).val());
        });
    return values;
};

// Selects the provided values on the filter of the provided type
function select(type, values) {
    $(values).each(function (index, value) {
        $("input[name='"+ type +"'][value='"+ value +"']").each(function(index, checkbox) {
            $(checkbox).prop('checked', true);
            $(checkbox).parent().addClass('active');
        });
    }) ;
};

function unselectAll(type) {
    $("input[name='"+ type +"']").each(function(index, checkbox) {
        $(checkbox).prop('checked', false);
        $(checkbox).parent().removeClass('active');
    });
}

function selectAll(type) {
    $("input[name='"+ type +"']").each(function(index, checkbox) {
        $(checkbox).prop('checked', true);
        $(checkbox).parent().addClass('active');
    });
}

// Add text choices to a filter. Type can be 'radio' of 'checkbox', depending if you want only one selection, or allow many.
function addTextChoicesTo(targetId, type, valueMap) {
	var target = $("#" + targetId);
	for (var key in valueMap) {
		addTextChoiceTo(target, targetId, type, valueMap[key], key);
	}
}

// Add image choices to a filter.
// valueList can be an array of values
//           or an array of object {value: '', icon: ''}
function addIconChoicesTo(targetId, valueList, type="checkbox", iconType = "", tooltipList = []) {
    // If tooltipList is function, use it to map values
    if (typeof tooltipList == 'function') tooltipList = valueList.map(tooltipList);
	var target = $("#" + targetId);
	for (i = 0; i < valueList.length; i++) {
		addIconChoiceTo(target, targetId, valueList[i], type, iconType, tooltipList[i]);
	}
}

// Add one text choice to a filter
function addTextChoiceTo(target, name, type, value, label) {
	if (name == 'simpleConditionVarious') {
		target.append('<div class="custom-control custom-switch"><input type="' + type +'" class="custom-control-input" name="' + name + '" value="'+value+'" autocomplete="off" id="' + name + '_' + value + '"><label class="custom-control-label" for="' + name + '_' + value + '">'+label+'</label></div>');
	} else {
		target.append('<label class="btn btn-primary"><input type="' + type +'" name="' + name + '" value="'+value+'" autocomplete="off">'+label+'</label>');
	}
}

// Add one image choice to a filter
function addIconChoiceTo(target, name, value, type="checkbox", iconType = "", tooltip = undefined) {
    var icon = value;
    if (typeof value === 'object') {
        icon = value.icon ? value.icon : value.value;
        value = value.value;
    }

    if (tooltip) tooltip = 'data-toggle="tooltip" title="'+tooltip+'"';
    else tooltip = ' title="'+value+'"';

    target.append('<label class="btn btn-primary iconChoice" for="'+name+'_'+value+'" '+tooltip+'>'+
                  '<input type="'+type+'" name="'+name+'" value="'+value+'" autocomplete="off" id="'+name+'_'+value+'" />'+
                  '<i class="mx-auto icon icon-sm '+iconType+'-'+icon+'"></i>'+
                  '</label>');
}

function loadInventory() {
    $.get('googleOAuthUrl', function(result) {
        Modal.show({
            title: "Google Authentication",
            body: '<p>You\'ll be redirected to a google authentication page</p>'+
                  "<p>This account is only for FFBE Equip to store your data. It will NOT link automatically to your FFBE account. You don't need to switch to Google to log in FFBE.</p>" +
                  '<p class="loginMessageDetail">'+
                    'This site is using '+
                    '<a href="https://en.wikipedia.org/wiki/OAuth" target="_blank" rel="noreferrer">OAuth2 <span class="glyphicon glyphicon-question-sign"/></a> '+
                    'to access the stored inventory data, so it will never know your google login and password.'+
                  '</p>'+
                  '<p class="loginMessageDetail">'+
                    'The data is stored on the secure FFBE Equip '+
                    '<a href="https://developers.google.com/drive/v3/web/appdata" target="_blank" rel="noreferrer">app folder on Google Drive <span class="glyphicon glyphicon-question-sign"/></a>. '+
                    'FFBE Equip can only access this folder, and no personal file.'+
                  '</p>',
            buttons: [{
                text: "Continue",
                onClick: function() {
                    // Reset localStorage on connection
                    if (localStorageAvailable) staticFileCache.clear();
                    // Redirect to GoogleAuth
                    window.location.href = result.url + "&state=" + encodeURIComponent(window.location.href.replace(".lyrgard.fr",".com"));
                }
            }]
        });
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        Modal.showErrorGet(this.url, errorThrown);
    });
}

function unloadInventory() {
    // Reset localStorage on disconnection
    if (localStorageAvailable) staticFileCache.clear();
    // Redirect to GoogleAuth
    location.href='/googleOAuthLogout';
}

function mergeArrayWithoutDuplicates(array1, array2) {
    var result = [].concat(array1);
    for (var index in array2) {
        if (!result.includes(array2[index])) {
            result.push(array2[index]);
        }
    }
    return result;
}

function chunkify(arrayIn, partCount) {
    if (partCount < 2) {
        return [arrayIn];
    }
    var len = arrayIn.length,
        out = [],
        i = 0,
        size;

    if (len % partCount === 0) {
        size = Math.floor(len / partCount);
        while (i < len) {
            out.push(arrayIn.slice(i, i += size));
        }
    } else {
        partCount--;
        size = Math.floor(len / partCount);
        if (len % size === 0) {
            size--;
        }
        while (i < size * partCount) {
            out.push(arrayIn.slice(i, i += size));
        }
        out.push(arrayIn.slice(size * partCount));
    }
    return out;
}

function switchTo(newServer) {
    if (newServer != server) {
        var serverParam = "";
        if (newServer == "JP") {
            serverParam = "?server=JP";
        }
        window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + serverParam + window.location.hash;
    }
}

function switchToLanguage(newLanguage) {
    if (newLanguage != language && server != "JP") {
        var languageParam = "";
        if (newLanguage != "en") {
            languageParam = "?l=" + newLanguage;
        }
        var serverParam = "";
        if (server == "JP") {
            serverParam = "?server=JP";
        }
        window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + languageParam + serverParam + window.location.hash;
    }
}

function readUrlParams() {
    if (window.location.href.indexOf("server=") > 0) {
        var captured = /server=([^&#]+)/.exec(window.location.href)[1];
        if (captured == "GL" || captured == "JP") {
            server = captured;
        } else {
            server = "GL";
        }
    } else {
        server = "GL";
    }
    if (window.location.href.indexOf("l=") > 0) {
        var captured = /l=([^&#]+)/.exec(window.location.href)[1];
        if (captured == "zh" || captured == "ko" || captured == "fr" || captured == "de" || captured == "es") {
            language = captured;
        }
    }
    if (server == "GL") {
        $(".switchServer .GL").addClass("active").attr('checked', true);
        $(".switchServer .JP").removeClass("active").attr('checked', false);
        $("#languages").removeClass("hidden");
        var selectedLang = language;
        if (!language) {
            selectedLang = "en"
        }
        $("#languages button[lang=" + selectedLang + "]").addClass("active");
    } else {
        $(".switchServer .JP").addClass("active").attr('checked', true);
        $(".switchServer .GL").removeClass("active").attr('checked', false);
        $("#languages").addClass("hidden");
    }
    updateLinks();
}

function updateLinks() {
    var serverParam = "";
    if (server == "JP") {
        serverParam = "?server=JP";
    }
    var languageParam = "";
        if (language && language != "en" ) {
            languageParam = "?l=" + language;
        }
    $("a[data-internal-link]").each(function(index, element) {
        var link = $(element);
        link.prop("href", link.data("internal-link") + serverParam + languageParam);
    });
    $("[data-server]").each(function(index, element) {
        var item = $(element);
        if (server == item.data("server")) {
            item.removeClass("hidden");
        } else {
            item.addClass("hidden");
        }
    });
}

class ItemFilter {
    constructor(values = [], matchAllValues = false) {
        this.values = values;
        this.matchAllValues = matchAllValues;
    }
}

// Filter the items according to the currently selected filters. Also if sorting is asked, calculate the corresponding value for each item
function filter(data, onlyShowOwnedItems = true, stat = "", baseStat = 0, searchText = "", selectedUnitId = null,
                      types = [], elements = [], ailments = [], physicalKillers = [], magicalKillers = [], accessToRemove = [],
                      additionalStat = "", showNotReleasedYet = false, showItemsWithoutStat = false) {
    var filters = [];
    if (!showItemsWithoutStat && stat.length > 0) filters.push({type: 'stat', value: stat});
    if (searchText) filters.push({type: 'text', value: searchText});
    if (additionalStat.length > 0) filters.push({type: 'stat', value: additionalStat});
    if (accessToRemove.length > 0) {
        accessToRemove = accessToRemove.flatMap(a => a.split('/'));
        let authorizedAccess = accessList.filter(a => !accessToRemove.some(forbiddenAccess => a.startsWith(forbiddenAccess) || a.endsWith(forbiddenAccess)));
        filters.push(convertValuesToFilter(authorizedAccess, 'access'));
    }
    if (magicalKillers.length > 0) filters.push(convertValuesToFilter(magicalKillers, 'magicalKiller'));
    if (physicalKillers.length > 0) filters.push(convertValuesToFilter(physicalKillers, 'physicalKiller'));
    if (ailments.length > 0) filters.push(convertValuesToFilter(ailments, 'ailment'));
    if (elements.length > 0) filters.push(convertValuesToFilter(elements, 'element'));
    if (types.length > 0) filters.push(convertValuesToFilter(types, 'type'));
    if (onlyShowOwnedItems) filters.push({type: 'onlyOwned'});

    let filter = andFilters(...filters);

    var result = filterItems(data, filter, showNotReleasedYet);
    /*for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (!onlyShowOwnedItems || itemInventory && itemInventory[item.id]) {
            if (showNotReleasedYet || !item.access.includes("not released yet") || (selectedUnitId && item.tmrUnit == selectedUnitId) || (selectedUnitId && item.stmrUnit == selectedUnitId)) {
                if (types.length == 0 || types.includes(item.type)) {
                    if (elements.length == 0 || (item.element && matches(elements, item.element)) || (elements.includes("noElement") && !item.element) || (item.resist && matches(elements, item.resist.map(function(resist){return resist.name;})))) {
                        if (ailments.length == 0 || (item.ailments && matches(ailments, item.ailments.map(function(ailment){return ailment.name;}))) || (item.resist && matches(ailments, item.resist.map(function(res){return res.name;})))) {
                            if (physicalKillers.length == 0 || hasKillers('physical', physicalKillers, item)) {
                                if (magicalKillers.length == 0 || hasKillers('magical', magicalKillers, item)) {
                                    if (accessToRemove.length == 0 || haveAuthorizedAccess(accessToRemove, item)) {
                                        if (additionalStat.length == 0 || hasStats(additionalStat, item)) {
                                            if (searchText.length == 0 || containsText(searchText, item)) {
                                                if (!selectedUnitId || !exclusiveForbidAccess(item, selectedUnitId)) {
                                                    if (stat.length == 0 || showItemsWithoutStat || hasStat(stat, item)) {
                                                        calculateValue(item, baseStat, stat, ailments, elements, killers);
                                                        result.push(item);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }*/
    result.forEach(item => calculateValue(item, baseStat, stat, ailments, elements, killers));
    return result;
};

function convertValuesToFilter(values, type, logicalAssociation = 'or') {
    let filter;
    values.forEach(v => {
        if (filter) {
            filter = {
                type: logicalAssociation,
                value1: filter,
                value2: {
                    type: type,
                    value: v
                }
            }
        } else {
            filter = {
                type: type,
                value: v
            }
        }

    });
    return filter
}

function andFilters(...filters) {
    if (filters.length === 0) {
        return {type: 'boolean', value: true};
    } else {
        let filter;
        filters.forEach(f => {
            if (filter) {
                filter = {
                    type: 'and',
                    value1: filter,
                    value2: f
                }
            } else {
                filter = f;
            }

        });
        return filter
    }
}


function filterItems(items, filter, showNotReleasedYet) {
    return items.filter(item => {
        return (showNotReleasedYet || !item.access.includes("not released yet"))
            && itemMatches(item, filter);
    });
}


function itemMatches(item, filter) {
    switch(filter.type) {
        case 'and':
            return itemMatches(item, filter.value1) && itemMatches(item, filter.value2);
        case 'or':
            return itemMatches(item, filter.value1) || itemMatches(item, filter.value2);
        case 'not':
            return !itemMatches(item, filter.value);
        case 'type':
            return filter.value === item.type;
        case 'element':
            return (item.element && item.element.includes(filter.value))
            || (filter.value === 'noElement' && !item.element)
            || (item.resist && item.resist.some(r => r.name === filter.value));
        case 'ailment':
            return (item.ailments && item.ailments.some(a => a.name === filter.value))
            || (item.resist && item.resist.some(r => r.name === filter.value));
        case 'physicalKiller':
            return item.killers && item.killers.some(k => k.name === filter.value && k.physical);
        case 'magicalKiller':
            return item.killers && item.killers.some(k => k.name === filter.value && k.magical);
        case 'access':
            return item.access && item.access.includes(filter.value);
        case 'text':
            return containsText(filter.value, item);
        case 'stat':
            return hasStat(filter.value, item);
        case 'onlyOwned':
            return itemInventory && itemInventory[item.id];
        case 'boolean':
            return filter.value;
    }
}


function hasKillers(killerType, killers, item)
{
    if (!item.killers) return false;
    // Filter killers not of specific type (magical/physical) then get only the name of remaining ones
    var itemKillers = item.killers.filter(function(killer){return killer[killerType] > 0;})
                                  .map(function(killer){return killer.name;});
    // Check matches!
    return matches(killers, itemKillers);
}

function keepOnlyOneInstance(data) {
    var dataWithOnlyOneOccurence = [];
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (dataWithOnlyOneOccurence.length > 0 && dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1].id == item.id) {
            var previousItem = dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1];
            if (previousItem.equipedConditions) {
                if (item.equipedConditions) {
                    if (previousItem.equipedConditions.length <= item.equipedConditions.length) {
                        dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1] = item;
                    }
                }
            } else {
                dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1] = item;
            }
        } else {
            dataWithOnlyOneOccurence.push(item);
        }
    }
    return dataWithOnlyOneOccurence;
}

// Sort by calculated value (will be 0 if not sort is asked) then by name
var sort = function(items, unitId) {
    return items.sort(function (item1, item2){
        if (unitId) {
            if (item1.tmrUnit == unitId) {
                if (item2.tmrUnit != unitId) {
                    return -1;
                }
            } else if (item2.tmrUnit == unitId) {
                if (item1.tmrUnit != unitId) {
                    return 1;
                }
            }
            if (item1.stmrUnit == unitId) {
                if (item2.stmrUnit != unitId) {
                    return -1;
                }
            } else if (item2.stmrUnit == unitId) {
                if (item1.stmrUnit != unitId) {
                    return 1;
                }
            }
        }
		if (item2.calculatedValue == item1.calculatedValue) {
            var typeIndex1 = typeListWithEsper.indexOf(item1.type);
            var typeIndex2 = typeListWithEsper.indexOf(item2.type);
            if (typeIndex1 == typeIndex2) {
                return item1.name.localeCompare(item2.name);
            } else {
                return typeIndex1 - typeIndex2;
            }
		} else {
			return item2.calculatedValue - item1.calculatedValue;
		}
    });
};

// If sort is required, this calculate the effective value of the requested stat, based on the unit stat for percentage increase.
var calculateValue = function(item, baseStat, stat, ailments, elements, killers) {
    var calculatedValue = 0;
    if (item[stat] && stat != "evade") {
        calculatedValue = item[stat];
    }
    if (item[stat + '%']) {
        calculatedValue += item[stat+'%'] * baseStat / 100;
    }
    if (item[stat] && stat == "evade") {
        if (item.evade.physical) {
            calculatedValue = item.evade.physical;
        }
        if (item.evade.magical && item.evade.magical > calculatedValue) {
            calculatedValue = item.evade.magical;
        }
    }
    if (stat == 'inflict' && (item.ailments || item.killers)) {
        var maxValue = 0;
        $(item.ailments).each(function(index, ailment) {
            if ((ailments.length == 0 || ailments.includes(ailment.name)) && ailment.percent > maxValue) {
                maxValue = ailment.percent;
            }
        });
        $(item.killers).each(function(index, killer) {
            if ((killers.length == 0 || killers.includes(killer.name))) {
                if (killer.physical > maxValue) {
                    maxValue = killer.physical;
                }
                if (killer.magical > maxValue) {
                    maxValue = killer.magical;
                }
            }
        });
        calculatedValue = maxValue;
    }
    if (stat == 'resist' && (item.resist)) {
        var maxValue = -999;
        var ignoreAilments = elements.length > 0 && ailments.length == 0;
        var ignoreElements = ailments.length > 0 && elements.length == 0;
        $(item.resist).each(function(index, res) {
            if (!ignoreAilments && ailmentList.includes(res.name) && (ailments.length == 0 || ailments.includes(res.name)) && res.percent > maxValue) {
                maxValue = res.percent;
            }
            if (!ignoreElements && elementList.includes(res.name) && (elements.length == 0 || elements.includes(res.name)) && res.percent > maxValue) {
                maxValue = res.percent;
            }
        });
        calculatedValue = maxValue;
        if (calculatedValue == -999) {
            calculatedValue = 0;
        }
    }
    item['calculatedValue'] = calculatedValue;
};

// Return true if the two arrays share at least one value
var matches = function(array1, array2) {
    var match = false;
    $(array1).each(function(index, value) {
        if (array2.includes(value)) {
            match = true;
        }
    });
    return match;
};

var includeAll = function(array1, array2) {
    for (var index in array2) {
        if (!array1.includes(array2[index])) {
            return false;
        }
    }
    return true;
};

// Return true if the item is exclusive to something that does not matches the selected unit
var exclusiveForbidAccess = function(item, selectedUnitId) {
    if (item.exclusiveSex && units[selectedUnitId].sex != item.exclusiveSex) {
        return true;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(selectedUnitId)) {
        return true;
    }
    return false;
}

// Return true if the various fields of the items contains all the searched terms
var containsText = function(text, item) {

    var result = true;
    getSearchTokens(text).forEach(function (token) {
        result = result && matchesToken(token, item.searchString);
    });
    return result;
};

function matchesToken(token, text) {
    return text.match(new RegExp(escapeRegExp(token).replace('\\*', '\\d+(-\\d+)?'),'i'))
}


// Add support for search text with quote. Text between quote won't be further splited for search
function getSearchTokens(text) {
    let tokens = [];
    let betweenQuotes = text.match(/"[^"]*"/g);
    if (betweenQuotes) {
        betweenQuotes.forEach(token => {
            tokens.push(token.substr(1, token.length-2));
            text = text.replace(token, '');
        });
    }
    if (text) {
        tokens = tokens.concat(text.split(' '));
    }
    return tokens.filter(token => token.trim() != '');
}


// Return true if the item has the required stat
var hasStat = function(stat, item) {
    return item[stat] || item[stat+'%'] || (stat == 'inflict' && (item.element || item.ailments || item.killers)) || (stat == 'resist' && item.resist);
};

// Return true if the item has all the required stats
var hasStats = function(additionalStat, item) {
    var match = true;
    $(additionalStat).each(function(index, addStat) {
        if (!item[addStat] && !item[addStat + '%'] && !(addStat=='twoHanded' && isTwoHanded(item))) {
            match = false;
        }
    });
    return match;
};

function isTwoHanded(item) {
    return (item && item.special && item.special.includes("twoHanded"));
}

// Return true if the item has at least one access that is not forbidden by filters
var haveAuthorizedAccess = function(forbiddenAccessList, item) {
    var hasAccess = false;
    if (forbiddenAccessList.includes("unitExclusive") && item.exclusiveUnits) {
        return false;
    }
    $(item.access).each(function(index, itemAccess) {
        hasAccess |= isAccessAllowed(forbiddenAccessList, itemAccess);
    });
    return hasAccess;
};

// Return true if one access is not forbidden by filters
var isAccessAllowed = function(forbiddenAccessList, access) {
    var accessAllowed = true;
    $(forbiddenAccessList).each(function (index, accessToSplit) {
        $(accessToSplit.split('/')).each(function(index, forbiddenAccess) {
            if (access.startsWith(forbiddenAccess) || access.endsWith(forbiddenAccess)) {
                accessAllowed = false;
            }
        });
    });
    return accessAllowed;
}

// Escape RegExp special character if the user used them in his search
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


function escapeQuote(string) {
    return String(string).replace(/[']/g, function (s) {
        return "\\'";
    });
}

function addToKiller(killers, newKiller) {
    var race = newKiller.name;
    var physicalPercent = newKiller.physical || 0;
    var magicalPercent = newKiller.magical || 0;

    var killerData = null;
    for (var index in killers) {
        if (killers[index].name == race) {
            killerData = killers[index];
            break;
        }
    }

    if (!killerData) {
        killerData = {"name":race};
        killers.push(killerData);
    }
    if (physicalPercent != 0) {
        if (killerData.physical) {
            killerData.physical += physicalPercent;
        } else {
            killerData.physical = physicalPercent;
        }
    }
    if (magicalPercent != 0) {
        if (killerData.magical) {
            killerData.magical += magicalPercent;
        } else {
            killerData.magical = magicalPercent;
        }
    }
}


function getKillerHtml(killers, physicalKillers = killerList, magicalKillers = killerList) {
  var physicalKillerString = "",
      magicalKillerString  = "",
      killerValues         = [],
      physicalRacesByValue = {},
      magicalRacesByValue  = {};

  for (var i = 0, len = killerList.length; i < len; i++) {
    var race = killerList[i];
    var killerData = null;

    for (var index in killers) {
      if (killers[index].name == race) {
        killerData = killers[index];
        break;
      }
    }

    if (killerData) {
      if (killerData.physical) {
        if (!killerValues.includes(killerData.physical)) { killerValues.push(killerData.physical); }
        if (!physicalRacesByValue[killerData.physical]) { physicalRacesByValue[killerData.physical] = []; }
        physicalRacesByValue[killerData.physical].push(race);
      }

      if (killerData.magical) {
        if (!killerValues.includes(killerData.magical)) { killerValues.push(killerData.magical); }
        if (!magicalRacesByValue[killerData.magical]) { magicalRacesByValue[killerData.magical] = []; }
        magicalRacesByValue[killerData.magical].push(race);
      }
    }
  }

  killerValues = killerValues.sort((a, b) => b - a);

  for (var i = 0; i < killerValues.length; i++) {

    // Build Output for Physical Killers
    if (physicalRacesByValue[killerValues[i]]) {
      var killerString = '"',
          killerSelected = '';

      if (killerValues[i] > 300) {
        killerString = ' text-danger" data-toggle="tooltip" title="Only 300% taken into account"';
      }

      if (matches(physicalKillers, physicalRacesByValue[killerValues[i]])) {
        killerSelected = " selected";
      }

      for (var j = 0; j < physicalRacesByValue[killerValues[i]].length; j++) {
        physicalKillerString += '<div class="getKillerHtml physical' + killerSelected + '" data-toggle="tooltip"  title="' + physicalRacesByValue[killerValues[i]][j] + ' physical killer">';
        physicalKillerString += '  <i class="icon icon-sm killer-physical-' + physicalRacesByValue[killerValues[i]][j] + '"></i>';
        physicalKillerString += '  <span class="text' + killerString + '>' + killerValues[i] + '%</span>';
        physicalKillerString += '</div>';
      }
    }

    // Build Output for Magical Killers
    if (magicalRacesByValue[killerValues[i]]) {
      var killerString = '"',
          killerSelected = '';

      if (killerValues[i] > 300) {
        killerString = ' text-danger" data-toggle="tooltip" title="Only 300% taken into account"';
      }

      if (matches(magicalKillers, magicalRacesByValue[killerValues[i]])) {
        killerSelected = " selected";
      }

      for (var j = 0; j < magicalRacesByValue[killerValues[i]].length; j++) {
        magicalKillerString += '<div class="getKillerHtml magical' + killerSelected + '" data-toggle="tooltip"  title="' + magicalRacesByValue[killerValues[i]][j] + ' magical killer">';
        magicalKillerString += '  <i class="icon icon-sm killer-magical-' + magicalRacesByValue[killerValues[i]][j] + '"></i>';
        magicalKillerString += '  <span class="text' + killerString + '>' + killerValues[i] + '%</span>';
        magicalKillerString += '</div>';
      }
    }
  }

  return {"physical" : physicalKillerString, "magical": magicalKillerString }
}

function prepareSearch(data) {
    for (var index in data) {
        var item = data[index];
        var textToSearch = item["name"];

        if (item.jpname) {
            textToSearch += item["jpname"];
        }

        textToSearch += "|" + getStatDetail(item);
        if (item["evade"]) {
            if (item.evade.physical) {
                textToSearch += "|" + "Evade physical " + item.evade.physical + "%";
            }
            if (item.evade.magical) {
                textToSearch += "|" + "Evade magical " + item.evade.magical + "%";
            }
        }
        if (item["resist"]) {
            for (var i = item.resist.length; i--;) {
                textToSearch += "|" + item.resist[i].name;
            }
        }
        if (item["element"]) {
            for (var i = item.element.length; i--;) {
                textToSearch += "|" + item.element[i];
            }
        }
        if (item["ailments"]) {
            for (var i = item.ailments.length; i--;) {
                textToSearch += "|" + item.ailments[i].name;
            }
        }
        if (item["exclusiveUnits"]) {
            textToSearch += "|Only ";
            var first = true;
            for (var i = 0, len = item.exclusiveUnits.length; i < len;i++) {
                if (units[item.exclusiveUnits[i]]) {
                    if (first) {
                        first = false;
                    } else {
                        textToSearch += ", ";
                    }
                    textToSearch += units[item.exclusiveUnits[i]].name;
                }
            }
        }
        if (item["exclusiveSex"]) {
            textToSearch += "|Only " + item["exclusiveSex"];
        }
        if (item["condition"]) {
            textToSearch += "|Only " + item["condition"];
        }
        if (item["equipedConditions"]) {
            item.equipedConditions.forEach(c => {
                textToSearch += "|If equiped with " + c;
            });
        }
        if (item.allowUseOf) {
            if (Array.isArray(item.allowUseOf)) {
                textToSearch += item.allowUseOf.map(allowUseOf => "|Allow use of " + item.allowUseOf).join("");
            } else {
                textToSearch += "|Allow use of " + item.allowUseOf;
            }
        }
        if (item.mpRefresh) {
            textToSearch += "|Recover MP (" + item.mpRefresh + "%) per turn";
        }
        if (item.drawAttacks) {
            textToSearch += "|+" + item.drawAttacks + "% draw attacks";
        }
        if (item["special"]) {
            for (var i = 0, len = item.special.length; i < len;i++) {
                textToSearch += "|" + item.special[i];
            }
        }
        if (item.singleWielding) {
            for (var index in baseStats) {
                if (item.singleWielding[baseStats[index]]) {
                    textToSearch += "|" + "Increase equipment " + baseStats[index].toUpperCase() + "(" + item.singleWielding[baseStats[index]] + "%) when single wielding"
                }
            }
            if (item.singleWielding.accuracy) {
                textToSearch += "|" + "Increase Accuracy (" + item.singleWielding.accuracy + "%) when single wielding";
            }
        }
        if (item.singleWieldingOneHanded) {
            for (var index in baseStats) {
                if (item.singleWieldingOneHanded[baseStats[index]]) {
                    textToSearch += "|" + "Increase equipment " + baseStats[index].toUpperCase() + "(" + item.singleWieldingOneHanded[baseStats[index]] + "%) when single wielding a one-handed weapon"
                }
            }
            if (item.singleWieldingOneHanded.accuracy) {
                textToSearch += "|" + "Increase Accuracy (" + item.singleWieldingOneHanded.accuracy + "%) when single wielding a one-handed wreapon";
            }
        }
        if (item.dualWielding) {
            for (var index in baseStats) {
                if (item.dualWielding[baseStats[index]]) {
                    textToSearch += "|" + "Increase equipment " + baseStats[index].toUpperCase() + "(" + item.dualWielding[baseStats[index]] + "%) when dual wielding"
                }
            }
        }
        if (item.killers) {
            for (var i = 0, len = item.killers.length; i < len;i++) {
                textToSearch += "|killer " + item.killers[i].name;
            }
        }
        if (item.accuracy) {
            textToSearch += "|" + "Increase Accuracy: " + item.accuracy + "%";
        }

        if (item.jumpDamage) {
            textToSearch += "|" + "Increase damage dealt by jump attacks by "+ item.jumpDamage + "%";
        }
        if (item.lbDamage) {
            textToSearch += "|" + "Increase LB damage (+" + item.lbDamage + "%)";
        }
        if (item.lbFillRate) {
            textToSearch += "|" + "Increase LB gauge fill rate (" + item.lbFillRate + "%)";
        }
        if (item.lbPerTurn) {
            var value;
            if (item.lbPerTurn.min == item.lbPerTurn.max) {
                value = item.lbPerTurn.min;
            } else {
                value = item.lbPerTurn.min + "-" + item.lbPerTurn.max;
            }
            textToSearch += "|" + "Increase LB gauge each turn (" + value + ")";
        }
        if (item.evoMag) {
            textToSearch += "|" + "Increase Esper summon damage by "+ item.evoMag + "%";
        }
        if (item.esperStatsBonus) {
            Object.keys(item.esperStatsBonus).forEach(esper => {
                if (esper === 'all') {
                    textToSearch += "|" + "Increase esper's bonus stats ("+ item.esperStatsBonus.all.hp + "%)";
                } else {
                    textToSearch += "|" + "Increase " + esper + "'s bonus stats ("+ item.esperStatsBonus[esper].hp + "%)";
                }
            });
        }
        if (item.guts) {
            textToSearch += "|" + item.guts.chance + '% chance to set HP to 1 upon fatal damage, if HP was above ' + item.guts.ifHpOver + '% (max '+ item.guts.time +' times)';
        }
        if (item.evokeDamageBoost) {
            Object.keys(item.evokeDamageBoost).forEach(e => {
                if (e === 'all') {
                    textToSearch += "|" + '+' + item.evokeDamageBoost[e] + '% damage for esper summons and evoke skills';
                } else {
                    textToSearch += "|" + '+' + item.evokeDamageBoost[e] + '% ' + e + ' summon damage';
                }
            });
        }
        if (item.skills) {
            item.skills.forEach(skill => {
                textToSearch += "|" + skill.name + ': ' + skill.effects.map(effect => effect.desc).join(', ');
            });
        }
        if (item.autoCastedSkills) {
            item.autoCastedSkills.forEach(skill => {
                textToSearch += "|Cast at start of battle or when revived:" + skill.name + ': ' + skill.effects.map(effect => effect.desc).join(', ');
            });
        }
         if (item.startOfTurnSkills) {
            item.startOfTurnSkills.forEach(skill => {
                textToSearch += '|Cast at start of turn: ' + skill.skill.name + ': ' + skill.skill.effects.map(effect => effect.desc).join(', ');
            });
        }
        if (item["tmrUnit"]) {
            if (units[item["tmrUnit"]]) {
                textToSearch += "|" + units[item["tmrUnit"]].name;
            } else {
                textToSearch += "|" + item["tmrUnit"];
            }
        }
        if (item["stmrUnit"]) {
            if (units[item["stmrUnit"]]) {
                textToSearch += "|" + units[item["stmrUnit"]].name;
            } else {
                textToSearch += "|" + item["stmrUnit"];
            }
        }
        for (var index in item.access) {
            textToSearch += "|" + item.access[index];
        }
        if (item.partialDualWield) {
            textToSearch += "|partial dual wield";
            for (var i = 0, len = item.partialDualWield.length; i < len;i++) {
                textToSearch += " " + item.partialDualWield[i];
            }
        }
        item.searchString = textToSearch;
    }
}

function getShortUrl(longUrl, callback) {
    $.ajax({
        url: 'links',
        method: 'POST',
        data: JSON.stringify({"url":longUrl}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            callback(data.url);
        },
        error: function(error) {
            Modal.showError("An error occured while trying to generate short url. <strong>Long url will be used instead</strong>.", error);
            callback(longUrl);
        }
    });
}

function getLocalizedFileUrl(name) {
    if (language) {
        name = name + "_" + language;
    }
    name += ".json";
    return server + "/" + name;
}

function onUnitsOrInventoryLoaded() {
    if (itemInventory && ownedUnits && ownedEspers) {
        if (ownedUnits.version && ownedUnits.version < 3) {
            // before version 3, units were : {"unitId": number}
            // After, they are {"unitId": {"number":number,"farmable":number}
            $.get(getLocalizedFileUrl("data"), function(data) {
                $.get(server + "/units.json", function(unitResult) {
                    var allUnitsTmp = unitResult;
                    var tmrNumberByUnitId = {};
                    for (var index = data.length; index--; ) {
                        var item = data[index];
                        if (item.tmrUnit && allUnitsTmp[item.tmrUnit] && itemInventory[item.id]) {
                            tmrNumberByUnitId[item.tmrUnit] = itemInventory[item.id];
                        }
                    }

                    for (var unitId in ownedUnits) {
                        var unitOwned = 0;
                        var tmrOwned = 0;
                        if (ownedUnits[unitId]) { unitOwned = ownedUnits[unitId];}
                        if (tmrNumberByUnitId[unitId]) { tmrOwned = tmrNumberByUnitId[unitId];}
                        ownedUnits[unitId] = {"number":ownedUnits[unitId],"farmable":Math.max(0, unitOwned - tmrOwned)};
                    }
                    var itemCount = Object.keys(itemInventory).length;
                    var unitCount = Object.keys(ownedUnits).length;

                    Modal.show("The unit collection evolved to contains the number of time you own a unit, and the number of TMR of each unit you can still farm."+
                               "Your data was automatically adapted and saved, but you probably should check the change.");
                    $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
                    $("#inventoryDiv .unitsNumber").text(unitCount + " unit" + (unitCount > 0 ? 's' : ''));
                    $("#inventoryDiv .itemsNumber").text(itemCount + " item" + (itemCount > 0 ? 's' : ''));
                    inventoryLoaded();
                    saveUnits();
                }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                    Modal.showErrorGet(this.url, errorThrown);
                });
            }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                Modal.showErrorGet(this.url, errorThrown);
            });

        } else {
            // Fix older versions/missing data
            for (var index in ownedUnits) {
                if (ownedUnits[index] != "version" && typeof ownedUnits[index] === 'number') {
                    ownedUnits[index] = {"number":ownedUnits[index], "farmable":0};
                }
            }

            updateUnitAndItemCount();

            $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
            inventoryLoaded();
        }
    }
}

function updateUnitAndItemCount() {
    // Count units
    var unitCount = 0;
    Object.keys(ownedUnits).forEach(key => { unitCount += (ownedUnits[key].number || 0) + (ownedUnits[key].sevenStar || 0); });

    // Count items (by slots occupied, not by amount)
    var itemCount = Object.keys(itemInventory).length;
    var enchantedItems = itemInventory["enchantments"];
    if(enchantedItems) {
        // Remove the "enchantments" key that was counted in the length above
        itemCount -= 1;

        // Add every enhancement, if it exists in items (old bug, remove this check after a reasonable amount of time when all saved data has already been fixed)
        Object.keys(enchantedItems).forEach(enchantment => itemInventory[enchantment] ? itemCount += enchantedItems[enchantment].length : 0);
    }

    $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
    $("#inventoryDiv .unitsNumber").text(unitCount + " unit" + (unitCount > 0 ? 's' : ''));
    $("#inventoryDiv .itemsNumber").text(itemCount + " item" + (itemCount > 0 ? 's' : ''));
}

function isLinkId(value) {
    return value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}

function saveUserData(mustSaveInventory, mustSaveUnits, mustSaveEspers = false) {
    if (saveTimeout) {clearTimeout(saveTimeout)}
    $("#inventoryDiv").addClass("Inventoryloading").removeClass("Inventoryloaded");
    saveNeeded = false;
    if (mustSaveInventory) {
        if (mustSaveUnits) {
            saveInventory(
                function() {
                    saveUnits(saveSuccess, saveError);
                }
            );
        } else {
            saveInventory(saveSuccess, saveError);
        }
    } else if (mustSaveUnits) {
        saveUnits(saveSuccess, saveError);
    } else if (mustSaveEspers) {
        saveEspers(saveSuccess, saveError);
    }
}

function saveSuccess() {
    if (mustSaveInventory) {
        mustSaveInventory = false;
    }
    if (mustSaveUnits) {
        mustSaveUnits = false;
    }
    if (mustSaveEspers) {
        mustSaveEspers = false;
    }
    $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
    updateUnitAndItemCount();
    $.snack("success", "Data saved", 5000);
}

function saveError() {
    $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
    if (error.status == 401) {
        Modal.showMessage('You have been disconnected', 'You have been disconnected. <strong>The data was not saved.</strong><br/>The page will be reloaded.', function() {
            window.location.reload();
        });
    } else {
        saveNeeded = true;
        Modal.showMessage('User data not saved', 'Error while saving the user data.');
    }
}

function sanitizeItemInventory() {
    // Sanitize inventory by removing non-existing enchantments
    var enchantments = itemInventory["enchantments"];
    Object.keys(enchantments || {}).forEach(enchantment => { if(!itemInventory[enchantment]) delete enchantments[enchantment]; });
}

function saveInventory(successCallback, errorCallback) {
    sanitizeItemInventory();

    $.ajax({
        url: server + '/itemInventory',
        method: 'PUT',
        data: JSON.stringify(itemInventory),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: successCallback,
        error: errorCallback
    });
}

 function saveUnits(successCallback, errorCallback) {
    $.ajax({
        url: server + '/units',
        method: 'PUT',
        data: JSON.stringify(ownedUnits),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: successCallback,
        error: errorCallback
    });
}

 function saveEspers(successCallback, errorCallback, forceSave = false) {
    if (!forceSave && (!ownedEspers || Object.keys(ownedEspers).length == 0)) {
        if (confirm("You're trying to save empty espers. Are you sure you want to erase your espers ?")) {
            saveEspers(successCallback, errorCallback, true);
        }
    }
    $.ajax({
        url: server + '/espers',
        method: 'PUT',
        data: JSON.stringify(ownedEspers),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: successCallback,
        error: errorCallback
    });
}

function getStaticData(name, localized, callback) {
    if (localized) {
        name = getLocalizedFileUrl(name);
    } else {
        name = server + "/" + name + ".json";
    }

    var data = staticFileCache.retrieve(name);

    // Check data, should not be empty
    if (data && !$.isEmptyObject(data)) {
        // Data found, not empty, good to go!
        callback(data);
    } else {
        // Data NOT found, let's fetch it
        $.snack('info', "Downloading " + name, 5000);
        let notification = $('.notifyjs-corner').children().first();
        let start = Date.now();
        $.get(name, function(result) {
           requestIdleCallback(function() {
                staticFileCache.store(name, result);
           });

            callback(result);
            let end = Date.now();
            if (end - start < 1000) {
                setTimeout(function () {
                    notification.trigger('notify-hide');
                }, 1000);
            } else {
                notification.trigger('notify-hide');
            }

        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            Modal.showErrorGet(this.url, errorThrown);
        });
    }
}

staticFileCache = {
    /*
     * staticFileCache.store
     * Convert data to string, compress and store in localStorage
     */
    store: function(filename, data) {
        if (!localStorageAvailable) return;

        try {
            // Convert to string if not already (may throw if bad data)
            if (typeof data !== 'string') {
                data = JSON.stringify(data);
            }
            // Compress string (*ToUTF16 is important, localStorage can only contain JS strings encoded in UTF16)
            var compressedData = LZString.compressToUTF16(data);
            // Save (may throw if storage full)
            localStorage.setItem(filename, compressedData);
            // Update savedFiles
            var savedFiles = JSON.parse(localStorage.getItem("savedFiles"));
            if (!savedFiles) savedFiles = {};
            savedFiles[filename] = compressedData.length;
            localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
            // Log to console
            window.console && window.console.log("Stored "+filename+" (" + data.length + " bytes, ratio "+ (compressedData.length*100/data.length).toFixed(0) +"% )");
        } catch (error) {
            // Modal.showError("An error occured while trying to save data to your local storage.", error);
            window.console && window.console.warn("An error occured while trying to save the file "+filename+" to your local storage", error);
            // Failsafe: remove item in case of error (to free space if needed)
            try { localStorage.removeItem(filename); } catch(e){}
        }
    },

    /*
     * staticFileCache.retrieve
     * Read from localStorage, decompress, convert to JS
     */
    retrieve: function(filename) {
        if (!localStorageAvailable) return;

        var data = null;
        try {
            var dataString = localStorage.getItem(filename);
            if (dataString) {
                // Decompress string and parse
                data = JSON.parse(LZString.decompressFromUTF16(dataString));
                // Log to console
                window.console && window.console.log("Retrieved "+filename+" (" + dataString.length + " bytes)");
            }
        } catch (error) {
            window.console && window.console.warn("An error occured while trying to retrieve the file "+filename+" from your local storage", error);
            // Failsafe: remove item in case of error (to free space if needed)
            try { localStorage.removeItem(filename); } catch(e){}
        }
        return data;
    },

    /*
     * staticFileCache.clear
     * Clear a file or all files saved in localStorage
     */
    clear: function(filename = null) {
        if (!localStorageAvailable) return;

        var savedFiles, filenames;

        // Load save files list
        try {
            savedFiles = JSON.parse(localStorage.getItem("savedFiles"));
        } catch (error) {
            window.console && window.console.warn("An error occured while trying to load saved files list", error);
        }

        // Set saved files to default if not a plain object
        if (!$.isPlainObject(savedFiles)) savedFiles = {};

        try {
            // Establish list of files to remove
            if (typeof filename === 'string') {
                filenames = [filename];
            } else {
                filenames = Object.keys(savedFiles);
            }

            // Loop and remove
            for (i = 0; i < filenames.length; i++) {
                localStorage.removeItem(filenames[i]);
                delete savedFiles[filenames[i]];
            }
        } catch (error) {
            window.console && window.console.warn("An error occured while trying to remove the file(s) "+filenames+" from your local storage", error);
        }

        // Always update list of saved files
        localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
    },

    /*
     * staticFileCache.checkDataVersion
     * Compare the version, server and language as stored in localStorage
     */
    checkDataVersion: function(version, server, language) {
        if (!localStorageAvailable) return false;

        try {
            var storedDataVersion = JSON.parse(localStorage.getItem("dataVersion"));
            if (storedDataVersion.version === version && storedDataVersion.server === server && storedDataVersion.language === language) {
                return true
            }
            window.console && window.console.warn("Data version differs from stored", version, server, language, storedDataVersion);
        } catch (e) { /* ignore exceptions */ }
        return false;
    },

    /*
     * staticFileCache.setDataVersion
     * Set the version, server and language to localStorage
     */
    setDataVersion: function(version, server, language) {
        if (!localStorageAvailable) return;

        try {
            localStorage.setItem("dataVersion", JSON.stringify({"version": version, "server": server, "language": language}));
            window.console && window.console.log("Storing data version", version, server, language);
        } catch (error) {
            window.console && window.console.warn("An error occured while trying to save current data version", error, version, server, language);
        }
    }
}




Modal = {
  show: function(conf) {

  /*
    conf = {
      title: string or function,
      body: string or function,
      size : 'modal-sm', 'modal-lg', 'modal-xl' or false
      onOpen : false or function,
      onClose : false or function,
      withCancelButton: bool
      buttons: [ { text: string, className: string, onClick: function } ]
    }
  */

  conf = $.extend({
    title: "Modal Title",
    body: "Modal body",
    size : false,
    onOpen : false,
    onClose : false,
    withCancelButton: true,
    buttons: false
  }, conf);

  conf.title = typeof conf.title === 'function' ? conf.title() : conf.title;
  conf.body = typeof conf.body === 'function' ? conf.body() : conf.body;

  if (conf.buttons === false && conf.withCancelButton === false) {
    conf.buttons = [{
      text: "Close",
      className: "",
      onClick: function() {}
    }];
  }

  var html_btn = '';

  if (conf.withCancelButton) {
    html_btn += '<button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>';
  }

  $.each(conf.buttons, function(idx, buttonConf) {
    var buttonClass = buttonConf.className ? buttonConf.className : '';
    if (buttonClass.indexOf('btn-') === -1) {
      buttonClass += "btn-" + (idx === 0 ? 'primary' : 'secondary');
    }
    html_btn += '<button type="button" class="btn '+buttonClass+'" data-callback="'+idx+'">'+buttonConf.text+'</button>';
  });

  var html = '<div class="modal fade temporaryModal ffbe_theme--dark" tabindex="-1" role="dialog" data-backdrop="false">';
      html += '  <div class="modal-dialog modal-dialog-centered '+ conf.size + '" role="document">';
      html += '    <div class="modal-content">';
      html += '       <div class="modal-header"><h5 class="modal-title">'+ conf.title +'</h5><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
      html += '       <div class="modal-body">' + conf.body + '</div>';
      html += '       <div class="modal-footer">' + html_btn + '</div>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';

  // Modal should be put last to be able to be above everything else
  var $modal = $('body').append(html).children().last();
  var $buttons = $modal.find("button[data-callback]");

  // Enable modal mode, and add hidden event handler
  $modal.modal({ keyboard: false })
    .on('hidden.bs.modal', function (e) {
      if (conf.onClose) conf.onClose($modal);
      // When modal is hidden, remove all event handlers attached and remove from DOM
      $buttons.off();
      $modal.off().remove();
    }).on('keyup', function(e) {
      if (e.keyCode == 13) {
        // Hanle press ENTER
        // Automatically click on submit if only one user button is defined
        // Otherwise, do nothing, we don't know which one to prefer...
        if ($buttons.length === 1) {
          e.stopImmediatePropagation();
          $buttons.click();
        }
      } else if (e.keyCode === 27) {
        // Hanle press ESCAPE
        // Close modal
        e.stopImmediatePropagation();
        $modal.modal('hide');
      }
    });

    // Add buttons event handler
    $buttons.on('click', function (e) {
      var shouldHide = true;
      // Find and call callback
      var buttonIdx = $(this).attr('data-callback');
      if (conf.buttons[buttonIdx].onClick) shouldHide = conf.buttons[buttonIdx].onClick($modal);
      // Hide modal
      if (shouldHide !== false) {
        $modal.modal('hide');
      }
    });

    if (conf.onOpen) conf.onOpen($modal);
    return $modal;

  // Let's Hide the Modal!
  }, hide: function() {
    if ($('.temporaryModal').length > 0) {
      $('.temporaryModal').modal('hide');
    }

  // Special Show: Build Link!
  }, showWithBuildLink: function(name, link) {
    if (!link.startsWith('http')) {
      link = 'https://ffbeEquip.com/'+link;
    }

    Modal.show({
      title: "Link to Your " + name,
      body: "<p>This link will allow anyone to visualize your "+name+"</p>"+
            '<div class="input-group">' +
            '  <span class="input-group-prepend"><span class="input-group-text"><span class="fa fa-link"></span></span></span>' +
            '  <input class="form-control linkInput" type="text" value="'+link+'"/>' +
            '</div>'+
            '<p class="hidden linkInputCopied">Link copied to your clipboard.</p>',
      withCancelButton: false,
      size: false,
      onOpen: function($modal) {
        if (copyInputToClipboard($modal.find("input"))) {
          $modal.find(".linkInputCopied").removeClass('hidden');
        }
      }
    });

  // Special Show: Text Data!
  }, showWithTextData: function(title, textData) {
    Modal.show({
      title: title,
      body: '<textarea class="form-control" rows="12">' + textData + '</textarea><p class="hidden linkInputCopied">Link copied to your clipboard.</p>',
      withCancelButton: false,
      size: false,
        onOpen: function($modal) {
          if (copyInputToClipboard($modal.find("textarea"))) {
            $modal.find(".linkInputCopied").removeClass('hidden');
          }
      }
    });

  // Special Show: Confirm Action!
  }, confirm: function(title, question, onAccept) {
    Modal.show({
      title: title,
      body: '<p>'+question+'</p>',
      withCancelButton: true,
      buttons: [{
        text: "Yes",
        className: "btn-success",
        onClick: onAccept
      }]
    });

  // Special Show: Message!
  }, showMessage: function(title, message, onClose) {
    Modal.show({
      title: title,
      body: '<p>'+message+'</p>',
      onClose: onClose,
      withCancelButton: false
    });

  // Special Show: You Broke it!
  }, showError: function(text, error) {
    Modal.show({
      title: "Something went wrong, Kupo!",
      body: '<p>'+text+'</p>'+ '<pre class="error">'+error.toString()+'</pre>',
      withCancelButton: false
    });

    if (window.console && window.console.trace) {
      window.console.trace();
      window.console.error(error);
    }

  // Special Show: The File Done Did Broke!
  }, showErrorGet: function(filename, errorThrown) {
    if (typeof errorThrown !== 'string') error = JSON.stringify(errorThrown);

    Modal.show({
      title: "I couldn't get the file, Kupo!",
      body: '<p>An error occured while trying to retrieve a file from the server.</p>'+
            '<p><strong>Filename</strong>: '+filename+'</p>'+
            '<pre class="error">'+errorThrown+'</pre>',
      withCancelButton: false
    });

    if (window.console && window.console.trace) {
      window.console.trace();
    }
  }
}

function copyInputToClipboard($input)
{
    var successful = false;
    try {
        if ($input.length > 0) {
            $input.focus().select();
            successful = document.execCommand('copy');
        }
    } catch (err) {}
    return successful;
}

function adaptItemInventoryForMultipleRareEnchantments() {
    Object.keys(itemInventory.enchantments).forEach(itemId => {
        itemInventory.enchantments[itemId].forEach(enchantments => {
            enchantments.forEach((value, index) => {
                if (value == "rare") {
                    enchantments[index] = "rare_3";
                }
            })
        });
    });
}

let waitingCallbacks = [];
let keysReady = [];
function registerWaitingCallback(waitingKeys, callback) {
    let keys = waitingKeys.filter(k => !keysReady.includes(k));
    if (keys.length === 0) {
        callback();
    } else {
        waitingCallbacks.push({"keys":keys, "callback":callback});
    }
}
function waitingCallbackKeyReady(key) {
    keysReady.push(key);
    waitingCallbacks.filter(wc => wc.keys.includes(key)).forEach(wc => {
        wc.keys.splice(wc.keys.indexOf(key), 1);
        if (wc.keys.length == 0) {
            wc.callback();
        }
    })
}

function getEsperLink(esper) {
    let linkData = escapeName(esper.name) + '|' + esper.rarity + '|' + esper.level + '|';

    let boardStateBin = importBoardConversion.map(coordinate => getEsperBoardPositionString(coordinate[0], coordinate[1])).map(positionString => (positionString === '0_0' || esper.selectedSkills.includes(positionString)) ? '1': '0').join('');
    let boardState = bin2hex(boardStateBin);

    linkData += boardState;
    return "https://ffbeEquip.com/espers.html?server=" + server + '&o#' + linkData;
}

function getEsperBoardPositionString(x, y) {
    var posString = "";
    if (x < 0) {
        posString += "m" + -x;
    } else {
        posString += x;
    }
    posString += "_"
    if (y < 0) {
        posString += "m" + -y;
    } else {
        posString += y;
    }
    return posString;
}

function hex2bin(hex){
    let result = "";
    [...hex].forEach(char => result += ("0000" + (parseInt(char, 16)).toString(2)).substr(-4));
    return result;
}

function bin2hex(bin) {
    let zeroToAdd = (4 - bin.length % 4) % 4;
    for (let i = 0; i < zeroToAdd; i++) {
        bin += '0';
    }
    return bin.match(/.{4}/g).map(bin4Char => parseInt(bin4Char, 2).toString(16)).join('');
}

$(function() {
  try {
    // Bust the whole localStorage in case of old array used in order to get a clean state
    // @TODO: can be removed after october 2018
    if (localStorageAvailable && $.isArray(JSON.parse(localStorage.getItem("savedFiles")))) {
      localStorage.clear();
      window.console && window.console.warn("Clearing the whole localStorage!");
    }
  } catch (e) {}

  readUrlParams();

  $.get(server + '/dataVersion.json', function(result) {
    var dataVersion = result.version;
    var selectedLanguage = language ? language : "en";

    if (localStorageAvailable && !staticFileCache.checkDataVersion(dataVersion, server, selectedLanguage)) {
      staticFileCache.clear();
      staticFileCache.setDataVersion(dataVersion, server, selectedLanguage);
    }

    startPage();

    // Initialize Bootstrap Tooltips in a way that allows DOM-inserted items to trigger.
    $('body').tooltip({
      selector: '[data-toggle="tooltip"]',
      container: 'body',
      trigger: 'hover',
      html: true
    });

    // Initialize Bootstrap Popover in a way that allows DOM-inserted items to trigger.
    $('body').popover({
      selector: '[data-toggle="popover"]',
      container: 'body',
      html: true
    });

    // Allow [data-toggle="modal"] to open external HTML assets.
		$('body').on('click', '[data-toggle="modal"]', function(event) {
			var m_target = $(this).data("target"), // Modal snippet to target
	    		m_path   = $(this).data("path"),   // URL to open
	    		m_size   = $(this).data("size");   // Size to apply (eg. modal-xl)

			if (typeof $(this).data('path') !== 'undefined') {
				// Do Nothing
			} else {
				var m_path = $(this).attr('href');
			}

			if ( $(this).prop('disabled', false) ) {
				$(m_target).modal('dispose');
				$(".modal-backdrop").remove();

				$(m_target + ' .modal-dialog').removeClass('modal-lg modal-sm modal-xl').addClass('modal-' + m_size);
				$(m_target + ' .modal-dialog' + ' .modal-content').load(m_path); 
			}
		});


  }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
    Modal.showErrorGet(this.url, errorThrown);
  });

  if ((window.location.href.indexOf("&o") > 0 || window.location.href.indexOf("?o") > 0)) {
    $("#inventoryDiv").removeClass("Inventoryloading Inventoryloaded");
    notLoaded();
  } else {

    $.get(server + '/itemInventory', function(result) {
      itemInventory = result;

      if (!itemInventory.enchantments) {
        itemInventory.enchantments = {};
      }

      adaptItemInventoryForMultipleRareEnchantments();
      sanitizeItemInventory();
      onUnitsOrInventoryLoaded();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
      $("#inventoryDiv").removeClass("Inventoryloading Inventoryloaded");
      if (notLoaded) {
        notLoaded();
      }
    });

    $.get(server + '/settings', function(result) {
      userSettings = result;
    });

    $.get(server + '/units', function(result) {
      ownedUnits = result;

      if (result.version && result.version == 3) {
        getStaticData("units", false, function(allUnitResult) {
        for (var unitSerieId in allUnitResult) {
          var unit = allUnitResult[unitSerieId];
          var maxUnitId = unitSerieId.substr(0, unitSerieId.length-1) + unit.max_rarity;
          if (ownedUnits[maxUnitId]) {
            ownedUnits[unitSerieId] = ownedUnits[maxUnitId];
            delete ownedUnits[maxUnitId];
          }
        }

        ownedUnits.version = 4;
        saveUnits(
          function() {
            $.snack('success', 'Owned units data successfuly migrated to v4', 5000);
            onUnitsOrInventoryLoaded();
          }, function(errorThrown) {
            Modal.showError("An error occured when trying to upgrade your unit data to version 4.", errorThrown);
          });
        });
      } else {
        onUnitsOrInventoryLoaded();
      }
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
      $("#inventoryDiv").removeClass("Inventoryloading Inventoryloaded");
      if (notLoaded) {
        notLoaded();
      }
    });

    console.log("Starts to load owned espers");

    $.get(server + '/espers', function(result) {
      ownedEspers = result;
      Object.keys(ownedEspers).forEach(esper => {
        if (ownedEspers[esper].esperStatsBonus && !ownedEspers[esper].esperStatsBonus.all) {
          ownedEspers[esper].esperStatsBonus = {"all":ownedEspers[esper].esperStatsBonus};
        }
      });

      console.log("owned espers loaded");
      onUnitsOrInventoryLoaded();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
      console.log("error loading owned espers");
      $("#inventoryDiv").removeClass("Inventoryloading Inventoryloaded");
      if (notLoaded) {
        notLoaded();
      }
    });
  }

  let themeSelector = $('#themeSelector input');

  if (themeSelector.length) {
    themeSelector.change(onThemeChange);
  }


  /* Back to top button feature */
  var $scroll = $('#scrollToTopButton');
  if ($scroll) {
    // Detect when user start to scroll down
    $(window).scroll($.debounce(100, function(){
      if ($(this).scrollTop() > 100) {
        $scroll.fadeIn(200);
      } else {
        $scroll.fadeOut(200);
      }
    }));

    // Back to top when clicking on link
    $scroll.click(function(){
      $("html, body").animate({ scrollTop: 0 }, 400);
        return false;
    });
  }
});


/*
 * Conditional stylesheet loading at runtime with media queries
 *
 * How to use:
 *  <link rel="stylesheet" type="text/css" class="load-if-media-matches" data-href="url/to/file.css" media="min-width: 1024px">
 *
 * By default, browser will load all stylesheets, even if the media query
 * in media attr doesn't match.
 *
 * This script will load the stylesheet only if the media query matches.
 * Event when resized.
 *
 * href is replaced by data-href
 * If media query matches, href will be set by the value of data-ref,
 * effectively loading the stylesheet
 *
 * Done in vanillajs for performance
 *
 * This is not done in document.ready (i.e. $(function(){}) for jQuery) because it should run ASAP
 *
 * Inspired by https://christianheilmann.com/2012/12/19/conditional-loading-of-resources-with-mediaqueries/
 *
 */
(function(){
    loadTheme();
    // queries: object holding all "media query" => [elements...]
    var queries = {};

    // Identify all mediaquery dependent links
    var elements = document.querySelectorAll('.load-if-media-matches');

    // Loop through them and gather queries
    var elem, i = elements.length;
    while (i--) {
        elem = elements[i];
        if (elem.media) {
            if (queries[elem.media]) {
                queries[elem.media].push(elem);
            } else {
                queries[elem.media] = [elem];
            }
        }
    }

    // Loop through the queries and check it
    var query, mql;
    for (query in queries) {
        // All elements of this query
        elements = queries[query];
        // mediaquery object
        mql = window.matchMedia(query);
        // Check if already match
        if (mql.matches) {
            // Already a match! Lets set it for all elements
            i = elements.length;
            while (i--) {
                if (!elements[i].href) {
                    elements[i].href = elements[i].dataset.href;
                }
            }
        } else {
            // Not a match, let's listen to its event
            // Note: we create a closure to be able to use the current mql and elements variable
            //       this is important, otherwise mql and elements will refer to the last one
            (function(mql, elements){
                // Now mql and elements will refer to this one iteration
                mql.addListener(function(e) {
                    // When event is fired, check for a match
                    if (e.matches) {
                        // Match! Let set it for all elements
                        var i = elements.length;
                        while (i--) {
                            if (!elements[i].href) {
                                elements[i].href = elements[i].dataset.href;
                            }
                        }
                    }
                });
            }(mql, elements));
        }
    }
}());

const throttle = (func, limit) => {
  let lastFunc
  let lastRan
  return function() {
    const context = this
    const args = arguments
    if (!lastRan) {
      func.apply(context, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}
