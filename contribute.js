var currentItem;
var currentAddFormProperty;

function addNewItem() {
    if (!currentItem) {
        currentItem = {};
        updateCurrentItemDisplay();
        $(".currentItem").removeClass("hidden");
        $(".currentItem .items .name").focus();
    }
}

function updateCurrentItemDisplay() {
    if (currentItem.type) {
        $(".currentItem .typeChoice").prop("src", "img/" + currentItem.type + ".png");
    } else {
        $(".currentItem .typeChoice").prop("src","img/unknownType.png");
    }
    if (currentItem.name) {
        $(".currentItem .name").removeClass("empty");
        $(".currentItem .name a.name").text(currentItem.name).prop("href",toUrl(currentItem.name));
    } else {
        $(".currentItem .name").addClass("empty");
    }
    $(".currentItem .name .detail").html(getStatDetail(currentItem));
    var special = $(".currentItem .td.special");
    if (currentItem.element) {
        $(".currentItem .special .elementChoice").prop("src", "img/" + currentItem.element + ".png");
    } else {
        $(".currentItem .special .elementChoice").prop("src", "img/noElement.png");
    }
    var otherSpecials = $(".currentItem .td.special .otherSpecials");
    otherSpecials.empty();
    if (currentItem.ailments) {
        otherSpecials.append(getAilmentsHtml(currentItem));
    }
    if (currentItem.resist) {
        otherSpecials.append(getResistHtml(currentItem));
    }
    if (currentItem.killers) {
        otherSpecials.append(getKillersHtml(currentItem));
    }
    var access = $(".currentItem .td.access");
    access.empty();
    if (currentItem.access) {
        $(currentItem.access).each(function(index, itemAccess) {
            access.append("<div>" + itemAccess + "</div>"); 
        });
    }
    if (currentItem.tmrUnit) {
        access.append('<div><a href="' + toUrl(currentItem.tmrUnit) + '">' + currentItem.tmrUnit + '</a></div>');
    }
}

function selectType(type) {
    currentItem.type = type;
    updateCurrentItemDisplay();
}

function selectElement(element) {
    if (element) {
        currentItem.element = element;
    } else {
        delete currentItem.element;
    }
    updateCurrentItemDisplay();
}

function selectStat(stat) {
    $(".currentItem .addButtons").addClass("hidden");
    $(".currentItem .addForm .name").text(stat);
    var input = $(".currentItem .addForm input");
    input.val("");
    currentAddFormProperty = stat;
    $(".currentItem .addForm").removeClass("hidden");
    input.focus();
}



function selectAilment(ailment) {
    $(".currentItem .addButtons").addClass("hidden");
    $(".currentItem .addForm .miniIcon").prop("src", "img/sword.png");
    $(".currentItem .addForm .icon").prop("src", "img/" + ailment +".png");
    $(".currentItem .addForm .name").text("%");
    var input = $(".currentItem .addForm input");
    input.val("");
    currentAddFormProperty = "ailment-" + ailment;
    $(".currentItem .addForm").removeClass("hidden");
    input.focus();
}

function selectResist(resist) {
    $(".currentItem .addButtons").addClass("hidden");
    $(".currentItem .addForm .miniIcon").prop("src", "img/heavyShield.png");
    $(".currentItem .addForm .icon").prop("src", "img/" + resist +".png");
    $(".currentItem .addForm .name").text("%");
    var input = $(".currentItem .addForm input");
    input.val("");
    currentAddFormProperty = "resist-" + resist;
    $(".currentItem .addForm").removeClass("hidden");
    input.focus();
}
function selectKiller(killer) {
    $(".currentItem .addButtons").addClass("hidden");
    $(".currentItem .addForm .miniIcon").prop("src", "");
    $(".currentItem .addForm .icon").prop("src", "img/killer.png");
    $(".currentItem .addForm .name").text(killer + " %");
    var input = $(".currentItem .addForm input");
    input.val("");
    currentAddFormProperty = killer;
    $(".currentItem .addForm").removeClass("hidden");
    input.focus();
}
function selectAccess(access) {
    if (access.startsWith("TMR")) {
        $(".currentItem .addButtons").addClass("hidden");
        $(".currentItem .addForm .miniIcon").prop("src", "");
        $(".currentItem .addForm .icon").prop("src", "");
        $(".currentItem .addForm .name").text("TMR of");
        var input = $(".currentItem .addForm input");
        input.val("");
        currentAddFormProperty = access;
        $(".currentItem .addForm").removeClass("hidden");
        input.focus();
    } else {
        addAccess(access);
        updateCurrentItemDisplay();
    }
}

function addAccess(access) {
    if (!currentItem.access) {
        currentItem.access = [];
    }
    if (!currentItem.access.includes(access)) {
        currentItem.access.push(access);
    }
}

