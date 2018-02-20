var data = "General Hospitality;A;;55.1;;;;29.39;White Magic: 7;+4%;16%|"+
"Stranger Stuff;A;;55.1;;;29.39;;Black Magic: 7;+4%;16%|"+
"He Who Smelt It;A;2142;53.55;;;85.68;85.68;Green Magic: 7;+4%;16%|"+
"Full House;A;2164;54.1;;;;43.28;Equipable: Harp;+4%;16%|"+
"A Beast's Bounty;A;;108.2;43.28;;43.28;;Equipable: Whip;+4%;16%|"+
"Child's Play;A;1082;;43.28;86.56;;;Equipable: Throwing;+4%;16%|"+
"A Priest, a Monk, and a Paladin;A;2172;108.6;86.88;86.88;86.88;;Equipable: Mace;+4%;16%|"+
"Shopping for Medicine;A;;54.1;;;86.56;43.28;White Magic: 7;+4%;16%|"+
"The Missing Key;A;2142;107.1;;;42.84;85.68;Black Magic: 7;+4%;16%|"+
"Across the Desert;A;2142;53.55;;;85.68;85.68;Green Magic: 7;+4%;16%|"+
"Cook Off;A;2389;119.45;95.56;;47.78;95.56;Series: FFXV;+4%;16%|"+
"Tavern Cleanup;A;2429;121.45;97.16;97.16;97.16;97.16;Series: FFIII;+4%;16%|"+
"Too Many Coeurls;A;2389;;47.78;95.56;95.56;95.56;Series: FFII;+4%;16%|"+
"Lost in the Dark;A;1190;;95.2;47.6;;95.2;Series: FFI;+4%;16%|"+
"Anger Management;A;2389;119.45;;95.56;95.56;47.78;White Magic: 7;+4%;16%|"+
"Wrath in the Wreckage;A;2389;119.45;;95.56;47.78;95.56;Black Magic: 7;+4%;16%|"+
"Seven Years Bad Luck;A;1190;59.5;;95.2;;95.2;Green Magic: 7;+4%;16%|"+
"Ghost Busted;A;2389;119.45;;95.56;95.56;47.78;White Magic: 7;+4%;16%|"+
"What's Her Secret?;A;2389;119.45;;95.56;47.78;95.56;Black Magic: 7;+4%;16%|"+
"Braving the Elements;A;1190;59.5;;95.2;;95.2;Green Magic: 7;+4%;16%|"+
"Lost in the World;S;2298;229.8;91.92;91.92;;;Equipable: Great Sword;+3%;16%|"+
"Hotline Grandshelt;S;4447;222.35;59.29;177.88;;177.88;Equipable: Katana;+3%;16%|"+
"Break Time;S;4596;114.9;;;91.92;91.92;Equipable: Bow;+3%;16%|"+
"Reinventing the Wheel;S;4575;228.75;91.5;91.5;;183;Equipable: Hammer;+3%;16%|"+
"Winter is Coming;S;;114.9;;183.84;91.92;91.92;Equipable: Robe;+3%;16%|"+
"Hide your wallets!;S;4447;222.35;59.29;177.88;;177.88;Equipable: Gun;+3%;16%|"+
"Paper, Please!;S;4575;114.38;183;;91.5;183;Equipable: Spear;+3%;16%|"+
"Wherefore Art Thou, Father;S;2298;229.8;91.92;91.92;;;Equipable: Great Sword;+3%;16%|"+
"A \"Legendary\" Challenge;S;4447;222.35;59.29;177.88;;177.88;Equipable: Katana;+3%;16%|"+
"Where's My Mommy?;S;4596;114.9;;;91.92;91.92;Equipable: Bow;+3%;16%|"+
"Be the Best;S;4575;228.75;91.5;91.5;;183;Equipable: Hammer;+3%;16%|"+
"Hot Ice;S;;114.9;;183.84;91.92;91.92;Equipable: Robe;+3%;16%|"+
"Save the Children;S;4447;222.35;59.29;177.88;;177.88;Equipable: Gun;+3%;16%|"+
"Magi in Danger;S;4575;114.38;183;;91.5;183;Equipable: Spear;+3%;16% |";

var result = "";
var lines = data.split("|");
console.log(lines);
for (var lineIndex in lines) {
    var elements = lines[lineIndex].split(";");
    console.log(elements);
    result += '<li><a tabindex="-1" href="#" onclick="addToCustomFormula(\'';
    var first = true;
    if (elements[2]) {
        if (first) {
            first = false;
        } else {
            result += " + ";
        }
        result += "HP/" + elements[2]
    }
    if (elements[3]) {
        if (first) {
            first = false;
        } else {
            result += " + ";
        }
        result += "MP/" + elements[3]
    }
    if (elements[4]) {
        if (first) {
            first = false;
        } else {
            result += " + ";
        }
        result += "ATK/" + elements[4]
    }
    if (elements[5]) {
        if (first) {
            first = false;
        } else {
            result += " + ";
        }
        result += "DEF/" + elements[5]
    }
    if (elements[6]) {
        if (first) {
            first = false;
        } else {
            result += " + ";
        }
        result += "MAG/" + elements[6]
    }
    if (elements[7]) {
        if (first) {
            first = false;
        } else {
            result += " + ";
        }
        result += "SPR/" + elements[7]
    }
    result += '\')">' + elements[0] + '</a></li>\n';
}

console.log(result);