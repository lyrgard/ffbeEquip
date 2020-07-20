var releasedUnits;
var lastItemReleases;

var currentSort = showRaritySort;

var releasedUnits;
var tmrNumberByUnitId = {};
var tmrByUnitId = {};
var stmrNumberByUnitId = {};
var stmrByUnitId = {};

var onlyShowOwnedUnits = false;
var onlyShow7Star = false;
var showNumberTMRFarmed = false;
var readOnly;

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#unitsWrapper").removeClass("hidden");
    $("#unitsWrapper").removeClass("hidden");
    $("#searchBox").addClass("hidden");

    $(".nav-tabs .alphabeticalSort").removeClass("active");
    $(".nav-tabs .raritySort").removeClass("active");
    $(".nav-tabs .tmrAlphabeticalSort").removeClass("active");
    $(".nav-tabs .history").removeClass("active");
    $(".nav-tabs .pullSimulator").removeClass("active");
    $("#searchBox").prop("placeholder", "Enter unit name");
}

function showAlphabeticalSort() {
    beforeShow();
    currentSort = showAlphabeticalSort;
    $("#searchBox").removeClass("hidden");
    $(".nav-tabs .alphabeticalSort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnits(sortAlphabetically(filterName(releasedUnits))));

    if (!$('#results').hasClass('row')) {
      $('#results').addClass('row');
    }

    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
    afterShow();
}

function showRaritySort(minRarity = 1) {
    beforeShow();
    currentSort = showRaritySort;
    $("#searchBox").removeClass("hidden");
    $(".nav-tabs .raritySort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnitsByRarity(sortByRarity(filterName(releasedUnits)), minRarity));

    if ($('#results').hasClass('row')) {
      $('#results').removeClass('row');
    }

    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
    afterShow();
}

function showTMRAlphabeticalSort() {
    beforeShow();
    currentSort = showTMRAlphabeticalSort;
    $("#searchBox").removeClass("hidden");
    $("#searchBox").prop("placeholder", "Enter TMR name");

    $(".nav-tabs .tmrAlphabeticalSort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnits(sortTMRAlphabetically(filterTMRName(releasedUnits)), true));

    if (!$('#results').hasClass('row')) {
      $('#results').addClass('row');
    }

    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
    afterShow();
}

function showHistory() {
  beforeShow();
  currentSort = showHistory;

  $(".nav-tabs .history").addClass("active");

  if ($('#results').hasClass('row')) {
    $('#results').removeClass('row');
  }

  // filter, sort and display the results
  var html = "";

  for (var dateIndex in lastItemReleases) {
    var first = true;

    for (var sourceIndex in lastItemReleases[dateIndex].sources) {
      if (lastItemReleases[dateIndex].sources[sourceIndex].type == "banner") {
        if (first) {

          html += '<div class="ffbe_text--title d-flex justify-content-between mb-3">';
          html += '  <span class="date">' + lastItemReleases[dateIndex].date + '</span>';
          html += '</div>';
          html += '<div class="row">';
          first = false;
        }

        var unitsTodisplay = [];
        var unitNames = lastItemReleases[dateIndex].sources[sourceIndex].units;
        for (var unitNameIndex = 0, len = unitNames.length; unitNameIndex < len; unitNameIndex++) {
          var unitName = unitNames[unitNameIndex];
          if (units[unitName]) {
            unitsTodisplay.push(units[unitName]);
          }
        }
        html += displayUnits(unitsTodisplay);
        html += '</div>';
      }
    }
  }


  $("#results").html(html);

  afterShow();
}

function afterShow() {
  var popTrigger = '[data-toggle="unittrust"]',
      popClass   = 'unitTrustPopover',
      popID      = 'unit',
      popType    = 'type';


  /* New Bootstrap Popover --------------------------------------------------- *\
   * Expects the following data attributes:
   * data-inventory (item.id)
  \* ------------------------------------------------------------------------- */

  $(popTrigger).popover({
    html: true,
    trigger: 'manual',
    container: 'body',
    placement: 'bottom',
    title: "Item Info",
    template: '<div class="popover ' + popClass + ' ffbe_theme--dark" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
    content: function() {
      var theItem     = $(this).data(popID),
          theItemType = $(this).data(popType);

      if (theItemType == 'TMR') {
        return displayItemLine(tmrByUnitId[theItem], "", false);
      } else {
        return displayItemLine(stmrByUnitId[theItem], "", false);
      }
    },

  // Show the Popover and hide the others
  }).on("mouseenter", function () {
    var _this = this;
    $(this).popover("show");
    $(this).siblings(".popover").on("mouseleave", function () {
        $(_this).popover('hide');
    });

  // Let the Popover linger when you hover (Time in MS)
  }).on("mouseleave", function () {
        var _this = this;
        setTimeout(function () {
            if (!$(".popover:hover").length) {
                $(_this).popover("hide")
            }
        }, 100);

  });

  lazyLoader.update();
}

function showPullSimulator() {
    beforeShow();
}

function displayStats() {
    var stats = {
        "all": {
            "NV": {"different":0, "total":0, "number":0},
            "7": {"different":0, "total":0, "number":0},
            "5": {"different":0, "total":0, "number":0},
            "4": {"different":0, "total":0, "number":0},
            "3": {"different":0, "total":0, "number":0},
        },
        "timeLimited": {
            "NV": {"different":0, "total":0, "number":0},
            "7": {"different":0, "total":0, "number":0},
            "5": {"different":0, "total":0, "number":0},
            "4": {"different":0, "total":0, "number":0},
            "3": {"different":0, "total":0, "number":0},
        }
    }
    var unitIds = Object.keys(releasedUnits);
    for (var i = unitIds.length; i--;) {
        var unit = releasedUnits[unitIds[i]];
        if (unit.min_rarity >= 3 || unit.min_rarity == 'NV') {
            var maxRarity = (unit.unreleased7Star ? 6 : unit.max_rarity);
            stats.all[unit.min_rarity].total++;
            if (maxRarity == 7) {
                stats.all["7"].total++;
            }
            if (ownedUnits[unit.id]) {
                stats.all[unit.min_rarity].number += ownedUnits[unit.id].number;
                stats.all[unit.min_rarity].different++;
                if (maxRarity == 7 && ownedUnits[unit.id].sevenStar) {
                    stats.all["7"].number += ownedUnits[unit.id].sevenStar;
                    stats.all["7"].different++;
                }
            }
            if (unit.summon_type == "event") {
                stats.timeLimited[unit.min_rarity].total++;
                if (maxRarity == 7) {
                    stats.timeLimited["7"].total++;
                }
                if (ownedUnits[unit.id]) {
                    stats.timeLimited[unit.min_rarity].number += ownedUnits[unit.id].number;
                    stats.timeLimited[unit.min_rarity].different++;
                    if (maxRarity == 7 && ownedUnits[unit.id].sevenStar) {
                        stats.timeLimited["7"].number += ownedUnits[unit.id].sevenStar;
                        stats.timeLimited["7"].different++;
                    }
                }
            }
        }
    }
    $(".stats .all .star7 .value").text(stats.all["7"].different);
    $(".stats .all .star7 .total").text(stats.all["7"].total);
    $(".stats .all .star7 .number").text("(" + stats.all["7"].number + ")");

    $(".stats .all .star5 .value").text(stats.all["5"].different);
    $(".stats .all .star5 .total").text(stats.all["5"].total);
    $(".stats .all .star5 .number").text("(" + stats.all["5"].number + ")");

    $(".stats .all .star4 .value").text(stats.all["4"].different);
    $(".stats .all .star4 .total").text(stats.all["4"].total);
    $(".stats .all .star4 .number").text("(" + stats.all["4"].number + ")");

    $(".stats .all .star3 .value").text(stats.all["3"].different);
    $(".stats .all .star3 .total").text(stats.all["3"].total);
    $(".stats .all .star3 .number").text("(" + stats.all["3"].number + ")");

    $(".stats .withoutTimeLimited .star7 .value").text(stats.all["7"].different - stats.timeLimited["7"].different);
    $(".stats .withoutTimeLimited .star7 .total").text(stats.all["7"].total - stats.timeLimited["7"].total);
    $(".stats .withoutTimeLimited .star7 .number").text("(" + (stats.all["7"].number - stats.timeLimited["7"].number) + ")");

    $(".stats .withoutTimeLimited .star5 .value").text(stats.all["5"].different - stats.timeLimited["5"].different);
    $(".stats .withoutTimeLimited .star5 .total").text(stats.all["5"].total - stats.timeLimited["5"].total);
    $(".stats .withoutTimeLimited .star5 .number").text("(" + (stats.all["5"].number - stats.timeLimited["5"].number) + ")");

    $(".stats .withoutTimeLimited .star4 .value").text(stats.all["4"].different - stats.timeLimited["4"].different);
    $(".stats .withoutTimeLimited .star4 .total").text(stats.all["4"].total - stats.timeLimited["4"].total);
    $(".stats .withoutTimeLimited .star4 .number").text("(" + (stats.all["4"].number - stats.timeLimited["4"].number) + ")");

    $(".stats .withoutTimeLimited .star3 .value").text(stats.all["3"].different - stats.timeLimited["3"].different);
    $(".stats .withoutTimeLimited .star3 .total").text(stats.all["3"].total - stats.timeLimited["3"].total);
    $(".stats .withoutTimeLimited .star3 .number").text("(" + (stats.all["3"].number - stats.timeLimited["3"].number) + ")");

    $(".stats .timeLimited .star7 .value").text(stats.timeLimited["7"].different);
    $(".stats .timeLimited .star7 .total").text(stats.timeLimited["7"].total);
    $(".stats .timeLimited .star7 .number").text("(" + stats.timeLimited["7"].number + ")");

    $(".stats .timeLimited .star5 .value").text(stats.timeLimited["5"].different);
    $(".stats .timeLimited .star5 .total").text(stats.timeLimited["5"].total);
    $(".stats .timeLimited .star5 .number").text("(" + stats.timeLimited["5"].number + ")");

    $(".stats .timeLimited .star4 .value").text(stats.timeLimited["4"].different);
    $(".stats .timeLimited .star4 .total").text(stats.timeLimited["4"].total);
    $(".stats .timeLimited .star4 .number").text("(" + stats.timeLimited["4"].number + ")");

    $(".stats .timeLimited .star3 .value").text(stats.timeLimited["3"].different);
    $(".stats .timeLimited .star3 .total").text(stats.timeLimited["3"].total);
    $(".stats .timeLimited .star3 .number").text("(" + stats.timeLimited["3"].number + ")");

}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayUnits = function(units, useTmrName = false) {
    var html = '';
    if (units.length > 0) {
        for (var index = 0, len = units.length; index < len; index++) {
            var unit = units[index];
            html += getUnitDisplay(unit, useTmrName);
        }
    } else {
        html = "<p>No "+ (useTmrName ? "TMR" : "units") +" found...</p>"
    }

    return html;

};

function buildRarityID(min_rarity, max_rarity)
{
    return "rarity-" + min_rarity + "-of-" + max_rarity;
}

function displayUnitsByRarity(units, minRarity = 1) {
  var lastMinRarity, lastMaxRarity;
  var first = true;
  var html = '';

  if (units.length > 0) {
    var rarity_list = []; // will gather rarity to display a jump list later

    for (var index = 0, len = units.length; index < len; index++) {
      var unit = units[index];

      if (minRarity == 7) {
        if (!ownedUnits[unit.id] || !ownedUnits[unit.id].sevenStar) {
          continue;
        }
      } else if (unit.min_rarity != 'NV' && unit.min_rarity < minRarity) {
        continue;
      }

      var maxRarity = (unit.unreleased7Star ? 6 : unit.max_rarity);

      if (first) {

        // Build  Unit Title.
        html += '<div class="d-flex my-2 align-items-center" id="' + buildRarityID(unit.min_rarity, maxRarity) + '">';
        html += '  <div class="ffbe_text--title flex-fill my-2"></div>';
        html += '  <div class="px-4">' + getRarity(unit.min_rarity, maxRarity) + '</div>';
        html += '  <div class="ffbe_text--title flex-fill my-2"></div>';
        html += '</div>';

        html += '<div class="row unitList">';
        first = false;
        rarity_list.push({'min_rarity': unit.min_rarity, "max_rarity": maxRarity});
      } else {
        if (maxRarity != lastMaxRarity || unit.min_rarity != lastMinRarity) {
          html += '</div>';

        // Build  Unit Title.
        html += '<div class="d-flex my-2 align-items-center" id="' + buildRarityID(unit.min_rarity, maxRarity) + '">';
        html += '  <div class="ffbe_text--title flex-fill my-2"></div>';
        html += '  <div class="px-4">' + getRarity(unit.min_rarity, maxRarity) + '</div>';
        html += '  <div class="ffbe_text--title flex-fill my-2"></div>';
        html += '</div>';

          html += '<div class="row unitList">';
          rarity_list.push(unit);
        }
      }

      lastMaxRarity = maxRarity;
      lastMinRarity = unit.min_rarity;
      html += getUnitDisplay(unit);
    }
      html += '</div>';

  var rarity_jump_html = '';

  if (rarity_list.length > 1) {
    var rarity_jump_btn = '';

    // Jump list display
    // Loop from end to begin, to show smaller star first
    // Also, do not show index 0 because it's the one just below, so don't need to jump...
    for (index = 1, len = rarity_list.length; index < len; index++) {
      rarity_jump_btn += '<a class="rarityJump btn btn-primary btn-sm ml-1 mb-1" href="#' + buildRarityID(rarity_list[index].min_rarity, rarity_list[index].max_rarity) + '">' + getRarity(rarity_list[index].min_rarity, rarity_list[index].max_rarity) + "</a>";
    }

    rarity_jump_html  = '<div class="d-flex justify-content-center align-items-center rarityJumpList" data-html2canvas-ignore>';
    rarity_jump_html += '  <span class="pr-2">Jump to</span>';
    rarity_jump_html += '  <div class="d-flex flex-wrap">' + rarity_jump_btn + '</div>';
    rarity_jump_html += '</div>';
  }

  html = rarity_jump_html + html;

  } else {
    html = "<p>No units found...</p>";
  }

  return html;

}

function getUnitImage(unit) {
    var unitImage = '/assets/game/units/unit_icon_' + unit.id.substr(0,7);
    var formToDisplay = unit.max_rarity;
    if (unit.max_rarity == 'NV' && unit.min_rarity != 'NV') {
        unitImage += '1';
    } else {
        unitImage += unit.id.substr(7,1);
    }
    if (unit.max_rarity == 'NV') {
        unitImage += '7';
    } else {
        if (unit.max_rarity == 7 && ownedUnits[unit.id] && !ownedUnits[unit.id].sevenStar) {
            unitImage += '6';
        } else {
            unitImage += unit.max_rarity;
        }
    }
    unitImage += '.png'
    return unitImage;
}

function getUnitDisplay(unit, useTmrName = false) {
  var html = "";

  if (!onlyShowOwnedUnits || ownedUnits[unit.id]) {
    var is7Stars        = ownedUnits[unit.id] && ownedUnits[unit.id].sevenStar,
        unitAffixes     = '',
        unitCrystalType = '',
        unitDisplayName = '',
        unitNameIcon    = '';

      if (ownedUnits[unit.id] && (ownedUnits[unit.id].number || ownedUnits[unit.id].sevenStar)) {
        unitAffixes += ' owned';
      } else {
        unitAffixes += ' notOwned';
      }

      if (ownedUnits[unit.id] && ownedUnits[unit.id].tmrMoogles) {
        unitAffixes += ' tmrMoogles';
      }

      if (ownedUnits[unit.id] && ownedUnits[unit.id].farmable > 0) {
        unitAffixes += ' farmable';
      }

      if (ownedUnits[unit.id] && ownedUnits[unit.id].farmableStmr > 0) {
        unitAffixes += ' farmableStmr';
      }

      if (!unit.unreleased7Star && unit.max_rarity == 7 && ownedUnits[unit.id] && ownedUnits[unit.id].number >= 1) {
        unitAffixes += ' awakenable';
      }

      if (unit.summon_type === 'event') {
        unitAffixes += ' timeLimited';
      }

      if (is7Stars) {
        unitAffixes += ' sevenStars';
      } else {
        unitAffixes += ' notSevenStars';
      }

      if (unit.max_rarity == 7) {
        unitAffixes += ' showStmr';
      }

      if (unit.min_rarity == 3) {
        unitCrystalType = 'crystal-blueCrystal';
      } else if (unit.min_rarity == 4) {
        unitCrystalType = 'crystal-goldCrystal';
      } else if (unit.min_rarity == 5) {
        unitCrystalType = 'crystal-rainbowCrystal';
      }

      if (useTmrName) {
        unitDisplayName = toLink(tmrByUnitId[unit.id].name);
      } else {
        unitDisplayName = toLink(unit.name, unit.name, true);
      }

      if (unit.summon_type === 'event') {
        unitNameIcon = '<span class="fa fa-clock"></span>';
      }

      html += '<div class="col-6 col-sm-6 col-md-4 mb-4 unit ' + unit.id + unitAffixes + '" data-unit="' + unit.id + '">';
      html += '  <div class="ffbe_content--well rounded border p-2 h-100">';
      html += '    <div class="row align-items-center">';
      html += '      <div class="col-12 col-md-2">';
      html += '        <div class="form-row align-items-center justify-content-center">';
      html += '          <div class="col-auto col-sm-12"><div class="d-flex align-items-center justify-content-sm-between"><i class="icon icon-xs crystal-sevenStarCrystal"></i><span class="ml-1 w-100 ownedNumber badge badge-success sevenStar">' + (ownedUnits[unit.id] ? (ownedUnits[unit.id].sevenStar || 0) : 0) + '</span></div></div>';
      html += '          <div class="col-auto col-sm-12"><div class="d-flex align-items-center justify-content-sm-between my-0 my-sm-1"><i class="icon icon-xs ' + unitCrystalType + '"></i><span class="ml-1 w-100 ownedNumber base badge badge-success">' + (ownedUnits[unit.id] ? ownedUnits[unit.id].number : 0) + '</span></div></div>';
      html += '          <div class="col-auto col-sm-12"><div class="d-flex align-items-center justify-content-sm-between"><i class="icon icon-xs crystal-tmr"></i><span class="ml-1 w-100 ownedNumber badge badge-success" data-toggle="tooltip" title="' + ((ownedUnits[unit.id] && ownedUnits[unit.id].tmrMoogles) ? ownedUnits[unit.id].tmrMoogles.map(p => p + '%').join(', ') : '') + '">' + ((ownedUnits[unit.id] && ownedUnits[unit.id].tmrMoogles) ? ownedUnits[unit.id].tmrMoogles.length : 0) + '</span></div></div>';
      html += '        </div>';
      html += '      </div>';
      html += '      <div class="col-12 col-md justify-content-center">';
      html += '        <div class="form-row align-items-center">';
      html += '          <div class="col-auto"><img class="unitImage lazyload" data-src="' + getUnitImage(unit) + '"/></div>';
      html += '          <div class="col">';
      html += '            <div class="d-flex font-weight-bold unitName"><span class="mr-auto">' + unitDisplayName + '</span><span class="ml-auto">' + unitNameIcon + '</span></div>';
      html += '            <div class="d-block unitRarity">' + getRarity(unit.min_rarity, (unit.unreleased7Star ? 6 : unit.max_rarity)) + '</div>';
      html += '            <div class="d-block mt-1 text-sm">';
      html += '              <div class="d-flex justify-content-center">';

      if (readOnly) {
        if (is7Stars) {
          let farmedStmr = ownedUnits[unit.id] ? (ownedUnits[unit.id].farmedStmr || 0) : 0;
          html += '  <div class="d-flex align-items-center mr-3 stmr" data-toggle="unittrust" data-type="STMR" id="STMR_' + unit.id + '" data-unit="' + unit.id + '">STMR<span class="ml-1 badge badge-success sevenStar">' + farmedStmr + '</span></div>';
        }

        let farmedTmr = ownedUnits[unit.id] ? (ownedUnits[unit.id].farmed || 0) : 0;
        html += '    <div class="d-flex align-items-center-sm tmr" data-toggle="unittrust" data-type="TMR" id="TMR_' + unit.id + '" data-unit="' + unit.id + '">TMR<span class="ml-1 badge badge-success">' + farmedTmr + '</span></div>';
      } else {
        if (tmrByUnitId[unit.id]) {
          let farmedSTMR = stmrNumberByUnitId[unit.id] || 0;
          let farmableSTMR = (ownedUnits[unit.id] ? (ownedUnits[unit.id].farmableStmr || 0) : 0);
          html += '<div class="d-flex align-items-center mr-3 stmr trustCounter" data-toggle="unittrust" data-type="STMR" data-unit="' + unit.id + '">STMR<span class="ml-1 badge badge-success sevenStar"><span class="farmedSTMR">' + farmedSTMR + '</span>/<span class="totalSTMR">' + (farmedSTMR + farmableSTMR) + '</span></span></div>'
          let farmedTMR = tmrNumberByUnitId[unit.id] || 0;
          let farmableTMR = (ownedUnits[unit.id] ? (ownedUnits[unit.id].farmable || 0) : 0);
          html += '<div class="d-flex align-items-center tmr trustCounter" data-toggle="unittrust" data-type="TMR" data-unit="' + unit.id + '">TMR<span class="ml-1 badge badge-success"><span class="farmedTMR">' + farmedTMR + '</span>/<span class="totalTMR">' + (farmedTMR + farmableTMR) + '</span></span></div>'
        }
      }

      html += '               </div>';
      html += '            </div>';
      html += '          </div>';
      html += '        </div>';
      html += '      </div>';

      if (!readOnly) {
        html += '    <div class="col-12 col-md-3 actions">';
        html += '      <div class="row no-gutters align-items-center mt-2 mt-md-0">';
        html += '        <div class="col-auto col-md-12 d-flex align-items-center mr-auto">';
        html += '          <button class="btn btn-xs btn-ghost w-100 mb-0 mb-md-1 mr-1 modifyCounterButton" onclick="event.stopPropagation();addToOwnedUnits(\'' + unit.id + '\')" data-toggle="tooltip" title="Add one ' + unit.name + ' to your collection" type="button"><span class="fa fa-fw fa-plus"></span></button>';
        html += '          <button class="btn btn-xs btn-ghost w-100 mb-0 mb-md-1" onclick="event.stopPropagation();editUnit(\'' + unit.id + '\')" data-toggle="tooltip" title="Edit unit values" type="button"><span class="fa fa-fw fa-edit"></span></button>';
        html += '        </div>';

        html += '        <div class="col-auto col-md-12 d-flex align-items-center mx-auto">';
        html += '          <button class="btn btn-xs btn-ghost w-100 mr-1 farmedButton tmr" onclick="event.stopPropagation();farmedTMR(' + unit.id + ')" data-toggle="tooltip" title="TMR Farmed ! Click here to indicate you farmed this TMR. It will add 1 of this TMR to your inventory" type="button"><span class="fa fa-fw fa-star"></span></button>';
        html += '          <button class="btn btn-xs btn-ghost w-100 farmedButton stmr" onclick="event.stopPropagation();farmedSTMR(' + unit.id + ')" data-toggle="tooltip" title="STMR Farmed ! Click here to indicate you farmed this STMR. It will add 1 of this STMR to your inventory" type="button"><span class="fa fa-hand-sparkles fa-fw"></span></button>';
        html += '        </div>';

        if (unit.max_rarity == 7) {
          html += '      <div class="col-auto col-md-12 d-flex align-items-center ml-auto">';
          html += '        <button class="btn btn-xs btn-ghost btn-block awakenButton mt-0 mt-md-1" onclick="event.stopPropagation(); awaken(' + unit.id + ')"  data-toggle="tooltip" title="Awaken this unit !" type="button"><span class="fa fa-gem fa-fw"></span></button>';
          html += '      </div>';
        }

        html += '      </div>';
        html += '    </div>';
      }

      html += '    </div>';
      html += '  </div>';
      html += '</div>';

    }
    return html;
}

function updateUnitDisplay(unitId) {
    let unit = units[unitId];
    let is7Stars = !!(ownedUnits[unitId] && ownedUnits[unitId].sevenStar);
    let owned = !!ownedUnits[unitId];
    let farmable = ownedUnits[unitId] && ownedUnits[unitId].farmable > 0;
    let farmableStmr = ownedUnits[unitId] && ownedUnits[unitId].farmableStmr > 0;
    let hasTmrMoogles = !!(ownedUnits[unitId] && ownedUnits[unitId].tmrMoogles && ownedUnits[unitId].tmrMoogles.length > 0) ;
    let awakenable = !unit.unreleased7Star && unit.max_rarity == 7 && ownedUnits[unitId] && ownedUnits[unitId].number >= 1;

    let div = $(".unit." + unitId);
    div.toggleClass("owned", owned);
    div.toggleClass("notOwned", !owned);
    div.toggleClass("tmrMoogles", hasTmrMoogles);
    div.toggleClass("sevenStars", is7Stars);
    div.toggleClass("notSevenStars", !is7Stars);
    div.toggleClass("farmable", farmable);
    div.toggleClass("farmableStmr", farmableStmr);
    div.toggleClass("awakenable", awakenable);

    let ownedNumber = ownedUnits[unitId] ? ownedUnits[unitId].number: 0;
    div.find(".ownedNumber.base.badge").html(ownedNumber);

    div.find(".sevenStarNumber").toggleClass("hidden", !is7Stars);
    if (is7Stars) {
        let owned7Stars = ownedUnits[unitId].sevenStar || 0;
        div.find(".ownedNumber.sevenStar.badge").html(owned7Stars);
    }
    if (hasTmrMoogles) {
        let counter = div.find(".tmrMoogles .ownedNumber");
        counter.html(ownedUnits[unitId].tmrMoogles.length);
        counter.prop('title', ownedUnits[unitId].tmrMoogles.map(n => n + '%').join(', '));
    }

    if (owned) {
        let tmr;
        let stmr;
        for (var index = data.length; index--;) {
            if (data[index].tmrUnit && data[index].tmrUnit == unitId) {
                tmr = data[index];
            }
            if (data[index].stmrUnit && data[index].stmrUnit == unitId) {
                stmr = data[index];
            }
            if (tmr && stmr) {
                break;
            }
        }
        if (tmr) {
            div.find(".farmedTMR").html(itemInventory[tmr.id] || 0);
            div.find(".totalTMR").html((itemInventory[tmr.id] || 0) + (ownedUnits[unitId].farmable || 0));
        }
        if (stmr) {
            div.find(".farmedSTMR").html(itemInventory[stmr.id] || 0);
            div.find(".totalSTMR").html((itemInventory[stmr.id] || 0) + (ownedUnits[unitId].farmableStmr || 0));
        }
    }

}

function getRarity(minRarity, maxRarity) {
    let nv = false;
    if (minRarity == 'NV') {
        minRarity = 7;
    }
    if (maxRarity == 'NV') {
        nv = true;
        maxRarity = 7;
    }
    var html = '';
    for (var rarityIndex = 0; rarityIndex < minRarity; rarityIndex++ ) {
        html += '★';
    }
    for (var rarityIndex = 0; rarityIndex < (maxRarity - minRarity); rarityIndex++ ) {
        html += '☆';
    }
    if (nv) {
        html += '<img src="img/icons/NV.png">'
    }
    return html;
}


function addToOwnedUnits(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId]) {
        ownedUnits[unitId] = {"number":0, "farmable":0};
    }

    ownedUnits[unitId].number += 1;
    let ownedUnitsCount = ownedUnits[unitId].number + (ownedUnits[unitId].sevenStar || 0) * 2;
    if (!tmrNumberByUnitId[unitId] || (tmrNumberByUnitId[unitId] < ownedUnitsCount)) {
        ownedUnits[unitId].farmable += 1;
    }
    updateUnitDisplay(unitId);
    markSaveNeeded();
    displayStats();
}


function farmedTMR(unitId) {
    for (var index = data.length; index--;) {
        if (data[index].tmrUnit && data[index].tmrUnit == unitId) {
            if (itemInventory[data[index].id]) {
                itemInventory[data[index].id] += 1;
            } else {
                itemInventory[data[index].id] = 1;
            }
            break;
        }
    }
    ownedUnits[unitId].farmable -= 1;
    tmrNumberByUnitId[unitId] = itemInventory[data[index].id];
    updateUnitDisplay(unitId);
    markSaveNeeded();
}

function farmedSTMR(unitId) {
    let buttons = [];
    if (ownedUnits[unitId].sevenStar >= 2) {
        buttons.push({
            text: "Fused a 7*",
            className: "",
            onClick: function() {
                ownedUnits[unitId].farmableStmr -= 2;
                ownedUnits[unitId].sevenStar -= 1;
                farmedSTMRFollowUp(unitId);
            }
        })
    }
    if (ownedUnits[unitId].number >= 2) {
        buttons.push({
            text: "Fused two 5/6*",
            className: "",
            onClick: function() {
                ownedUnits[unitId].farmableStmr -= 1;
                ownedUnits[unitId].number -= 2;
                farmedSTMRFollowUp(unitId);
            }
        })
    }
    if (ownedUnits[unitId].number >= 1) {
        buttons.push({
            text: "Fused one 5/6* and a Super Trust Moogle",
            className: "",
            onClick: function() {
                ownedUnits[unitId].farmableStmr -= 1;
                ownedUnits[unitId].number -= 1;
                farmedSTMRFollowUp(unitId);
            }
        })
    }
    buttons.push({
        text: "Fused Super Trust Moogles",
        className: "",
        onClick: function() {
            ownedUnits[unitId].farmableStmr -= 1;
            farmedSTMRFollowUp(unitId);
        }
    })
    Modal.show({
        title: 'Farmed ' + units[unitId].name + ' STMR',
        body: '<p>How was it created?</p>',
        withCancelButton: true,
        buttons: buttons
    });

}

function farmedSTMRFollowUp(unitId) {
    for (var index = data.length; index--;) {
        if (data[index].stmrUnit && data[index].stmrUnit == unitId) {
            if (itemInventory[data[index].id]) {
                itemInventory[data[index].id] += 1;
            } else {
                itemInventory[data[index].id] = 1;
            }
            break;
        }
    }
    stmrNumberByUnitId[unitId] = itemInventory[data[index].id];
    updateUnitDisplay(unitId);
    markSaveNeeded();
}

function awaken(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId] || ownedUnits[unitId].number < 1 || units[unitId].max_rarity != 7) {
        return;
    }
    if (ownedUnits[unitId].number == 1) {
        ownedUnits[unitId].number -= 1;
        awakenFollowUp(unitId);
    } else {
        Modal.show({
            title: 'Awaken ' + units[unitId].name,
            body: '<p>How to awaken?</p>',
            withCancelButton: true,
            buttons: [
                {
                    text: "Awaken using 2 units",
                    className: "",
                    onClick: function() {
                        ownedUnits[unitId].number -= 2;
                        awakenFollowUp(unitId);
                    }
                },
                {
                    text: "Awaken using 1 unit and a prism",
                    className: "",
                    onClick: function() {
                        ownedUnits[unitId].number -= 1;
                        awakenFollowUp(unitId);
                    }
                }
            ]
        });
    }
}

