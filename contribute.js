var currentItem;

function addNewItem() {
    if (!currentItem) {
        currentItem = {};
        updateCurrentItemDisplay();
        $(".currentItem").removeClass("hidden");
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
    $(".currentItem .addForm").removeClass("hidden");
}

$(function() {
    populateCurrentItemType();
    populateCurrentItemElement();
    populateAddStat();
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
