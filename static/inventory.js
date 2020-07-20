const SELLABLE_ITEMS_ACCESS = ["shop", "recipe", "recipe-chest", "recipe-key", "recipe-quest", "recipe-shop"];
const sellableExclusionList = ["1100000302"];
var equipments;
var materia;
let itemsById = {};
var stmrs = [];
var lastItemReleases;
var units;

var currentEnhancementItem;
var currentEnhancementItemPos;

var displayId = 0;

var equipmentLastSearch = "";
var materiaLastSearch = "";
var farmableStmrLastSearch = "";

function beforeShow(clearTabSelection = true) {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#itemsWrapper").removeClass("hidden");
    $("#itemEnhancement").addClass("hidden");
    $("#results").removeClass("hidden");
    $("#loadMore").addClass('hidden');
    $('.sellableItemsHeader').addClass('hidden');
    $('.enhancementCandidatesHeader').addClass('hidden');

    // Hidden by default, enabled by materia and equipment tabs
    $("#searchBox").addClass("hidden");
    // Hidden by default, enabled by farmable stmr tab
    $('.searchHeader .stmrMoogleAvailableDiv').addClass("hidden");

    if(clearTabSelection) {
        $(".nav-tabs .nav-link").removeClass("active");
    }
}

function showMateria() {
    beforeShow();

    $(".nav-tabs .materia").addClass("active");
    $("#sortType").text("Sorted by Name");
    $("#searchBox").val(materiaLastSearch);
    $("#searchBox").removeClass("hidden");
    $("#results").addClass('row');
    // filter, sort and display the results
    showSearch();
    displayStats();
}

function showEquipments() {
    beforeShow();

    $(".nav-tabs .equipment").addClass("active");
    $("#sortType").text("Sorted by Type (Strength)");
    $("#searchBox").val(equipmentLastSearch);
    $("#searchBox").removeClass("hidden");
    $("#results").removeClass('row');

    // filter, sort and display the results
    showSearch();
    displayStats();
}

function showFarmableStmr() {
    beforeShow();

    $(".nav-tabs .farmableStmr").addClass("active");
    $("#sortType").text("");
    $("#searchBox").val(farmableStmrLastSearch);
    $("#searchBox").removeClass("hidden");
    $("#results").removeClass('row');

    // filter, sort and display the results
    showSearch();
    displayStats();
    $('.searchHeader .stmrMoogleAvailableDiv').removeClass("hidden");
}

function showSellableItems() {
    $('body').addClass("computing");
    beforeShow();
    $('.sellableItemsHeader').removeClass('hidden');

    $(".nav-tabs .sellableItems").addClass("active");
    $("#sortType").text("");
    $("#results").removeClass('row');

    // filter, sort and display the results
    showSearch();
    displayStats();
    $('body').removeClass("computing");
}

function showEnhancementCandidates() {
    $('body').addClass("computing");
    beforeShow();
    $('.enhancementCandidatesHeader').removeClass('hidden');

    $(".nav-tabs .enhancementCandidates").addClass("active");
    $("#sortType").text("");
    $("#results").removeClass('row');

    // filter, sort and display the results
    showSearch();
    displayStats();
    $('body').removeClass("computing");
}

function showSearch() {

    var inEquipment = $(".nav-tabs .equipment").hasClass("active");
    var inSellableItems = $(".nav-tabs .sellableItems").hasClass("active");
    let inEnhancementCandidates = $(".nav-tabs .enhancementCandidates").hasClass("active");

    // filter, sort and display the results
    var textToSearch = $("#searchBox").val();
    displayItems(sort(search(textToSearch)), inEquipment || inSellableItems || inEnhancementCandidates);
    if (textToSearch) {
        $("#sortType").text("");
    }
}

function showHistory() {
    displayId++;
    beforeShow();

    $(".nav-tabs .history").addClass("active");
    $("#sortType").text("Sorted by release date");

    var $resultDiv = $("#results").empty();
    displayId++;
    displayItemsByHistoryAsync(0, 4, displayId, $resultDiv);
}