function awakenFollowUp(unitId) {
    if (ownedUnits[unitId].number < 1) {
        $(".unit." + unitId).removeClass("awakenable");
    }

    if (!ownedUnits[unitId].sevenStar) {
        ownedUnits[unitId].sevenStar = 0;
        ownedUnits[unitId].farmableStmr = 0;
    }
    ownedUnits[unitId].sevenStar++;
    ownedUnits[unitId].farmableStmr++;
    updateUnitDisplay(unitId);
    markSaveNeeded();
}

function editUnit(unitId) {
    if (!ownedUnits[unitId]) {
        ownedUnits[unitId] = {"number":0, "farmable":0, "sevenStar":0, "farmableStmr":0};
    }
    let form = '<form>' +
      '<div class="form-group form-row align-items-center">' +
        '<label class="col-form-label col-4" for="ownedNumber">Owned number</label>' +
        '<div class="col"><input type="number" class="form-control" id="ownedNumber" aria-describedby="emailHelp" placeholder="Enter owned number" value="' + ownedUnits[unitId].number + '"></div>' +
      '</div>'+
      '<div class="form-group form-row align-items-center">' +
        '<label class="col-form-label col-4"  for="farmableTMR">Number of TMR that can still be farmed</label>' +
        '<div class="col"><input type="number" class="form-control" id="farmableTMR" aria-describedby="emailHelp" placeholder="Enter farmable TMR number" value="' + ownedUnits[unitId].farmable + '"></div>' +
      '</div>';
    let unit = units[unitId];
    if (unit.max_rarity == '7') {
        form += '<div class="form-group form-row align-items-center">' +
            '<label class="col-form-label col-4"  for="ownedSeventStarNumber">Owned 7* number</label>' +
            '<div class="col"><input type="number" class="form-control" id="ownedSeventStarNumber" aria-describedby="emailHelp" placeholder="Enter owned number" value="' + (ownedUnits[unitId].sevenStar || 0) + '"></div>' +
          '</div>'+
          '<div class="form-group form-row align-items-center">' +
            '<label class="col-form-label col-4"  for="farmableSTMR">Number of STMR that can still be farmed</label>' +
            '<div class="col"><input type="number" class="form-control" id="farmableSTMR" aria-describedby="emailHelp" placeholder="Enter farmable STMR number" value="' + (ownedUnits[unitId].farmableStmr || 0) + '"></div>' +
          '</div>';
    }
    if (tmrByUnitId[unitId]) {
        form += '<div class="form-group form-row align-items-center">' +
            '<label class="col-form-label col-4"  for="tmrMoogles">TMR Moogles owned</label>' +
            '<div class="col"><input type="text" class="form-control" id="tmrMoogles" aria-describedby="emailHelp" placeholder="Enter values of tmr moogles, separated by coma" value="' + (ownedUnits[unitId].tmrMoogles? ownedUnits[unitId].tmrMoogles.join(", ") : "") + '"></div>' +
            '</div>'
    }
    form += '</form>';
    Modal.show({
            title: 'Edit ' + unit.name,
            body: form,
            withCancelButton: true,
            buttons: [
                {
                    text: "Save",
                    className: "",
                    onClick: function() {
                        ownedUnits[unitId].number = parseInt($("#ownedNumber").val() || 0);
                        ownedUnits[unitId].farmable = parseInt($("#farmableTMR").val() || 0);
                        if (unit.max_rarity == '7') {
                            ownedUnits[unitId].sevenStar = parseInt($("#ownedSeventStarNumber").val() || 0);
                            ownedUnits[unitId].farmableStmr = parseInt($("#farmableSTMR").val() || 0);
                        }
                        let tmrMooglesText = $('#tmrMoogles').val();
                        let tmrMoogles = [];
                        if (tmrMooglesText) {
                            tmrMooglesText.split(",").forEach(text => {
                                text = text.trim();
                                if (isNaN(text) || !text) {
                                    $('#tmrMoogles').addClass("has-error");
                                    throw "wrong value for Tmr Moogles"
                                } else {
                                    tmrMoogles.push(+text);
                                }
                            });
                        }
                        $('#tmrMoogles').removeClass("has-error");
                        if (tmrMoogles.length > 0) {
                            ownedUnits[unitId].tmrMoogles = tmrMoogles;
                        } else {
                            delete ownedUnits[unitId].tmrMoogles;
                        }
                        if (ownedUnits[unitId].number == 0 && ownedUnits[unitId].farmable == 0 && !ownedUnits[unitId].tmrMoogles) {
                            if (unit.max_rarity != '7' || (ownedUnits[unitId].sevenStar == 0 && ownedUnits[unitId].farmableStmr == 0)) {
                                delete ownedUnits[unitId];
                            }
                        }
                        updateUnitDisplay(unitId);
                        markSaveNeeded();
                    }
                }
            ]
        });
}

