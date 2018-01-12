function getValue(item, valuePath) {
    var value = item[valuePath];
    if (value == undefined) {
        if (valuePath.indexOf('.') > -1) {
            value = getValueFromPath(item, valuePath);
        } else {
            value = 0;
        }
        item[valuePath] = value;
    }
    return value;
}

function getValueFromPath(item, valuePath) {
    var pathTokens = valuePath.split(".");
    var currentItem = item;
    for (var index = 0, len = pathTokens.length; index < len; index++) {
        if (currentItem[pathTokens[index]]) {
            currentItem = currentItem[pathTokens[index]];
        } else if (pathTokens[index].indexOf('|') > -1) {
            var tmpToken = pathTokens[index].split("|");
            var property = tmpToken[0];
            var name = tmpToken[1];
            if (currentItem[property]) {
                for (var listIndex = currentItem[property].length; listIndex--;) {
                    if (currentItem[property][listIndex].name == name) {
                        currentItem = currentItem[property][listIndex];
                        break;
                    }
                }
            } else {
                return 0; 
            }
        } else {
            return 0;
        }
    }
    return currentItem;
}