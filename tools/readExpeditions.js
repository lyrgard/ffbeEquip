var data = "Relic Hunting Craze I;D;1;;;;;;Series: FFBE;+15%;100%|"+
"Relic Hunting Craze II;D;1;;;;;;Series: FFBE;+15%;50%|"+
"Relic Hunting Craze III;D;1;;;;;;Series: FFBE;+15%;30%|"+
"Strange Encounters;D;;;3.12;;;;Equippable: Dagger;+15%;30%|"+
"Shirts and Skins;D;;;;3.12;;Equippable: Clothes;+15%;30%|"+
"Put to the Test;D;;;3.12;;;;Equippable: Sword;+15%;30%|"+
"Needle in a Haystack;D;;;;;3.12;;Equippable: Rod;+15%;30%|"+
"Merchant Guard;D;104;;;4.16;;;Equippable: Light Shield;+15%;30%|"+
"Guard Duty;D;104;;;4.16;;;Equippable: Heavy Shield;+15%;30%|"+
"Mouse Trapped;D;;;;;;3.12;White Magic: 2;+15%;30%|"+
"Farmer's Dismay;D;;;;;3.12;Black Magic: 2;+15%;30%|"+
"Cause for Celebration;D;;3.9;;;;;Green Magic: 2;+15%;30%|"+
"What Might Happen?;D;;;;;;3.12;White Magic: 2;+15%;30%|"+
"Flame Fighters;D;;;;;3.12;;Black Magic: 2;+15%;30%|"+
"Devilish Arms;D;;3.9;;;;;Green Magic: 2;+15%;30%|"+
"Can't Beat Free;D;;;;;3.12;;Equippable: Hat;+15%;30%|"+
"To the Rescue;D;;;;3.12;;;Equippable: Light Armor;+15%;30%|"+
"Heavy Objects Collide;D;;;;3.12;;;Equippable: Heavy Armor;+15%;30%|"+
"Lightning Rod;D;;;;;;3.12;Equippable: Helm;+15%;30%|"+
"Dream Job;D;;5.2;;;;4.16;Series: FFBE;+15%;30%|"+
"No Sheep to Count;D;;5.2;;;;4.16;Series: FFBE;+15%;30%|"+
"Poker Tournament;D;;;;;4.16;4.16;Series: FF TYPE-0;+15%;30%|"+
"Winter Retreat;D;104;5.2;;;;;Series: FFT;+15%;30%|"+
"Buzzkill;C;;;7.76;;;;Equippable: Dagger;+10%;20%|"+
"Just Cause;C;;17.25;;;13.8;;Equippable: Clothes;+10%;20%|"+
"Bad to the Bone;C;;;13.8;13.8;;;Equippable: Sword;+10%;20%|"+
"Volcano on Ice;C;;;;;7.76;;Equippable: Staff;+10%;20%|"+
"Leave No Stones Unturned;C;;;7.76;;;;Equippable: Rod;+10%;20%|"+
"Precious Lumber;C;345;;13.8;;;;Equippable: Axe;+10%;20%|"+
"Test Your Strength;C;423;;16.92;16.92;;;Equippable: Fist;+10%;20%|"+
"Targeted;C;423;;;16.92;;16.92;Equippable: Light Shield;+10%;20%|"+
"Call to Arms;C;;;13.8;13.8;;;Equippable: Heavy Shield;+10%;20%|"+
"Grand Theft Carriage;C;;17.25;;;;;13.8;;Equippable: Helm;+10%;20%|"+
"Paging All White Mages;C;;;;;;7.76;White Magic: 3;+10%;20%|"+
"The Mage-Off;C;;;;;7.76;;Black Magic: 3;+10%;20%|"+
"Crab Battle;C;345;17.25;;;;;Green Magic: 3;+10%;20%|"+
"None Shall Starve;C;;17.25;;;;13.8;White Magic: 3;+10%;20%|"+
"Stop the Horde!;C;;;13.8;;13.8;;Black Magic: 3;+10%;20%|"+
"Arms on Fire!;C;;;;13.8;;13.8;Green Magic: 3;+10%;20%|"+
"Lost in Fantasy;C;423;;;16.92;;16.92;Series: FFBE;+10%;20%|"+
"Time to Relax;C;423;;;16.92;;16.92Series: FFBE;+10%;20%|"+
"Parley?;C;;;8.62;17.24;;;Series: FFXII;+10%;20%|"+
"Lightning Returns?;C;;;;;8.62;17.24Series: FFXIII;+10%;20%|"+
"Plumbers Paradise;B;;;39.72;39.72;;39.72;White Magic: 5;+6%;16%|"+
"Spelunking Splendor;B;993;;39.72;;39.72;;Black Magic: 5;+6%;16%|"+
"Will to Survive;B;505.5;50.55;;;;;Green Magic: 5;+6%;16%|"+
"Unpleasant Dreams;B;;49.65;;;39.72;39.72;White Magic: 5;+6%;16%|"+
"Egg Hunt;B;993;;39.72;;39.72;;Black Magic: 5;+6%;16%|"+
"Back to the Sands;B;;49.65;;;39.72;39.72;Green Magic: 5;+6%;16%|"+
"Weathering the Weather;B;993;49.65;;;;39.72;Equippable: Staff;+6%;16%|"+
"Quarry Quickness;B;505.5;;40.44;;;;Equippable: Axe;+6%;16%|"+
"Cat Lost;B;1159;28.98;;;;46.36;Equippable: Harp;+6%;16%|"+
"Monster Tamer;B;;49.65;39.72;;39.72;;Equippable: Whip;+6%;16%|"+
"Run, Cactuar, Run;B;;;20.22;;40.44;;Equippable: Throwing;+6%;16%|"+
"A Certain Set of Skills;B;1011;;20.22;;;;Equippable: Mace;+6%;16%|"+
"Basher's Brawl;B;993;;39.72;39.72;;;Equippable: Fist;+6%;16%|"+
"Undead Rising;B;;50.55;;;;20.22;White Magic: 5;+6%;16%|"+
"Will It Hold?;B;;50.55;;;20.22;;Black Magic: 5;+6%;16%|"+
"Crying Over Spilt Milk;B;993;49.65;;;;39.72;Green Magic: 5;+6%;16%|"+
"Sword in the Stone;B;1159;;23.18;46.36;;;Series: FFIV;+6%;16%|"+
"Join the Circus;B;1165;58.25;46.6;46.6;;;Series: FFIX;+6%;16%|"+
"Hot Topic;B;;57.95;;;23.18;46.36;Series: FFVI;+6%;16%|"+
"Impact from Above;B;;;46.6;46.6;46.6;46.6;Series: FFV;+6%;16%|";

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