function markSaveNeeded() {
    saveNeeded = true;
    savePublicLinkNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    if (savePublicLinkTimeout) {clearTimeout(savePublicLinkTimeout)}
    mustSaveInventory = true;
    saveTimeout = setTimeout(saveUserData,3000, mustSaveInventory, true, false);
    savePublicLinkTimeout = setTimeout(savePublicLink, 10000);
}

function savePublicLink(callback) {
    var publicUnitcollection = {};
    for (var index = 0, len = releasedUnits.length; index < len; index++) {
        var unit = releasedUnits[index];
        if (ownedUnits[unit.id]) {
            var publicUnit = {
                "number": ownedUnits[unit.id].number,
                "farmed": (tmrNumberByUnitId[unit.id] ? tmrNumberByUnitId[unit.id] : 0)
            }
            if (ownedUnits[unit.id].sevenStar) {
                publicUnit.sevenStar = ownedUnits[unit.id].sevenStar;
                publicUnit.farmedStmr = (stmrNumberByUnitId[unit.id] ? stmrNumberByUnitId[unit.id] : 0)
            }
            publicUnitcollection[unit.id] = publicUnit;
        }
    }

    $.ajax({
        url: server + '/publicUnitCollection',
        method: 'PUT',
        data: JSON.stringify(publicUnitcollection),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            $.notify("Public link updated", "success");
            savePublicLinkNeeded = false;
            userSettings.unitCollection = data.id;
            if (callback) {callback(data.id)}
        },
        error: function() { $.notify("Error while updating public link", "error"); }
    });
}