function setTooltips() {
  var popTrigger = '[data-toggle="inventory"]',
      popClass   = 'inventoryPopover',
      popID      = 'item';

  /* New Bootstrap Popover --------------------------------------------------- *\
   * Expects the following data attributes:
   * data item (item.id)
  \* ------------------------------------------------------------------------- */

  $(popTrigger).popover({
    html: true,
    trigger: 'manual',
    container: 'body',
    placement: 'bottom',
    title: "Item Info",
    template: '<div class="popover ' + popClass + ' ffbe_theme--dark" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
    content: function() {
      var theItem = $(this).data(popID);
      return displayItemLine(itemsById[theItem], "", false);
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
}

function displayItemsByHistoryAsync(dateIndex, dateIndexMax, id, $resultDiv, $loadMore) {
  if ($resultDiv == undefined) $resultDiv = $("#results");
  if ($loadMore == undefined) $loadMore = $("#loadMore");

  // Get current item release
  var currentItemReleases = lastItemReleases[dateIndex],
      currentItemTitle = '';

  // Hide LoadMore button
  // Make sure max index is below length
  dateIndexMax = Math.min(lastItemReleases.length, dateIndexMax);

  for (var sourceIndex in currentItemReleases.sources) {
    var items = currentItemReleases.sources[sourceIndex].items;

    // Display banner unit list
    if (currentItemReleases.sources[sourceIndex].type == "banner") {
      for (var unitIndex in currentItemReleases.sources[sourceIndex].units) {
        if (currentItemReleases.sources[sourceIndex].units.length > 1 && unitIndex == currentItemReleases.sources[sourceIndex].units.length -1) {
          currentItemTitle += " and ";
        } else if (unitIndex > 0) {
          currentItemTitle += ", ";
        }

        currentItemTitle += units[currentItemReleases.sources[sourceIndex].units[unitIndex]].name;
      }

    // Display event name
    } else if (currentItemReleases.sources[sourceIndex].type == "event" || currentItemReleases.sources[sourceIndex].type == "storyPart") {
      currentItemTitle = currentItemReleases.sources[sourceIndex].name;
    }

    // Output the HTML
    var html  = '<div class="ffbe_text--title d-flex justify-content-between mb-3">';
        html += '  <span class="date">' + currentItemReleases.date + '</span>';
        html += '  <span class="source">' + currentItemReleases.sources[sourceIndex].name + "</span>";
        html += '</div>';
        html += '<div class="row">';

    for (var index = 0; index < items.length; index++) {
      if (items[index] === undefined) continue;
        html += getItemDisplay(items[index]);
      }
    }

    html += '</div>';

    if (id == displayId) {
      //Increment current date index
      dateIndex++;

      // Check if we are at the max and not at the end
      if ((dateIndex === dateIndexMax) && (dateIndexMax !== lastItemReleases.length)) {
        $loadMore.removeClass('hidden');
        $loadMore.find('button.btn-primary').attr('onclick', "displayItemsByHistoryAsync("+dateIndex+", "+(dateIndex+10)+", "+id+")");
        $loadMore.find('button.btn-warning').attr('onclick', "displayItemsByHistoryAsync("+dateIndex+", "+(lastItemReleases.length)+", "+id+")");
      } else {
        $loadMore.addClass('hidden');
      }

      // Add all items to the DOM
      $resultDiv.append(html);

      // Update lazyloader only for first and last run
     if (dateIndex === 1 || dateIndex >= dateIndexMax) lazyLoader.update();

      // Launch next run of type
      if (dateIndex < dateIndexMax) {
        setTimeout(displayItemsByHistoryAsync, 0, dateIndex, dateIndexMax, id, $resultDiv, $loadMore);
      }
    }
}

function showSettings() {
  beforeShow();
  displayId++;

  $("#results").removeClass('row');
  $(".nav-tabs .settings").addClass("active");
  $("#sortType").text("");

  var html  = '<h5 class="ffbe_text--title">Inventory Tools</h5>';
      html += '<button class="btn btn-primary mr-2 addAllButton" onclick="showAddAllToInventoryDialog()" type="button">Add All Equipment and Materia</button>';

  if (itemsAddedWithAddAll.length > 0) {
      html += '<button class="btn btn-warning mr-2" onclick="undoAddAllToInventory()" type="button">Undo Add All</button>';
  }

  html += '<button class="btn btn-danger removeAllButton" onclick="showRemoveAllToInventoryDialog()" type="button">Remove All Equipment and Materia</button>';

  $("#results").html(html);
}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayItems = function(items, byType = false) {
    var resultDiv = $("#results");
    resultDiv.empty();
    displayId++;
    var inFarmableStmr = $(".nav-tabs .farmableStmr").hasClass("active");
    let inSellableItems = $(".nav-tabs .sellableItems").hasClass("active");
    let inEnhancementCandidates = $(".nav-tabs .enhancementCandidates").hasClass("active");
    if (byType) {
        // Jump list display
        htmlTypeJump = '<div class="d-flex justify-content-center align-items-center typeJumpList" data-html2canvas-ignore>';
        htmlTypeJump += '<span class="pr-2">Jump to </span><div class="d-flex flex-wrap">';
        var currentItemType = null;
        for (var index = 0, len = items.length; index < len; index++) {
            var itemType = items[index].type;
            if (itemType !== currentItemType) {
                htmlTypeJump += '<a class="typeJump '+itemType+' disabled"><i class="icon icon-sm equipment-'+itemType+'"></i></a>';
                currentItemType = itemType;
            }
        }
        htmlTypeJump += '</div></div>';
        resultDiv.append(htmlTypeJump);

        displayItemsByTypeAsync(items, 0, resultDiv, displayId, resultDiv.find('.typeJumpList'), inFarmableStmr, inSellableItems, inEnhancementCandidates);
    } else {
        displayItemsAsync(items, 0, resultDiv, displayId, inFarmableStmr, inSellableItems);
    }
};

function displayItemsByTypeAsync(items, start, div, id, jumpDiv, inFarmableStmr = false, inSellableItems = false, inEnhancementCandidates = false) {

  // Set item type for this run and various useful vars
  var currentItemType = items[start].type,
      itemList = '';

  for (var index = start, len = items.length; index < len; index++) {
    var item = items[index];

    if (item === undefined || (item.id != "9999999999" && item.access.includes("not released yet") && !itemInventory[item.id])) continue;

    if (item.type === currentItemType) {
      itemList += getItemDisplay(item, inFarmableStmr, inSellableItems, inEnhancementCandidates);
    } else {
      break;
    }
  }

  var html  = '<div class="d-flex my-2">';
      html += '  <i class="mr-2 icon equipment-' + currentItemType + '" id="' + currentItemType + '"></i>';
      html += '  <div class="ffbe_text--title flex-fill my-2"></div>';
      html += '  <i class="ml-2 icon equipment-' + currentItemType + '"></i>';
      html += '</div>';
      html += '<div class="row itemList">';
      html +=   itemList;
      html += '</div>';

  if (id == displayId) {
    // Add all items to the DOM
    div.append(html);
    // Enable jumper
    jumpDiv.find("a.typeJump." + currentItemType).attr('href', '#' + currentItemType).removeClass('disabled');
    // Update lazyloader only for first and last run
    if (start === 0 || index >= items.length) lazyLoader.update();
    // Launch next run of type
    if (index < items.length) {
      setTimeout(displayItemsByTypeAsync, 0, items, index, div, id, jumpDiv, inFarmableStmr, inSellableItems, inEnhancementCandidates);
    } else {
      setTooltips();
    }
  }
}

function displayItemsAsync(items, start, div, id, showStmrRecipe = false, inSellableItems = false, max = 20) {
    var html = '';
    var end = Math.min(start + max, items.length);
    for (var index = start; index < end; index++) {
        if (items[index] === undefined || (items[index].id != "9999999999" && items[index].access.includes("not released yet") && !itemInventory[items[index].id])) continue;
        html += getItemDisplay(items[index], showStmrRecipe, inSellableItems);
    }

    if (id == displayId) {
        // Add items to the DOM
        div.append(html);
        // Update lazyloader only for first and last run
        if (start === 0 || index >= items.length) lazyLoader.update();
        // Launch next run of type
        if (index < items.length) {
            setTimeout(displayItemsAsync, 0, items, index, div, id, showStmrRecipe, inSellableItems);
        } else {
            setTooltips();
        }
    }
}

function getItemDisplay(item, showStmrRecipe = false, inSellableItems = false, inEnhancementsCandidates = false) {
  var html       = '',
      itemClass  = '',
      itemScript = '';
      itemTotal  = '';
      itemSellIt = '';
      btnToggle  = '';
      btnAction  = '';
      btnTMR     = '';


  /* Build Class List */
  if (!itemInventory[item.id]) { itemClass += ' notOwned '; }
  if (item.tmrUnit && ownedUnits[item.tmrUnit] && ownedUnits[item.tmrUnit].farmable > 0) { itemClass += ' farmable'; }
  if (itemInventory.enchantments[item.id] && (!inSellableItems || item.enchantments)) { itemClass += ' enhanced'; }
  if (itemInventory.excludeFromExpeditions && itemInventory.excludeFromExpeditions.includes(item.id)) { itemClass += ' excludedFromExpeditions'; }
  if (itemInventory[item.id] && item.maxNumber && itemInventory[item.id] > item.maxNumber) { html += ' maxNumberOverflow'; }

  if (inSellableItems ||inSellableItems) {
    // Do Nothing
  } else if (showStmrRecipe && item.stmrAccess) {
    itemClass += ' stmr">';
  } else {
    itemScript += ' onclick="addToInventory(\'' + escapeQuote(item.id) + '\')"';
  }

  /* You own this item! ------------------------------------------------- */
  if (itemInventory) {

    // Number You Own!
    itemTotal = '<div class="number d-block badge badge-secondary mb-2">';

    if (itemInventory[item.id]) {
      if ((inSellableItems || inEnhancementsCandidates) && itemInventory.enchantments[item.id]) {
        if (item.enhancements) {
          itemTotal += '1';
        } else {
          itemTotal += itemInventory[item.id] - itemInventory.enchantments[item.id].length;
        }
      } else {
        itemTotal += itemInventory[item.id];
      }

    }

    itemTotal += '</div>';

    // Build the Buttons!
    if (!inSellableItems && !inEnhancementsCandidates) {
      btnToggle += '<button type="button" class="btn btn-xs btn-ghost w-100 mr-1" onclick="event.stopPropagation();addToInventory(\'' + escapeQuote(item.id) + '\')"><div class="fa fa-fw fa-plus"></div></button>';
    }

    if (!inSellableItems && !inEnhancementsCandidates) {
      btnToggle += '<button type="button" class="btn btn-xs btn-ghost w-100" onclick="event.stopPropagation();removeFromInventory(\'' + item.id + '\');"><div class="fa fa-fw fa-minus" /></div></button>';
      btnTMR += '<button type="button" class="btn btn-xs btn-ghost w-100" onclick="event.stopPropagation();farmedTMR(' + item.tmrUnit + ')" data-toggle="tooltip" title="Indicate You Farmed this TMR. It will decrease the number you can farm and increase the number you own this by 1"><div class="fa fa-fw fa-star"></div></button>';

      if (weaponList.includes(item.type)) {
        btnAction += '<button type="button" class="btn btn-xs btn-ghost w-100 mr-1" onclick="event.stopPropagation();showItemEnhancements(' + item.id + ')" data-toggle="tooltip" title="Edit this Item"><div class="fa fa-fw fa-edit" /></div></button>';
      }

      btnAction += '<button type="button" class="btn btn-xs btn-ghost w-100" onclick="event.stopPropagation();excludeFromExpedition(' + item.id + ')" data-toggle="tooltip" title="Exclude this item from builds made for expeditions"><div class="fa fa-fw fa-ban" /></div></button>';
    }
  }

  /* You should sell this item! ----------------------------------------- */

  if (inSellableItems) {
    itemSellIt = '<div class="d-block badge badge-warning">';

    if (item.access.some(access => SELLABLE_ITEMS_ACCESS.includes(access))) {
      if (item.access.includes("shop")) {
        itemSellIt += '<span class="betterItems" title="Can be bought in a shop"><i class="fas fa-shopping-cart"></i></span>';
      } else {
        itemSellIt += '<span class="betterItems" title="Can be crafted"><i class="fas fa-scroll"></i></span>';
      }
    }

    if (betterItemsByIds[item.id] && !item.special) {
      let betterItemsNumber = 0;
      let betterItemsString = '';

      Object.keys(betterItemsByIds[item.id]).forEach(id => {
        let entry = betterItemsByIds[item.id][id];
        betterItemsNumber += entry.available;
        betterItemsString +=  entry.name + ' (' + entry.available + ')<br />';
      });

      itemSellIt += '<div class="betterItems" data-toggle="popover" data-title="Better Equipment" data-content="' + betterItemsString + '">' + betterItemsNumber + '<i class="fas fa-angle-double-up ml-1"></i></div>';
    }

    itemSellIt += '</span></div>'
  }

  html  = '<div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4 item ' + itemClass + '" ' + itemScript + ' data-item="' + escapeName(item.id) + '">';
  html += '  <div class="ffbe_content--well p-2 border rounded h-100">';
  html += '    <div class="form-row align-items-center itemInventory">';
  html += '      <div class="col-auto">' + itemTotal + itemSellIt + '</div>';
  html += '      <div class="col-auto" data-toggle="inventory" data-item="' + escapeName(item.id) + '">' + getImageHtml(item) + '</div>';
  html += '      <div class="col">' + getNameColumnHtml(item) + '</div>';
  html += '      <div class="col-12 col-md-2">';
  html += '        <div class="row no-gutters align-items-center mt-2 mt-md-0"">';
  html += '          <div class="col-auto col-md-12 d-flex align-items-center mr-auto order-1 mb-1">' + btnToggle + '</div>';
  html += '          <div class="col-auto col-md-12 d-flex align-items-center ml-auto order-md-2 mb-1">' + btnAction + '</div>';
  html += '          <div class="col-auto col-md-12 d-flex align-items-center mx-auto order-2 order-md-3 mb-1">' + btnTMR + '</div>';
  html += '        </div>';
  html += '      </div>';
  html += '    </div>';
  html += '  </div>';
  html += '</div>';

  if (showStmrRecipe && item.stmrAccess) {
    //html += '<div class="wrapperForStmr">'
  }




    if (showStmrRecipe && item.stmrAccess) {
        html += "</div>";


        html += '<div class="stmrRecipe">'
        html += '<div><img class="unitImage" src="/assets/game/units/unit_icon_' + item.stmrUnit.substr(0, item.stmrUnit.length - 1) + 7 + '.png"/></div>';
        html += '<div class="column">'

        html += '<div class="unitName">' + toLink(units[item.stmrUnit].name) + '</div>';

        html += '<div class="recipe">';
        if (item.stmrAccess.base == "sixStar") {
            html += '<i class="icon crystal-rainbowCrystal"></i><i class="icon crystal-rainbowCrystal"></i> &rArr; <i class="icon crystal-sevenStarCrystal"></i><div class="then">then</div>'
        }
        html += '<i class="icon crystal-sevenStarCrystal"></i>'
        if (item.stmrAccess.sevenStar) {
            html += ' + <i class="icon crystal-sevenStarCrystal"></i>'
        }
        if (item.stmrAccess.sixStar) {
            html += ' + '
            for (let i = 0; i < item.stmrAccess.sixStar; i++) {
                html += '<i class="icon crystal-rainbowCrystal"></i>'
            }
        }
        if (item.stmrAccess.stmrMoogle) {
            html += ' + ' + item.stmrAccess.stmrMoogle + '% <div style="position:relative;"><img class="stmrMoogle" src="/assets/game/units/unit_ills_906000105.png"></div>'
        }
        html += '</div>';
        html += '</div>';
        html += '</div>';
    }



  return html;
}

function excludeFromExpedition(id) {
    var idString = String(id);
    var itemDiv = ('.item[data-item="' + escapeName(id) + '"]');
    if (itemInventory.excludeFromExpeditions && itemInventory.excludeFromExpeditions.includes(idString)) {
        itemInventory.excludeFromExpeditions.splice(itemInventory.excludeFromExpeditions.indexOf(idString), 1);
        itemDiv.removeClass("excludedFromExpeditions");
    } else {
        if (!itemInventory.excludeFromExpeditions) {
            itemInventory.excludeFromExpeditions = [];
        }
        itemInventory.excludeFromExpeditions.push(idString);
        itemDiv.addClass("excludedFromExpeditions");
    }
    willSave();
    $(".saveInventory").removeClass("hidden");
}

function findInventoryItemById(id) {
    var inventoryItem = equipments.find(equip => equip.id === String(id));
    if (!inventoryItem) {
        inventoryItem = materia.find(m => m.id === String(id));
    }
    return inventoryItem;
}

function addToInventory(id, showAlert = true, force = false) {
    var inventoryDiv = $('.item[data-item="' + escapeName(id) + '"]');
    if(itemInventory[id]) {
        var item = findInventoryItemById(id);
        if (!force && item.maxNumber && itemInventory[id] >= item.maxNumber) {
            if (showAlert) {
                Modal.confirm("Limited item", 'You can only have up to ' + item.maxNumber + ' of these. If you own more, please report it to correct that value. Do you want to add the item nonetheless?', () => {addToInventory(id, false, true)});
            }
            return false;
        } else {
            itemInventory[id] = itemInventory[id] + 1;
            inventoryDiv.find(".number").text(itemInventory[id]);
        }
    } else {
        itemInventory[id] = 1;
        inventoryDiv.removeClass('notOwned');
        inventoryDiv.find(".number").text(itemInventory[id]);
        updateUnitAndItemCount();
    }
    willSave();
    displayStats();
    return true;
}

function willSave() {
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUserData,3000, true, mustSaveUnits, false);
    $(".saveInventory").removeClass("hidden");
}

function showAddAllToInventoryDialog() {
  Modal.show({
    title: "Add All",
    body: '<div class="alert alert-danger mb-3">Are you sure you want to continue?</div><p class="mb-0">This will add up to 2 of each equipment and 4 of each materia to your inventory.</p>',
    buttons: [{
      text: "Add All Items",
      className: "btn-warning",
      onClick: function() {
        addAllToInventory(materia, 4);
        addAllToInventory(equipments, 2);
      }
    }]
  });
}

function showRemoveAllToInventoryDialog() {
  Modal.show({
    title: "Clear Inventory",
    body: '<div class="alert alert-danger mb-3">This is not reversible! Are you sure you want to continue?</div><p class="mb-0">This will empty your equipment and materia inventory (on this site).</p>',
    buttons: [{
      text: "Empty Inventory",
      className: "btn-warning",
      onClick: function() {
        itemInventory = {
          enchantments: {}
        };
        updateUnitAndItemCount();
        displayStats();
        saveUserData(true, false, false);
      }
    }]
  });
}

var itemsAddedWithAddAll = [];

function addAllToInventory(items, amount) {
  var itemInventoryKeys = Object.keys(itemInventory);
  for (var index in items) {
    var item = items[index];
    var key = escapeName(item.id);
    for (var i = 0; i < amount; i++) {
      if (addToInventory(key, false)) {
        itemsAddedWithAddAll.push(key);
      }
    }
  }
  showSettings();
  displayStats();
}

function undoAddAllToInventory() {
  for (var index in itemsAddedWithAddAll) {
    removeFromInventory(itemsAddedWithAddAll[index]);
  }
  itemsAddedWithAddAll = [];
  showSettings();
  displayStats();
}


function removeFromInventory(id) {
  if(itemInventory[id]) {
    var inventoryDiv = $('.item[data-item="' + escapeName(id) + '"]');
    if (itemInventory[id] == 1 ) {
      delete itemInventory[id];
      inventoryDiv.addClass('notOwned');
      inventoryDiv.find(".number").text("");
      updateUnitAndItemCount();
    } else {
      itemInventory[id] = itemInventory[id] - 1;
      inventoryDiv.find(".number").text(itemInventory[id]);
    }
    mustSaveUnits = true;
    willSave();
    displayStats();
  }
}

function farmedTMR(unitId) {
    var item;
    for (var index = data.length; index--;) {
        if (data[index].tmrUnit && data[index].tmrUnit == unitId) {
            item = data[index];
            addToInventory(item.id);
            break;
        }
    }
    if (!item) {
        return;
    }
    ownedUnits[unitId].farmable -= 1;
    if (ownedUnits[unitId].farmable == 0) {
        $(".item." + escapeName(item.id)).removeClass("farmable");
    }
    mustSaveUnits = true;
    willSave();
}

function search(textToSearch) {
    let result = [];
    let inEquipment = $(".nav-tabs .equipment").hasClass("active");
    let inFarmableStmr = $(".nav-tabs .farmableStmr").hasClass("active");
    let inSellableItems = $(".nav-tabs .sellableItems").hasClass("active");
    let inEnhancementsCandidates = $(".nav-tabs .enhancementCandidates").hasClass("active");
    let onlyTimeLimited = $('#onlyTimeLimited').prop('checked');

    var itemsToSearch = [];
    if(inEquipment) {
        itemsToSearch = equipments;
        equipmentLastSearch = textToSearch;
    } else if (inFarmableStmr) {
        let availableStmrMoogle = $('#stmrMoogleAvailable').val() || 0;
        itemsToSearch = stmrs.filter(stmr => stmr.stmrAccess.stmrMoogle <= availableStmrMoogle);
        if (onlyTimeLimited) {
            itemsToSearch = itemsToSearch.filter(stmr => units[stmr.stmrUnit].summon_type === 'event')
        }
        farmableStmrLastSearch = textToSearch;
    } else if (inSellableItems) {
        textToSearch = "";
        itemsToSearch = getSellableItems();
    } else if (inEnhancementsCandidates) {
        textToSearch = "";
        itemsToSearch = getEnhancementCandidates();
    } else {
        // In materia tab
        itemsToSearch = materia;
        materiaLastSearch = textToSearch;
    }

    if (textToSearch) {
        for (var index in itemsToSearch) {
            var item = itemsToSearch[index];
            if (containsText(textToSearch, item)) {
                result.push(item);
            }
        }
    } else {
        result = itemsToSearch;
    }

    return result;
}

function getEnhancementCandidates() {
    let searchDepth = parseInt($('#enhancementCandidatesSearchDepth').val() || 1);
    let enemyStats = {
        "races": killerList,
        "def": 100,
        "spr": 100,
        "elementalResists": {"dark": 0,"light": 0,"earth": 0,"wind": 0,"water": 0,"lightning": 0,"ice": 0,"fire": 0},
        "breaks": {"atk": 0,"def": 0,"mag": 0,"spr": 0},
        "buffs": {"atk": 0,"def": 0,"mag": 0,"spr": 0},
        "breakability": {"atk": true,"def": true,"mag": true,"spr": true},
        "imperils": {"fire": 0,"ice": 0,"lightning": 0,"water": 0,"earth": 0,"wind": 0,"light": 0,"dark": 0}
    }
    let involvedStats = baseStats.concat(["physicalKiller", "magicalKiller","meanDamageVariance", "evoMag", "jumpDamage", "lbDamage", "drawAttacks", "lbPerTurn", "evade.physical", "evade.magical", "mpRefresh"]).concat(ailmentList.map(a => 'resist|' + a + '.percent')).concat(elementList.map(e => 'resist|' + e + '.percent'));

    let candidateItemIds = [];
    let baseItemsToSearchIn = equipments.filter(item => weaponList.includes(item.type) && itemInventory[item.id]);
    let itemEntriesToSearchIn = [];
    baseItemsToSearchIn.forEach(item => {
        if (itemInventory.enchantments[item.id]) {
            itemInventory.enchantments[item.id].forEach(enhancements => {
                itemEntriesToSearchIn.push(getItemEntry(applyEnhancements(item, enhancements), 1, JSON.stringify(enhancements) ," (IW)"));
            });
            if (itemInventory[item.id] > itemInventory.enchantments[item.id].length) {
                itemEntriesToSearchIn.push(getItemEntry(item, itemInventory[item.id] - itemInventory.enchantments[item.id].length));
            }
        } else {
            itemEntriesToSearchIn.push(getItemEntry(item, itemInventory[item.id]));
        }
    });
    let byTypeAndElements = {};
    itemEntriesToSearchIn.forEach(entry => {
        if (weaponList.includes(entry.item.type)) {
            if (!byTypeAndElements[entry.item.type]) {
                byTypeAndElements[entry.item.type] = {};
            }
            let elements = getItemElementsKey(entry.item);
            if (!byTypeAndElements[entry.item.type][elements]) {
                byTypeAndElements[entry.item.type][elements] = [];
            }
            byTypeAndElements[entry.item.type][elements].push(entry);
        } else {
            if (!byTypeAndElements[entry.item.type]) {
                byTypeAndElements[entry.item.type] = [];
            }
            byTypeAndElements[entry.item.type].push(entry);
        }
    });
    typeList.forEach(type => {
        if (byTypeAndElements[type]) {
            Object.keys(byTypeAndElements[type]).forEach(elements => treatTypeForEnhancementCandidates(byTypeAndElements[type][elements], involvedStats, enemyStats, candidateItemIds, searchDepth));
        }
    });

    return itemEntriesToSearchIn.filter(entry => itemInventory[entry.item.id] && (entry.item.partialDualWield || (entry.item.special && entry.item.special.includes('dualWield')) || candidateItemIds.includes(entry.id))).map(entry => entry.item);
}

function getSellableItems() {
    let searchDepth = parseInt($('#betterItemsNumber').val() || 4);
    let enemyStats = {
        "races": killerList,
        "def": 100,
        "spr": 100,
        "elementalResists": {"dark": 0,"light": 0,"earth": 0,"wind": 0,"water": 0,"lightning": 0,"ice": 0,"fire": 0},
        "breaks": {"atk": 0,"def": 0,"mag": 0,"spr": 0},
        "buffs": {"atk": 0,"def": 0,"mag": 0,"spr": 0},
        "breakability": {"atk": true,"def": true,"mag": true,"spr": true},
        "imperils": {"fire": 0,"ice": 0,"lightning": 0,"water": 0,"earth": 0,"wind": 0,"light": 0,"dark": 0}
    }
    let involvedStats = baseStats.concat(["physicalKiller", "magicalKiller","meanDamageVariance", "evoMag", "jumpDamage", "lbDamage", "drawAttacks", "lbPerTurn", "evade.physical", "evade.magical", "mpRefresh"]).concat(ailmentList.map(a => 'resist|' + a + '.percent')).concat(elementList.map(e => 'resist|' + e + '.percent'));

    let sellableItemIds = [];
    let baseItemsToSearchIn = equipments.concat(materia).filter(item => !item.exclusiveUnits && !item.equipedConditions && itemInventory[item.id]);
    let itemEntriesToSearchIn = [];
    baseItemsToSearchIn.forEach(item => {
        if (itemInventory.enchantments[item.id]) {
            itemInventory.enchantments[item.id].forEach(enhancements => {
                itemEntriesToSearchIn.push(getItemEntry(applyEnhancements(item, enhancements), 1, JSON.stringify(enhancements) ," (IW)"));
            });
            if (itemInventory[item.id] > itemInventory.enchantments[item.id].length) {
                itemEntriesToSearchIn.push(getItemEntry(item, itemInventory[item.id] - itemInventory.enchantments[item.id].length));
            }
        } else {
            itemEntriesToSearchIn.push(getItemEntry(item, itemInventory[item.id]));
        }
    });
    let byTypeAndElements = {};
    itemEntriesToSearchIn.forEach(entry => {
        if (weaponList.includes(entry.item.type)) {
            if (!byTypeAndElements[entry.item.type]) {
                byTypeAndElements[entry.item.type] = {};
            }
            let elements = getItemElementsKey(entry.item);
            if (!byTypeAndElements[entry.item.type][elements]) {
                byTypeAndElements[entry.item.type][elements] = [];
            }
            byTypeAndElements[entry.item.type][elements].push(entry);
        } else {
            if (!byTypeAndElements[entry.item.type]) {
                byTypeAndElements[entry.item.type] = [];
            }
            byTypeAndElements[entry.item.type].push(entry);
        }
    });
    typeList.forEach(type => {
        if (byTypeAndElements[type]) {
            if (weaponList.includes(type)) {
                Object.keys(byTypeAndElements[type]).forEach(elements => treatTypeForSellableItems(byTypeAndElements[type][elements], involvedStats, enemyStats, sellableItemIds, searchDepth));
            } else {
                treatTypeForSellableItems(byTypeAndElements[type], involvedStats, enemyStats, sellableItemIds, searchDepth);
            }
        }
    });

    let includeRecipeItems = $('#includeRecipeItems').prop('checked');
    let accessToDisplay = (includeRecipeItems ? SELLABLE_ITEMS_ACCESS : ["shop"]);

    return itemEntriesToSearchIn.filter(entry => itemInventory[entry.item.id] && (entry.item.access.some(access => accessToDisplay.includes(access)) || !entry.item.partialDualWield && !entry.item.equipedConditions && !entry.item.allowUseOf && !entry.item.special && sellableItemIds.includes(entry.id))).map(entry => entry.item);
}

function getItemElementsKey(item) {
    if (!item.element) {
        return elements = "none";
    } else {
        return item.element.sort().join('-');
    }
}

function treatTypeForEnhancementCandidates(items, involvedStats, enemyStats, candidateItemIds, searchDepth) {
    let itemPool = new ItemPool(searchDepth +1, involvedStats, enemyStats, [], [], [], true, true);
    itemPool.addItems(items);
    itemPool.prepare();
    let alreadyManagedGroupIds = [];
    itemPool.keptItems.filter(ki => ki.active).forEach(group => {findEnhancementCandidates(itemPool, group, candidateItemIds, alreadyManagedGroupIds, searchDepth)});
}

function treatTypeForSellableItems(items, involvedStats, enemyStats, sellableItemIds, searchDepth) {
    let itemPool = new ItemPool(9999, involvedStats, enemyStats, [], [], [], true, true);
    itemPool.addItems(items);
    itemPool.prepare();
    let alreadyManagedGroupIds = [];
    itemPool.keptItems.filter(ki => ki.active).forEach(group => {findSellableItems(itemPool, group, sellableItemIds, alreadyManagedGroupIds, searchDepth)});
}

function getItemEntry(item, number, enhancements = "",additionalText = "") {
    let itemEntry = {
        "item":item,
        "name":item.name + additionalText,
        "defenseValue":0,
        "mpValue":0,
        "available":number,
        "owned": true,
        "ownedNumber": number,
        "id": item.id + enhancements
    }
    for (var index = 0, len = baseStats.length; index < len; index++) {
        item['total_' + baseStats[index]] = item[baseStats[index] + '%'] || 0;
    }
    return itemEntry;
}

let betterItemsByIds = {};

function findEnhancementCandidates(itemPool, group, candidateItemIds, alreadyManagedGroupIds, searchDepth) {
    if (alreadyManagedGroupIds.includes(group.id)) {
        return;
    }
    alreadyManagedGroupIds.push(group.id);
    let betterItemsNumbers = 0;
    group.betterGroups.forEach(betterGroupId => {
        betterItemsNumbers += itemPool.groupByIds[betterGroupId].available;
    });
    if (betterItemsNumbers <= searchDepth) {
        group.equivalents.forEach(itemEntry => {
            let id = itemEntry.id;
            if (!candidateItemIds.includes(id)) {
                candidateItemIds.push(id);
            }
        })
    }
    if (itemPool.lesserGroupsById[group.id]) {
        itemPool.lesserGroupsById[group.id].forEach(id => {
            findEnhancementCandidates(itemPool, itemPool.groupByIds[id], candidateItemIds, alreadyManagedGroupIds, searchDepth);
        });
    }
}

function findSellableItems(itemPool, group, sellableItemIds, alreadyManagedGroupIds, searchDepth) {
    if (alreadyManagedGroupIds.includes(group.id)) {
        return;
    }
    alreadyManagedGroupIds.push(group.id);
    let betterItemsNumbers = 0;
    group.betterGroups.forEach(betterGroupId => {
        betterItemsNumbers += itemPool.groupByIds[betterGroupId].available;
    });
    if (betterItemsNumbers > searchDepth) {
        let betterItems = {};
        findBetterItemList(itemPool, group, betterItems);
        group.equivalents.forEach(itemEntry => {
            let id = itemEntry.id;
            if (!sellableItemIds.includes(id)) {
                sellableItemIds.push(id);
                betterItemsByIds[id] = betterItems;
            }
        })
    }
    if (itemPool.lesserGroupsById[group.id]) {
        itemPool.lesserGroupsById[group.id].forEach(id => {
            findSellableItems(itemPool, itemPool.groupByIds[id], sellableItemIds, alreadyManagedGroupIds, searchDepth);
        });
    }
}

function findBetterItemList(itemPool, group, betterItems) {
    if (group.betterGroups && group.betterGroups.length > 0) {
        group.betterGroups.forEach(id => {
            let betterGroup = itemPool.groupByIds[id];
            betterGroup.equivalents.forEach(eq => {
                if (!betterItems[eq.id]) {
                    betterItems[eq.id] = eq;
                }
            });
        });
    }
}

function keepOnlyOneOfEach(data) {
    var tempResult = {};
    for (var index in data) {
        var item = data[index];
        if (tempResult[item.id]) {
            var alreadyPutItem = tempResult[item.id];
            if (item.equipedConditions) {
                if (alreadyPutItem.equipedConditions) {
                    if (item.equipedConditions.length > alreadyPutItem.equipedConditions.length) {
                        tempResult[item.id] = item;
                    }
                } else {
                    tempResult[item.id] = item;
                }
            }
            if (item.exclusiveUnits) {
                tempResult[item.id] = item;
            }
        } else {
            tempResult[item.id] = item;
        }
    }

    var result = [];
    for (var index in tempResult) {
        result.push(tempResult[index]);
        itemsById[tempResult[index].id] = tempResult[index];
    }
    return result;
}


function keepOnlyStmrs() {
    stmrs = equipments.filter(item => {
        return item.stmrUnit && ownedUnits[item.stmrUnit] && (ownedUnits[item.stmrUnit].farmableStmr > 0 || ownedUnits[item.stmrUnit].number >= 2)
    });
    stmrs = stmrs.concat(materia.filter(item => item.stmrUnit && ownedUnits[item.stmrUnit] && (ownedUnits[item.stmrUnit].farmableStmr > 0 || ownedUnits[item.stmrUnit].number >= 2)));
    stmrs.forEach(stmr => {
        stmr.stmrAccess = {
            'base':"",
            'sevenStar': 0,
            'sixStar': 0,
            'stmrMoogle': 100
        }
        if (ownedUnits[stmr.stmrUnit].farmableStmr) {
            stmr.stmrAccess.base = "sevenStar";
        } else {
            stmr.stmrAccess.base = "sixStar";
        }
        if (ownedUnits[stmr.stmrUnit].farmableStmr > 1) {
            stmr.stmrAccess.sevenStar = 1;
            stmr.stmrAccess.stmrMoogle = 0;
        } else {
            let sixStarNumber = stmr.stmrAccess.base == "sixStar" ? ownedUnits[stmr.stmrUnit].number - 2 : ownedUnits[stmr.stmrUnit].number;
            if (sixStarNumber >= 2) {
                stmr.stmrAccess.sixStar = 2;
                stmr.stmrAccess.stmrMoogle = 0;
            } else if (sixStarNumber == 1) {
                stmr.stmrAccess.sixStar = 1;
                stmr.stmrAccess.stmrMoogle = 50;
            }
        }
    });
}

var sortOrderDefault = ["atk","mag","def","spr", "sortId"];
var sortOrderByType = {
    "lightShield": ["def","spr","atk","mag","hp","mp", "sortId"],
    "heavyShield": ["def","spr","atk","mag","hp","mp", "sortId"],
    "hat": ["def","spr","atk","mag","hp","mp", "sortId"],
    "helm": ["def","spr","atk","mag","hp","mp", "sortId"],
    "lightArmor": ["def","spr","atk","mag","hp","mp", "sortId"],
    "heavyArmor": ["def","spr","atk","mag","hp","mp", "sortId"],
    "robe": ["def","spr","atk","mag","hp","mp", "sortId"],
    "clothes": ["def","spr","atk","mag","hp","mp", "sortId"],
    "accessory": ["def","spr","atk","mag","hp","mp", "sortId"],
    "materia": []
}
function sort(items) {
    return items.sort(function (item1, item2){
        var type1 = getStat(item1, "type");
        var type2 = getStat(item2, "type");
        if (type1 == type2) {
            var sortOrder = sortOrderDefault;
            if (sortOrderByType[item1.type]) {
                sortOrder = sortOrderByType[item1.type];
            }
            for (var index in sortOrder) {
                var stat = sortOrder[index];
                var stat1 = getStat(item1, stat);
                var stat2 = getStat(item2, stat);
                if (stat1 == stat2) {
                    continue;
                }
                return stat2 - stat1;
            }
            var name1 = item1.jpname || item1.name;
            var name2 = item2.jpname || item2.name;

            var result = compareName(name1, name2);

            return result;
        } else {
            return type2 - type1;
        }
    });
};

function compareName(name1, name2) {
    var minLength = Math.min(name1.length, name2.length);
    for (var i = 0; i < minLength; i++) {
        var letter1 = name1.substr(i,1);
        var letter2 = name2.substr(i,1);
        if (letter1 == letter1.toUpperCase()) {
            if (letter2 == letter2.toUpperCase()) {
                var result = letter1.localeCompare(letter2);
                if (result != 0) {
                    return result;
                }
            } else {
                return -1;
            }
        } else {
            if (letter2 == letter2.toUpperCase()) {
                return 1;
            } else {
                var result = letter1.localeCompare(letter2);
                if (result != 0) {
                    return result;
                }
            }
        }
    }
    if (name1.length == name2.length) {
        return 0;
    } else if (name1.length == minLength) {
        return -1;
    } else {
        return 1;
    }
}

function getStat(item, stat) {
    if (stat == "type") {
        return typeList.length - typeList.indexOf(item.type);
    } else if (stat == "id") {
        return parseInt(item.id);
    } else if (item[stat]) {
        return item[stat];
    } else {
        return 0;
    }
}

function showItemEnhancements(itemId) {
    if (itemInventory[itemId]) {
        var item = null;
        for (var i = 0, len = equipments.length; i < len; i++) {
            if (equipments[i].id == itemId) {
                item = equipments[i];
                break;
            }
        }
        if (!item) { return; }
        currentEnhancementItem = item;
        var totalCount = itemInventory[itemId];
        var notEnchantedCount = totalCount;
        if (itemInventory.enchantments[itemId]) {
            notEnchantedCount = totalCount - itemInventory.enchantments[itemId].length;
        }
        var html = '<div class="btn" onclick="showEquipments()"><span class="glyphicon glyphicon-chevron-left"></span>Back to list</div>';
        if (notEnchantedCount > 0) {
            html += '<div><div class="col-xs-6 item">';
            html += '<div class="td inventory"><span class="number badge badge-success">' + notEnchantedCount + '</span><img class="itemWorldButton" onclick="event.stopPropagation();modifyItemEnhancements(' + item.id + ')" src="/assets/game/icons/dwarf.png" title="Open item management popup"></div>';
            html += getImageHtml(item) + getNameColumnHtml(item);
            html += "</div></div>";
        }
        if (itemInventory.enchantments[itemId]) {
            for (var i = 0, len = itemInventory.enchantments[itemId].length; i < len; i++) {
                var enhancedItem = applyEnhancements(item, itemInventory.enchantments[itemId][i]);
                html += '<div><div class="col-xs-6 item enhanced">';
                html += '<div class="td inventory"><span class="number badge badge-success">1</span><img class="itemWorldButton" onclick="event.stopPropagation();modifyItemEnhancements(' + item.id + ', ' + i + ')" src="/assets/game/icons/dwarf.png" title="Open item management popup"></div>';
                html += getImageHtml(enhancedItem) + getNameColumnHtml(enhancedItem);
                html += "</div></div>";
            }
        }
        $("#results").addClass("hidden");
        $("#itemEnhancement").html(html);
        $("#itemEnhancement").removeClass("hidden");
        var popupAlreadyDisplayed = ($("#modifyEnhancementModal").data('bs.modal') || {}).isShown
        if (!popupAlreadyDisplayed && notEnchantedCount == totalCount) {
            modifyItemEnhancements(item.id);
        }
        lazyLoader.update();
    }
}

function modifyItemEnhancements(itemId, enhancementPos) {

    currentEnhancementItemPos = enhancementPos;
    var popupAlreadyDisplayed = ($("#modifyEnhancementModal").data('bs.modal') || {}).isShown
    if (!popupAlreadyDisplayed) {
        $("#modifyEnhancementModal").modal();
    }

    $("#modifyEnhancementModal .value").removeClass("selected");
    var item = currentEnhancementItem;
    if (typeof currentEnhancementItemPos != 'undefined') {
        var enhancements = itemInventory.enchantments[currentEnhancementItem.id][currentEnhancementItemPos];
        for (var i = enhancements.length; i--;) {
            $("#modifyEnhancementModal .value." + enhancements[i]).addClass("selected");
        }
        item = applyEnhancements(currentEnhancementItem, enhancements);
    }
    $("#modifyEnhancementModal .modal-header .title").html(getImageHtml(item) + getNameColumnHtml(item));
    $("#modifyEnhancementModal .value.rare_3").html(itemEnhancementLabels["rare_3"][item.type]);
    $("#modifyEnhancementModal .value.rare_4").html(itemEnhancementLabels["rare_4"][item.type]);
    if (itemEnhancementLabels["special_1"][item.id]) {
        $("#modifyEnhancementModal .value.special_1").removeClass("hidden");
        $("#modifyEnhancementModal .value.special_1").html(itemEnhancementLabels["special_1"][item.id]);
    } else {
        $("#modifyEnhancementModal .value.special_1").addClass("hidden");
    }
}

function toggleItemEnhancement(enhancement) {
    if (!itemInventory.enchantments[currentEnhancementItem.id]) {
        itemInventory.enchantments[currentEnhancementItem.id] = [];
    }
    if (typeof currentEnhancementItemPos == 'undefined') {
        itemInventory.enchantments[currentEnhancementItem.id].push([]);
        currentEnhancementItemPos = itemInventory.enchantments[currentEnhancementItem.id].length - 1;
    }
    var enhancements = itemInventory.enchantments[currentEnhancementItem.id][currentEnhancementItemPos];
    if (enhancements.includes(enhancement)) {
        enhancements.splice(enhancements.indexOf(enhancement), 1);
        if (enhancements.length == 0) {
            itemInventory.enchantments[currentEnhancementItem.id].splice(currentEnhancementItemPos, 1);
            currentEnhancementItemPos = undefined;
            if (itemInventory.enchantments[currentEnhancementItem.id].length == 0) {
                delete itemInventory.enchantments[currentEnhancementItem.id];
            }
        }
    } else {
        if (enhancement == 'rare_3' && enhancements.includes('rare_4')) {
            enhancements.splice(enhancements.indexOf('rare_4'), 1);
        }
        if (enhancement == 'rare_4' && enhancements.includes('rare_3')) {
            enhancements.splice(enhancements.indexOf('rare_3'), 1);
        }
        if (enhancements.length == 3) {
            $.notify("No more than 3 item enhancements can be selected", "warning");
            return;
        }

        enhancements.push(enhancement);
    }
    modifyItemEnhancements(currentEnhancementItem.id, currentEnhancementItemPos);
    showItemEnhancements(currentEnhancementItem.id);
    if (itemInventory.enchantments[currentEnhancementItem.id]) {
        $("#results .items." + currentEnhancementItem.id).addClass("enhanced");
    } else {
        $("#results .items." + currentEnhancementItem.id).removeClass("enhanced");
    }
    willSave();
}


function inventoryLoaded() {
    if (data) {
        showEquipments();
        keepOnlyStmrs();
    }
}

function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#itemsWrapper").addClass("hidden");
}

function prepareSearch(data) {
    for (var index in data) {
        var item = data[index];
        item.searchString = item.name;
        if (item.jpname) {
            item.searchString += "|" + item.jpname;
        }
        if (item.tmrUnit && units[item.tmrUnit]) {
            item.searchString += "|" + units[item.tmrUnit].name;
        }
        if (item.stmrUnit && units[item.stmrUnit]) {
            item.searchString += "|" + units[item.stmrUnit].name;
        }
    }
}

function prepareLastItemReleases() {
    var unitsToSearch = [];
    var eventsToSearch = [];
    var idsToSearch = [];
    for (var dateIndex in lastItemReleases) {
        for (var sourceIndex in lastItemReleases[dateIndex].sources) {
            if (lastItemReleases[dateIndex].sources[sourceIndex].type == "banner") {
                unitsToSearch = unitsToSearch.concat(lastItemReleases[dateIndex].sources[sourceIndex].units)
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "event") {
                eventsToSearch.push(lastItemReleases[dateIndex].sources[sourceIndex].name);
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "storyPart") {
                idsToSearch = idsToSearch.concat(lastItemReleases[dateIndex].sources[sourceIndex].ids);
            }
        }
    }
    var tmrs = {};
    var stmrs = {};
    var events = {};
    var itemsById = {};
    var items = equipments.concat(materia);
    for (var index in items) {
        if (items[index].tmrUnit && unitsToSearch.includes(items[index].tmrUnit)) {
            tmrs[items[index].tmrUnit] = items[index];
        }
        if (items[index].stmrUnit && unitsToSearch.includes(items[index].stmrUnit)) {
            stmrs[items[index].stmrUnit] = items[index];
        }
        if (items[index].eventNames && items[index].eventNames.some(event => eventsToSearch.includes(event))) {
            items[index].eventNames.forEach(eventNames => {
                if (!events[eventNames]) {events[eventNames] = []}
                events[eventNames].push(items[index]);
            });

        }
        if (items[index].id && idsToSearch.includes(items[index].id)) {
            itemsById[items[index].id] = items[index];
        }
    }
    for (var dateIndex in lastItemReleases) {
        for (var sourceIndex in lastItemReleases[dateIndex].sources) {
            if (lastItemReleases[dateIndex].sources[sourceIndex].type == "banner") {
                lastItemReleases[dateIndex].sources[sourceIndex].items = [];
                for (var unitIndex in lastItemReleases[dateIndex].sources[sourceIndex].units) {
                    lastItemReleases[dateIndex].sources[sourceIndex].items.push(tmrs[lastItemReleases[dateIndex].sources[sourceIndex].units[unitIndex]]);
                    if (stmrs[lastItemReleases[dateIndex].sources[sourceIndex].units[unitIndex]]) {
                        lastItemReleases[dateIndex].sources[sourceIndex].items.push(stmrs[lastItemReleases[dateIndex].sources[sourceIndex].units[unitIndex]]);
                    }
                }
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "event") {
                lastItemReleases[dateIndex].sources[sourceIndex].items = events[lastItemReleases[dateIndex].sources[sourceIndex].name];
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "storyPart") {
                lastItemReleases[dateIndex].sources[sourceIndex].items = [];
                for (var idIndex in lastItemReleases[dateIndex].sources[sourceIndex].ids) {
                    lastItemReleases[dateIndex].sources[sourceIndex].items.push(itemsById[lastItemReleases[dateIndex].sources[sourceIndex].ids[idIndex]])
                }
            }
        }
    }
}

function exportAsCsv() {
    var csv = "Item Id;Item Name;Item type;Number Owned;TMR of;Access;Enhancement 1;Enhancement 2;Enhancement 3\n";
    var sortedItems = sort(equipments).concat(sort(materia));
    for (var index = 0, len = sortedItems.length; index < len; index++) {
        var item = sortedItems[index];
        if (itemInventory[item.id]) {
            let ownedNumber = itemInventory[item.id];
            if (itemInventory.enchantments[item.id]) {
                ownedNumber -= itemInventory.enchantments[item.id].length;
                itemInventory.enchantments[item.id].forEach(enhancements => {
                    csv +=  "\"" + item.id + "\";" + "\"" + item.name + "\";" + "\"" + item.type + '";1;"' + (item.tmrUnit ? units[item.tmrUnit].name : "") + '";"' + item.access.join(", ") + '"';
                    enhancements.forEach(enhancement => {
                        if (enhancement === 'special_1') {
                            csv += ';"' + itemEnhancementLabels[enhancement][item.id] + '"';
                        } else if (enhancement.startsWith('rare')) {
                            csv += ';"' + itemEnhancementLabels[enhancement][item.type] + '"';
                        } else {
                            csv += ';"' + itemEnhancementLabels[enhancement] + '"';
                        }

                    });
                    csv += '\n';

                });
            }
            if (ownedNumber) {
                csv += "\"" + item.id + "\";" + "\"" + item.name + "\";" + "\"" + item.type + "\";" + ownedNumber + ';\"' + (item.tmrUnit ? units[item.tmrUnit].name : "") + "\";\"" + item.access.join(", ") + "\"\n";
            }
        }
    }
    window.saveAs(new Blob([csv], {type: "text/csv;charset=utf-8"}), 'FFBE_Equip - Equipment.csv');
}

function exportAsJson() {
    let exportResult = [];
    let typeById = {};
    data.forEach(item => {
        typeById[item.id] = item.type;
    })
    Object.keys(itemInventory).forEach(id => {
      if (id != "enchantments" && id != "version") {
        let itemResult = {"id" : id, "count": itemInventory[id] };
        if (itemInventory.enchantments && itemInventory.enchantments[id]) {
          itemResult.count -= itemInventory.enchantments[id].length;
          itemInventory.enchantments[id].forEach(enh => {
            let enhancedItemResult = {"id" : id, "count": 1, "enhancements": [] }
            enhancedItemResult.enhancements = enh.map(e => {
                if (e === 'special_1') {
                    return skillIdByItemEnhancement[e][id];
                } else if (e == 'rare_3' || e == 'rare_4') {
                    return skillIdByItemEnhancement[e][typeById[id]];
                } else {
                    return skillIdByItemEnhancement[e];
                }
            })
            exportResult.push(enhancedItemResult);
          })
        }
        if (itemResult.count > 0) {
            exportResult.push(itemResult);
        }
      }
    })

    window.saveAs(new Blob([JSON.stringify(exportResult)], {type: "application/json;charset=utf-8"}), 'FFBE_Equip - Equipment.json');
}

function importInventory() {
  var bodyHTML  = '<div class="alert alert-info">This feature is a Work in Progress. It will override your inventory on FFBE Equip!</div>';
      bodyHTML += '<div class="custom-file mt-3 mb-2">';
      bodyHTML += '  <input type="file" id="importFile" class="custom-file-input" name="importFile" onchange="treatImportFile"/>';
      bodyHTML += '  <label class="custom-file-label" for="importFile">Choose file</label>';
      bodyHTML += '</div>';
      bodyHTML += '<div class="ffbe_content--well p-3 rounded border text-sm" id="importSummary"><a href="https://www.reddit.com/r/FFBraveExvius/comments/dd8ljd/ffbe_sync_is_back/">Instructions to import your data directly from the game</a> (requires login to FFBE with Facebook or Google)</div>';

  if (!dataIds) {
    dataIds = [];
    data.forEach(item => {
      if (!dataIds.includes(item.id)) {
        dataIds.push(item.id)
      }
    });
  }

  importedOwnedUnit = null;

  Modal.show({
    title: "Import inventory",
    body: bodyHTML,
    buttons: [{
      text: "Import",
      onClick: function() {
        if (importedItemInventory) {
          itemInventory = importedItemInventory;
          saveUserData(true, false, false);
          showEquipments();
        } else {
          Modal.show("Please select a file to import");
        }
      }
    }]
  });

  $('#importFile').change(treatImportFile);
}

let dataIds = null;
let importedItemInventory;

function treatImportFile(evt) {
    var f = evt.target.files[0]; // FileList object



    var reader = new FileReader();

    reader.onload = function(){
        try {
            let temporaryResult = JSON.parse(reader.result);
            var errors = importValidator.validate('itemInventory', temporaryResult);

            // validation was successful
            if (errors) {
                Modal.showMessage("imported file doesn't have the correct form : " + JSON.stringify(errors));
                return;
            }
            importedItemInventory = {"enchantments":{}};
            temporaryResult.forEach(item => {
                if (!item.id) {
                    Modal.showMessage("item doesn't have id : " + JSON.stringify(item));
                    importedOwnedUnit = null;
                    return;
                } else {
                    if (!dataIds.includes(item.id)) {
                        Modal.showMessage('unknown item id : ' + item.id);
                        importedOwnedUnit = null;
                        return;
                    }
                    if (!importedItemInventory[item.id]) {
                        importedItemInventory[item.id] = 0;
                    }
                    importedItemInventory[item.id] += parseInt(item.count);

                    if (item.enhancements) {
                        if (!importedItemInventory.enchantments[item.id]) {
                            importedItemInventory.enchantments[item.id] = [];
                        }
                        importedItemInventory.enchantments[item.id].push(item.enhancements.map(e => itemEnhancementBySkillId[e]));
                    }
                }
            });
            $('#importSummary').text('Items to import : ' + Object.keys(importedItemInventory).length);
        } catch(e) {
            Modal.showError('imported file is not in json format', e);
        }

    };
    reader.readAsText(f);

}

function displayStats() {
  var stats = {};

  for (var index = 0, len = equipments.length; index < len; index++) {
    var item = equipments[index];

    // Ini stats for item type if not existing
    if (stats[item.type] === undefined) {
      stats[item.type] = {
        'different': 0,
        'total': 0,
        'number': 0
      };
    }

    stats[item.type].total++;

    if (itemInventory[item.id]) {
      stats[item.type].different++;
      stats[item.type].number += itemInventory[item.id];
    }
  }

  // Add materia
  stats['materia'] = {
    'different': 0,
    'total': 0,
    'number': 0
  };

  for (index = 0, len = materia.length; index < len; index++) {
    var item = materia[index];

    stats['materia'].total++;

    if (itemInventory[item.id]) {
      stats['materia'].different++;
      stats['materia'].number += itemInventory[item.id];
    }
  }

  var $stats = $(".stats");
  for (var statType in stats) {
    var $item = $stats.find('.stats_' + statType);
    $item.find(".value").text(stats[statType].different);
    $item.find(".total").text(stats[statType].total);
    $item.find(".number").text('(' + stats[statType].number + ')');
  }
}

// will be called by common.js at page load
function startPage() {

    var $window = $(window);

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    getStaticData("data", true, function(result) {
        data = result;
        getStaticData("units", true, function(unitResult) {
            units = unitResult;
            prepareSearch(data);
            equipments = keepOnlyOneOfEach(data.filter(d => d.type != "materia"));
            materia = keepOnlyOneOfEach(data.filter(d => d.type == "materia"));
            if (itemInventory) {
                showEquipments();
            }
            getStaticData("lastItemReleases", false, function(result) {
                lastItemReleases = result;
                prepareLastItemReleases();
            });
            getStaticData("releasedUnits", false, function(releasedUnitResult) {
                for (var unitId in units) {
                    if (releasedUnitResult[unitId]) {
                        units[unitId].summon_type = releasedUnitResult[unitId].type;
                    }
                }
            });
        });
    });

    $("#results").addClass(server);


    $window.on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !";
        }
    });

    $window.on('keyup', function (e) {
        // Reset search if escape is used
        if (e.keyCode === 27) {
            $("#searchBox").val('').trigger('input').focus();
        }
    });


    $("#searchBox").on("input", $.debounce(300,showSearch));
    $("#stmrMoogleAvailable").on("input", $.debounce(300,showSearch));
    $('#onlyTimeLimited').on("input", showSearch);
    $('#betterItemsNumber').on("input", $.debounce(300,showSearch));
    $('#enhancementCandidatesSearchDepth').on("input", $.debounce(300,showSearch));
    $('#includeRecipeItems').on("input", showSearch);


}

// create new JJV environment
let importValidator = jjv();

// Register a `user` schema
importValidator.addSchema('itemInventory', {
  type: 'array',
  maxItems: 3000,
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 9,
        maxLength: 10
      },
      count: {
        type:'number'
      },
      enhancements: {
        type: 'array',
        maxItems: 3,
        items: {
          type: 'string',
          minLength: 6,
          maxLength: 6
        }
      }
    },
    required: ['id', 'count']
  }
});