function validateAddForm() {
    var value = $(".currentItem .addForm input").val();
    if (!value) {
        alert("Please enter a value");
        return;
    }
    if (baseStats.includes(currentAddFormProperty) || (currentAddFormProperty.endsWith('%'))) {
        if (isNaN(parseInt(value))) { alert("please enter an number"); return;}
        currentItem[currentAddFormProperty] = parseInt(value);
    } else if (currentAddFormProperty.startsWith("ailment-")) {
        if (isNaN(parseInt(value))) { alert("please enter an number"); return;}
        var ailment = currentAddFormProperty.substr(8);
        addPercentageValue("ailments",ailment, parseInt(value));
    } else if (currentAddFormProperty.startsWith("resist-")) {
        if (isNaN(parseInt(value))) { alert("please enter an number"); return;}
        var resist = currentAddFormProperty.substr(7);
        addPercentageValue("resist",resist, parseInt(value));
    } else if (killerList.includes(currentAddFormProperty)) {
        if (isNaN(parseInt(value))) { alert("please enter an number"); return;}
        addPercentageValue("killers",currentAddFormProperty, parseInt(value));
    } else if (currentAddFormProperty.startsWith("TMR")) {
        addAccess(currentAddFormProperty);
        currentItem.tmrUnit = value;
    }
    currentAddFormProperty = null;
    hideAddForm();
    updateCurrentItemDisplay();
    
}

function addPercentageValue(propertyName, name, percent) {
    if (!currentItem[propertyName]) {
            currentItem[propertyName] = [];
        }
        var found = false;
        for (var index in currentItem[propertyName]) {
            if (currentItem[propertyName][index].name == name) {
                found = true;
                currentItem[propertyName][index].percent = percent;
            }
        }
        if (!found) {
            currentItem[propertyName].push({"name":name, "percent": percent});
        }
}

function hideAddForm() {
    $(".currentItem .addForm").addClass("hidden");
    $(".currentItem .addButtons").removeClass("hidden");
    $(".currentItem .addForm .miniIcon").prop("src", "");
    $(".currentItem .addForm .icon").prop("src", "");
}

$(function() {
    populateCurrentItemType();
    populateCurrentItemElement();
    populateAddStat();
    populateAddAilment();
    populateAddResist();
    populateAddKiller();
    populateAddAccess();
    $('.currentItem .name input').on("input",$.debounce(300,function() {
        currentItem.name = $('.currentItem .name input').val();
        updateCurrentItemDisplay();
    }));
});

function populateCurrentItemType() {
    var target = $(".currentItem .type .dropdown-menu");
	for (var key in typeList) {
        target.append('<img src="img/' + typeList[key] + '.png" onclick="selectType(\'' + typeList[key] + '\');" class="btn btn-default"/>');
	}
}
function populateCurrentItemElement() {
    var target = $(".currentItem .special .element .dropdown-menu");
	for (var key in elementList) {
        target.append('<img src="img/' + elementList[key] + '.png" onclick="selectElement(\'' + elementList[key] + '\');" class="btn btn-default"/>');
	}
    target.append('<img src="img/noElement.png" onclick="selectElement(null);" class="btn btn-default"/>');
}
function populateAddStat() {
    var target = $(".currentItem .addStat .dropdown-menu");
	for (var key in baseStats) {
        target.append('<span class="btn btn-default stat" onclick="selectStat(\'' + baseStats[key] + '\')">' + baseStats[key] + '</span>');
        target.append('<span class="btn btn-default stat" onclick="selectStat(\'' + baseStats[key] + '%\')">' + baseStats[key] + '%</span>');
	}
}
function populateAddAilment() {
    var target = $(".currentItem .addAilment .dropdown-menu");
	for (var key in ailmentList) {
        target.append('<img src="img/' + ailmentList[key] + '.png" onclick="selectAilment(\'' + ailmentList[key] + '\');" class="btn btn-default"/>');
	}
}
function populateAddResist() {
    var target = $(".currentItem .addResist .dropdown-menu");
	for (var key in ailmentList) {
        target.append('<img src="img/' + ailmentList[key] + '.png" onclick="selectResist(\'' + ailmentList[key] + '\');" class="btn btn-default"/>');
	}
    for (var key in elementList) {
        target.append('<img src="img/' + elementList[key] + '.png" onclick="selectResist(\'' + elementList[key] + '\');" class="btn btn-default"/>');
	}
}
function populateAddKiller() {
    var target = $(".currentItem .addKiller .dropdown-menu");
	for (var key in killerList) {
        target.append('<span class="btn btn-default killer" onclick="selectKiller(\'' + killerList[key] + '\')">' + killerList[key] + '</span>');
	}
}
function populateAddAccess() {
    var target = $(".currentItem .addAccess .dropdown-menu");
	for (var key in accessList) {
        target.append('<span class="btn btn-default access" onclick="selectAccess(\'' + accessList[key] + '\')">' + accessList[key] + '</span>');
	}
}