function showPublicUnitCollectionLink() {
    if (savePublicLinkNeeded || !userSettings.unitCollection) {
        savePublicLink(showPublicUnitCollectionLink)
    } else {
        Modal.showWithBuildLink("unit collection", "units.html?server=" + server + '&o#' + userSettings.unitCollection);
    }
}

function filterName(units) {
    var result = [];
    var textToSearch = $("#searchBox").val();
    if (textToSearch) {
        textToSearch = textToSearch.toLowerCase();
        var tokens = textToSearch.split(' ');
        for (var i = 0; i < tokens.length; i++){
            tokens[i] = tokens[i].toLowerCase();
        }
        unitLoop: for (var index = units.length; index--;) {
            for (var i = 0; i < tokens.length; i++){
                var unit = units[index];
                if (unit.name.toLowerCase().indexOf(tokens[i]) < 0 && !unit.equip.includes(tokens[i])) {
                    continue unitLoop;
                }
            }
            result.push(unit);
        }
    } else {
        return units;
    }
    return result;
}

function filterTMRName(units) {
    var result = [];
    var textToSearch = $("#searchBox").val();
    if (textToSearch) {
        textToSearch = textToSearch.toLowerCase();
        for (var index = units.length; index--;) {
            var unit = units[index];
            if (tmrByUnitId[unit.id] && tmrByUnitId[unit.id].name.toLowerCase().indexOf(textToSearch) >= 0) {
                result.push(unit);
            }
        }
    } else {
        for (var index = units.length; index--;) {
            var unit = units[index];
            if (tmrByUnitId[unit.id]) {
                result.push(unit);
            }
        }
    }
    return result;
}

