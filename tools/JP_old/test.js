var fs = require('fs');

fs.readFile('./sources/ability.json', function (err, content) {
            var types = [];
            var result = JSON.parse(content);
            for (var index in result) {
                for (var i in result[index].effects) {
                    if (!types.includes(result[index].effects[i].target_side)) {
                        types.push(result[index].effects[i].target_side)
                    }
                }
                
            }
    console.log(types);
});