function keepOnlyOneOfEachMateria() {
    var idsAlreadyKept = [];
    var result = [];
    for (var index in data) {
        var item = data[index];
        if (item.type == "materia" && !item.access.includes("not released yet") && !idsAlreadyKept.includes(item.id)) {
            result.push(item);
            idsAlreadyKept.push(item.id);
        }
    }
    return result;
}

function sortAlphabetically(units) {
    return units.sort(function (unit1, unit2){
        return unit1.name.localeCompare(unit2.name);
    });
};

function sortTMRAlphabetically(units) {
    return units.sort(function (unit1, unit2){
        return tmrByUnitId[unit1.id].name.localeCompare(tmrByUnitId[unit2.id].name);
    });
};

function sortByRarity(units) {
    var unitsToSort = Object.values(units).slice();
    return unitsToSort.sort(function (unit1, unit2){
        var maxRarity1 = unit1.max_rarity == 'NV' ? 8 : unit1.max_rarity;
        var maxRarity2 = unit2.max_rarity == 'NV' ? 8 : unit2.max_rarity
        if (maxRarity1 == 7 && unit1.unreleased7Star) {
            maxRarity1 = 6;
        }
        if (maxRarity2 == 7 && unit2.unreleased7Star) {
            maxRarity2 = 6;
        }
        if (maxRarity1 == maxRarity2) {
            if (unit1.min_rarity == unit2.min_rarity) {
                return unit1.name.localeCompare(unit2.name);
            } else {
                var minRarity1 = unit1.min_rarity == 'NV' ? 8 : unit1.min_rarity;
                var minRarity2 = unit2.min_rarity == 'NV' ? 8 : unit2.min_rarity
                return minRarity2 - minRarity1;
            }
        } else {
            return maxRarity2 - maxRarity1;
        }
    });
}

function sortByBaseRarity(units) {
    return units.sort(function (unit1, unit2){
        if (unit1.min_rarity == unit2.min_rarity) {
            return unit1.name.localeCompare(unit2.name);
        } else {
            return unit2.min_rarity - unit1.min_rarity;
        }
    });
}

function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#unitsWrapper").addClass("hidden");
    onDataReady();
}

function updateResults() {
    currentSort();
}

function inventoryLoaded() {
    onDataReady();
}

function prepareData() {
    for (var index = data.length; index--; ) {
        var item = data[index];
        if (item.tmrUnit) {
            if (itemInventory[item.id]) {
                tmrNumberByUnitId[item.tmrUnit] = itemInventory[item.id];
            }
            tmrByUnitId[item.tmrUnit] = item;
        }
        if (item.stmrUnit) {
            if (itemInventory[item.id]) {
                stmrNumberByUnitId[item.stmrUnit] = itemInventory[item.id];
            }
            if (!stmrByUnitId[item.stmrUnit]) {
                stmrByUnitId[item.stmrUnit] = item;
            }
        }
    }
}

function exportAsImage(minRarity = 1) {
    $("body").addClass("loading");
    var savedSort = currentSort;
    onlyShowOwnedUnits = true;
    showNumberTMRFarmed = true;
    showRaritySort(minRarity);
    if (minRarity != 1) {
        $("#results").addClass("hackForImage5");
    } else {
        $("#results").addClass("hackForImage");
    }
    setTimeout(function() {
        lazyLoader.loadAll();
        setTimeout(function() {
            html2canvas($("#results")[0]).then(function(canvas) {
                canvas.toBlob(function (blob) {
                    saveAs(blob, "FFBE_Equip - Unit collection.png");
                    onlyShowOwnedUnits = false;
                    showNumberTMRFarmed = false;
                    savedSort();
                    $("#results").removeClass("hackForImage");
                    $("#results").removeClass("hackForImage5");

                    $("body").removeClass("loading");
                });
            });
        });
    }, 1);

}

function exportAsCsv() {
    var csv = "Unit Id; Unit Name;Min Rarity;Max Rarity;Number Owned (not 7*); 7* Number owned;Number of TMR owned;Number of STMR owned;Number of TMR still farmable;Number of STMR still obtainable\n";
    var sortedUnits = sortByRarity(units);
    for (var index = 0, len = sortedUnits.length; index < len; index++) {
        var unit = sortedUnits[index];
        if (ownedUnits[unit.id]) {
            var maxRarity = (unit.unreleased7Star ? 6 : unit.max_rarity)
            csv +=  "\"" + unit.id + "\";" +
                "\"" + unit.name + "\";" +
                unit.min_rarity + ';' +
                maxRarity + ';' +
                ownedUnits[unit.id].number + ';' +
                (ownedUnits[unit.id].sevenStar || 0) + ';' +
                (tmrNumberByUnitId[unit.id] ? tmrNumberByUnitId[unit.id] : 0) + ';' +
                (stmrNumberByUnitId[unit.id] ? stmrNumberByUnitId[unit.id] : 0) + ';' +
                ownedUnits[unit.id].farmable + ';' +
                (ownedUnits[unit.id].farmableStmr || 0) + '\n';
        }
    }
    window.saveAs(new Blob([csv], {type: "text/csv;charset=utf-8"}), 'FFBE_Equip - Unit collection.csv');
}

function exportAsText() {
    var text = "";
    var sortedUnits = sortByBaseRarity(releasedUnits);
    var currentBaseRarity;
    first = true;
    for (var index = 0, len = sortedUnits.length; index < len; index++) {
        var unit = sortedUnits[index];
        if (ownedUnits[unit.id]) {
            if (!currentBaseRarity || currentBaseRarity != unit.min_rarity) {
                if (currentBaseRarity) {
                    text += "\n\n";
                }
                text += "Base " + unit.min_rarity + "★  \n";
                currentBaseRarity = unit.min_rarity;
                first = true;
            }
            if (first) {
                first = false;
            } else {
                text += ", ";
            }
            text +=  unit.name;
            if (ownedUnits[unit.id] && ownedUnits[unit.id].number > 1) {
                text += " x" + ownedUnits[unit.id].number;
            }
        }
    }
    Modal.showWithTextData("Owned units", text);
}

function importUnits() {
  var bodyHTML  = '<div class="alert alert-info">This feature is a Work in Progress. It will override your unit collection on FFBE Equip!</div>';
      bodyHTML += '<div class="custom-file mt-3 mb-2">';
      bodyHTML += '  <input type="file" id="importFile" class="custom-file-input" name="importFile" onchange="treatImportFile"/>';
      bodyHTML += '  <label class="custom-file-label" for="importFile">Choose file</label>';
      bodyHTML += '</div>';
      bodyHTML += '<div class="ffbe_content--well p-3 rounded border text-sm" id="importSummary"><a href="https://www.reddit.com/r/FFBraveExvius/comments/dd8ljd/ffbe_sync_is_back/">Instructions to import your data directly from the game</a> (requires login to FFBE with Facebook or Google)</div>';

  if (!baseUnitIdBySpecificRarityUnitId) {
    baseUnitIdBySpecificRarityUnitId = {};
    releasedUnits.forEach(unit => {
      let unitIdBase = unit.id.substring(0,unit.id.length - 1);
      for (i = parseInt(unit.min_rarity); i <= parseInt(unit.max_rarity); i++) {
        baseUnitIdBySpecificRarityUnitId[unitIdBase + i] = unit.id;
      }
    });
  }

  if (!baseUnitIdByTmrId) {
    baseUnitIdByTmrId = {};
    data.forEach(equip => {
      if (equip.tmrUnit) {
        baseUnitIdByTmrId[equip.id] = equip.tmrUnit;
      }
    })
  }

  importedOwnedUnit = null;

  Modal.show({
    title: "Import unit collection",
    body: bodyHTML,
    buttons: [{
      text: "Import",
      onClick: function() {
        if (importedOwnedUnit) {
          ownedUnits = importedOwnedUnit;
          markSaveNeeded();
          saveUserData(false, true, false);
          savePublicLink();
          showRaritySort();
        } else {
          Modal.show("Please select a file to import");
        }
      }
    }]
  });

  $('#importFile').change(treatImportFile);
}

let baseUnitIdBySpecificRarityUnitId = null;
let baseUnitIdByTmrId = null;
let importedOwnedUnit;

function treatImportFile(evt) {
    var f = evt.target.files[0]; // FileList object

    var reader = new FileReader();

    reader.onload = function(){
        try {
            let temporaryResult = JSON.parse(reader.result);
            var errors = importValidator.validate('units', temporaryResult);

            // validation was successful
            if (errors) {
                Modal.showMessage("imported file doesn't have the correct form : " + JSON.stringify(errors));
                return;
            }
            importedOwnedUnit = {};
            temporaryResult.forEach(unit => {
                if (!unit.id) {
                    Modal.showMessage("unit doesn't have id : " + JSON.stringify(unit));
                    importedOwnedUnit = null;
                    return;
                } else {
                    if (unit.id == '904000115' && unit.tmr < 1000) {
                        let baseUnitId = baseUnitIdByTmrId[unit.tmrId]
                        if (baseUnitId) {
                            if (!importedOwnedUnit[baseUnitId]) {
                                importedOwnedUnit[baseUnitId] = {"number":0,"farmable":1,"sevenStar":0,"farmableStmr":0};
                            } else {
                                importedOwnedUnit[baseUnitId].farmable++;
                            }
                        }
                    } else if (unit.id == '904000103') {
                        let baseUnitId = baseUnitIdByTmrId[unit.tmrId]
                        if (baseUnitId) {
                            if (!importedOwnedUnit[baseUnitId]) {
                                importedOwnedUnit[baseUnitId] = {"number":0,"farmable":0,"sevenStar":0,"farmableStmr":0, "tmrMoogles": []};
                            } else {
                                if (!importedOwnedUnit[baseUnitId].tmrMoogles) {
                                    importedOwnedUnit[baseUnitId].tmrMoogles = [];
                                }
                            }
                            importedOwnedUnit[baseUnitId].tmrMoogles.push(unit.tmr / 10);
                        }
                    } else if (!unit.id.startsWith('9')) {
                        let baseUnitId = baseUnitIdBySpecificRarityUnitId[unit.id];
                        if (!baseUnitId) {
                            Modal.showMessage('unknown unit id : ' + unit.id);
                            importedOwnedUnit = null;
                            return;
                        }
                        if (!importedOwnedUnit[baseUnitId]) {
                            importedOwnedUnit[baseUnitId] = {"number":0,"farmable":0,"sevenStar":0,"farmableStmr":0};
                        }
                        if (unit.tmr < 1000) {
                            importedOwnedUnit[baseUnitId].farmable++;
                        }
                        if (unit.id.endsWith("7")) {
                            if (!importedOwnedUnit[baseUnitId].sevenStar) {
                                importedOwnedUnit[baseUnitId].sevenStar = 0;
                                importedOwnedUnit[baseUnitId].farmableStmr = 0;
                            }
                            importedOwnedUnit[baseUnitId].sevenStar++;
                            if (unit.stmr < 1000) {
                                importedOwnedUnit[baseUnitId].farmableStmr++;
                            }
                        } else {
                          importedOwnedUnit[baseUnitId].number++;
                        }
                    }
                }
            });
            $('#importSummary').text('Units to import : ' + Object.keys(importedOwnedUnit).length);
        } catch(e) {
            Modal.showError('imported file is not in json format', e);
        }

    };
    reader.readAsText(f);

}

function onDataReady() {
    if (releasedUnits && data) {
        if (window.location.hash.length > 1 && isLinkId(window.location.hash.substr(1))) {
            $.ajax({
                accepts: "application/json",
                url: "https://firebasestorage.googleapis.com/v0/b/" + window.clientConfig.firebaseBucketUri + "/o/UnitCollections%2F" + window.location.hash.substr(1) + ".json?alt=media",
                success: function (result) {
                    ownedUnits = result;
                    tmrNumberByUnitId = {};
                    for (var id in ownedUnits) {
                        tmrNumberByUnitId[id] = ownedUnits[id].farmed;
                        stmrNumberByUnitId[id] = ownedUnits[id].farmedStmr;
                    }
                    showNumberTMRFarmed= true;
                    showRaritySort();
                    displayStats();
                },
                error: function (textStatus, errorThrown) {
                    $.notify("Error : no data found", "error");
                    console.log(textStatus, errorThrown);
                }
            });
        } else if (itemInventory && ownedUnits) {
            prepareData();
            showRaritySort();
            displayStats();
        }
    }
}

// will be called by common.js at page load
function startPage() {
    if (window.location.hash.length > 1 && isLinkId(window.location.hash.substr(1))) {
        $('body').addClass("readOnly");
        readOnly = true;
    }

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    getStaticData("units", true, function(unitResult) {
        units = unitResult;
        Object.keys(units).forEach(unitId => {
           if (units[unitId].braveShifted) {
               delete units[unitId];
           }
        });
        getStaticData("releasedUnits", false, function(releasedUnitResult) {
            releasedUnits = [];
            for (var unitId in unitResult) {
                if (releasedUnitResult[unitId]) {
                    unitResult[unitId].summon_type = releasedUnitResult[unitId].type;
                    releasedUnits.push(unitResult[unitId]);
                }
            }
            onDataReady();
        });
    });
    getStaticData("data", true, function(result) {
        data = result;
        onDataReady();
        getStaticData("lastItemReleases", false, function(result) {
            lastItemReleases = result;
        });
    });


    $("#results").addClass(server);

    var $window = $(window);

    $window.on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !";
        }
        if (savePublicLinkNeeded) {
            savePublicLink();
        }
    });

    $window.on('keyup', function (e) {
        // Reset search if escape is used
        if (e.keyCode === 27) {
            $("#searchBox").val('').trigger('input').focus();
        }
    });

    $("#searchBox").on("input", $.debounce(300,updateResults));

    $("#onlyOwnedUnits").on('input', function () {
        let checked = $("#onlyOwnedUnits").prop('checked');
        $(".onlySevenStarInoutGroup").toggleClass('hidden', !checked);
        if (!checked) {
            $("#onlySevenStar").prop('checked', false);
        }
        $('#results').toggleClass('onlyOwnedUnits', checked);
        $('#results').removeClass('onlySevenStar');
    });
    $("#onlyTimeLimited").on('input', function () {
        $('#results').toggleClass('onlyTimeLimited', $("#onlyTimeLimited").prop('checked'));
    });
    $("#onlySevenStar").on('input', function () {
        $('#results').toggleClass('onlySevenStar', $("#onlySevenStar").prop('checked'));
    });
    $("#onlyTmrMoogles").on('input', function () {
        $('#results').toggleClass('onlyTmrMoogles', $("#onlyTmrMoogles").prop('checked'));
    });
    $('#results').toggleClass('onlyOwnedUnits', $("#onlyOwnedUnits").prop('checked'));
    $('#results').toggleClass('onlyTimeLimited', $("#onlyTimeLimited").prop('checked'));
    $(".onlySevenStarInoutGroup").toggleClass('hidden', !$("#onlyOwnedUnits").prop('checked'));
    $('#results').toggleClass('onlySevenStar', $("#onlySevenStar").prop('checked'));
    $('#results').toggleClass('onlyTmrMoogles', $("#onlyTmrMoogles").prop('checked'));

}

// create new JJV environment
let importValidator = jjv();

// Register a `user` schema
importValidator.addSchema('units', {
  type: 'array',
  maxItems: 6000,
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 9,
        maxLength: 10
      },
      level: {
        type:'number',
        minimum: 0,
        maximum: 120
      },
      pots: {
        type: 'object',
        properties: {
          hp: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          mp: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          atk: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          def: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          mag: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          spr: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          }
        },
        required: ['hp', 'mp', 'atk', 'def', 'mag', 'spr']
      },
      doors: {
        type: 'object',
        properties: {
          hp: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          mp: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          atk: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          def: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          mag: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          },
          spr: {
            type: 'number',
            minimum: 0,
            maximum: 2000
          }
        },
        required: ['hp', 'mp', 'atk', 'def', 'mag', 'spr']
      },
      enhancements: {
        type: 'array',
        maxItems: 30,
        items: {
          type: "string",
          minLength: 5,
          maxLength: 10
        }
      },
      tmr: {
        type: 'number',
        minimum: 0,
        maximum: 1000
      },
      stmr: {
        type: 'number',
        minimum: 0,
        maximum: 1000
      },
      tmrId: {
        type: 'string',
        minLength: 1,
        maxLength: 10
      }
    },
      required: ['id', 'level', 'tmr']

  }
});
