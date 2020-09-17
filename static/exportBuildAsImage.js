FFBEEquipBuildAsImage = {
    unitLineHeight:267,
    ffbeEquipUrl: "https://ffbeEquip.com",
    drawTeam: function(canvas, data) {
        let lineNumber = data.units.map(u => u.braveShiftedUnit ? 2 : 1).reduce((acc, v) => acc + v, 0);
        canvas.height = FFBEEquipBuildAsImage.unitLineHeight * lineNumber;
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let lineIndex = 0;
        data.units.forEach(unit => {
            FFBEEquipBuildAsImage.drawBuild(ctx, unit, lineIndex);
            lineIndex++;
            if (unit.braveShiftedUnit) {
                FFBEEquipBuildAsImage.drawBuild(ctx, unit.braveShiftedUnit, lineIndex, true);
                lineIndex++;
            }
        });
        
        ctx.fillStyle = 'white';
        ctx.textAlign = "start"
        ctx.textBaseline = "bottom";
        ctx.font = "8px Arial";
    },


    drawBuild: function(ctx, unit, unitLine = 0, braveShifted = false) {

        let grd = ctx.createLinearGradient(0, 0, 900, FFBEEquipBuildAsImage.unitLineHeight);
        grd.addColorStop(0, "#0000b2");
        grd.addColorStop(1, "#00002d");

        // Fill with gradient
        ctx.fillStyle = grd;
        ctx.fillRect(4, 4 + unitLine * FFBEEquipBuildAsImage.unitLineHeight, 726, 258);

        FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + '/img/box.png', 0, 0 + unitLine * FFBEEquipBuildAsImage.unitLineHeight, 730, 267, 1, false, () => {
            if (braveShifted) {
                FFBEEquipBuildAsImage.drawBraveShiftSeparator(ctx, unitLine);
            }
        });

        let unitId = unit.id;
        let iconId = unitId.substr(0,unitId.length-1) + (unit.rarity == 'NV' ? '7' : unit.rarity);
        FFBEEquipBuildAsImage.drawImageCentered(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + `/img/units/unit_ills_${iconId}.png`, 52, 52 + unitLine * FFBEEquipBuildAsImage.unitLineHeight, 1, () => {
    
            let x = 105;
            let y = 35 + unitLine * FFBEEquipBuildAsImage.unitLineHeight;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'white';
            ctx.textAlign = "start"
            ctx.textBaseline = "bottom";
            ctx.font = "italic 12px Arial";
            ctx.fillText("HP", x, y + 20);
            ctx.fillText("MP", x +100, y + 20);
            ctx.fillText("ATK", x, y + 40);
            ctx.fillText("DEF", x + 100, y + 40);
            ctx.fillText("MAG", x, y + 60);
            ctx.fillText("SPR", x +100, y + 60);
            
            ctx.font = "16px Arial";
            let name = unit.name;
            if (unit.exAwakening) {
                name += ' EX+' + unit.exAwakening;
            }
            ctx.fillText(name, 105, y - 5);

            ctx.font = "bold 18px Arial";
            
            let line = 0;
            let column = 0;
            ctx.textAlign = "end";
            ["hp", "mp", "atk", "def", "mag", "spr"].forEach(stat => {
                ctx.fillText(unit.calculatedValues[stat].value, x + 80 + column * 100, y + 21 + line * 20);
                if (unit.pots[stat]) {
                    ctx.strokeStyle = 'black';
                    ctx.beginPath();
                    ctx.moveTo(x + 85 + column * 100, y + 18 + line * 20);
                    ctx.lineTo(x + 85 + column * 100, y + 3 + line * 20);
                    ctx.stroke();

                    ctx.strokeStyle = '#00ff00';
                    ctx.beginPath();
                    ctx.moveTo(x + 85 + column * 100, y + 18 + line * 20);
                    ctx.lineTo(x + 85 + column * 100, y + 18 + line * 20 - (15 * Math.min(1, unit.pots[stat] / unit.maxPots[stat])));
                    ctx.stroke();
                }

                if (unit.pots[stat] > unit.maxPots[stat]) {
                    ctx.strokeStyle = 'black';
                    ctx.beginPath();
                    ctx.moveTo(x + 88 + column * 100, y + 18 + line * 20);
                    ctx.lineTo(x + 88 + column * 100, y + 3 + line * 20);
                    ctx.stroke();

                    ctx.strokeStyle = '#00ff00';
                    ctx.beginPath();
                    ctx.moveTo(x + 88 + column * 100, y + 18 + line * 20);
                    ctx.lineTo(x + 88 + column * 100, y + 18 + line * 20 - (15 * Math.min(1, (unit.pots[stat] - unit.maxPots[stat]) / (unit.maxPots[stat] / 2))));
                    ctx.stroke();
                }

                column++;
                if (column === 2) {
                    line++;
                    column = 0;
                }
            });
            
            ctx.textBaseline = "bottom";
            let additionalValues = [
                {"name":"Evasion", "value":unit.calculatedValues.physicalEvasion.value},
                {"name":"Provoke", "value":unit.calculatedValues.drawAttacks.value},
                {"name":"LB Dmg", "value":unit.calculatedValues.lbDamage.value},
                {"name":"MP/turn", "value":unit.calculatedValues.mpRefresh.value * unit.calculatedValues.mp.value / 100},
                {"name":"LB/turn", "value":unit.calculatedValues.lbPerTurn.value},
                {"name":"LB fill", "value":unit.calculatedValues.lbFillRate.value},
                {"name":"Jmp Dmg", "value":unit.calculatedValues.jumpDamage.value},

            ];
            x = 25;
            y = 100 + unitLine * FFBEEquipBuildAsImage.unitLineHeight;
            line = 0;
            column = 0;
            additionalValues.forEach(valueData => {
                if (valueData.value) {
                    ctx.textAlign = "start"
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.font = "italic 12px Arial";
                    ctx.fillText(valueData.name, x + column * 100, y + line * 20 + 20);
                    ctx.font = "bold 14px Arial";
                    ctx.textAlign = "end"
                    ctx.fillText(valueData.value, x + column * 100 + 80, y + line * 20 + 20);
                    column++;
                    if (column == 3) {
                        line++;
                        column = 0;
                    }
                }
            });
        });

        let x = 355;
        let y = 5 + unitLine * FFBEEquipBuildAsImage.unitLineHeight;

        unit.items.forEach((item, index) => {
            if (item && item.id != 'unavailable') {
                let line = Math.floor(item.slot / 2);
                let column = item.slot % 2;
                FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + `/img/items/${item.icon}`, x + column * 180, y + line * 30, 40, 40);
                let color = 'white';
                if (unit.itemEnchantments[index]) {
                    color = '#e74c3c';
                }
                FFBEEquipBuildAsImage.drawText(ctx, item.name, 'bold', 12, 'start', 'middle', x + 40 + column * 180, y + line * 30 + 20, 130, color);
            }
        });
        let line = 5;
        let column = 1;
        if (unit.esperId) {
            FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + `/img/espers/${unit.esperId}.jpg`, x + column * 180 + 5, y + line * 30 + 5, 30, 30, 1, true);
            FFBEEquipBuildAsImage.drawText(ctx, unit.esperId.replace('_', ' '), 'bold', 12, 'start', 'middle', x + 40 + column * 180, y + line * 30 + 20, 130);
        } else {
            FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + `/img/espers/ALL.png`, x + column * 180 + 5, y + line * 30 + 5, 30, 30, 1, true);
            FFBEEquipBuildAsImage.drawText(ctx, 'No esper', 'bold', 12, 'start', 'middle', x + 40 + column * 180, y + line * 30 + 20, 130);
        }

        let red ='#ff0000';
        let green ='#00ff00';
        x=10;
        y=196 + unitLine * FFBEEquipBuildAsImage.unitLineHeight;
        ['fire','ice','lightning','water','wind','earth','light','dark'].forEach((element, index) => {
            let savedX = x;
            let savedY = y;
            let alpha = 1;
            let resist = unit.calculatedValues.elementResists[element];
            if (!resist) {
                alpha = 0.4;
            }
            let color = green;
            if (resist < 0) {
                color = red;
            }

            FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + `/img/icons/elements/${element}.png`, x + index * 30, y, 30, 30, alpha, false, () => {
                if (resist) {
                    ctx.font = "bold 14px Arial";
                    let textWidth = ctx.measureText(resist).width;
                    ctx.fillStyle = 'black';
                    ctx.globalAlpha = 1;
                    ctx.fillRect(savedX + 29 - textWidth + index * 30, savedY + 16, textWidth, 12);
                    FFBEEquipBuildAsImage.drawText(ctx, resist, 'bold', 12, 'end', 'bottom', savedX + 28 + index * 30, savedY + 30, 0, color);
                }
            });
        });
        x=10;
        y=228 + unitLine * FFBEEquipBuildAsImage.unitLineHeight;
        ['poison','blind','sleep','silence','paralysis','confuse','disease','petrification','death', "charm", "stop"].forEach((ailment, index) => {
            let savedX = x;
            let savedY = y;
            let alpha = 1;
            let resist = Math.min(100, unit.calculatedValues.ailmentResists[ailment]);
            if (!resist) {
                alpha = 0.4;
            }
            let color = green;
            if (resist < 0) {
                color = red;
            }
            FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + `/img/icons/ailments/${ailment}.png`, x + index * 30, y, 30, 30, alpha, false, () => {
                if (resist) {
                    ctx.font = "bold 14px Arial";
                    let textWidth = ctx.measureText(resist).width;
                    ctx.fillStyle = 'black';
                    ctx.globalAlpha = 1;
                    ctx.fillRect(savedX + 29 - textWidth + index * 30, savedY + 16, textWidth, 12);
                    FFBEEquipBuildAsImage.drawText(ctx, resist, 'bold', 12, 'end', 'bottom', savedX + 28 + index * 30, savedY + 30, 0, color);
                }
            });
        });

        let races = ['aquatic','beast','bird','bug','demon','dragon','human','machine','plant','undead','stone','spirit'];

        x = 355;
        y = 196 + unitLine * FFBEEquipBuildAsImage.unitLineHeight;
        races.forEach((race, index) => {
            let savedX = x;
            let savedY = y;
            let alpha = 1;
            let killer = unit.calculatedValues.killers[race].physical;
            if (!killer) {
                alpha = 0.4;
            }
            FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + `/img/icons/killers/physical-${race}.png`, x + index * 30, y, 30, 30, alpha, false, () => {
                if (killer) {
                    ctx.font = "bold 14px Arial";
                    let textWidth = ctx.measureText(killer).width;
                    ctx.fillStyle = 'black';
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(savedX + 29 - textWidth + index * 30, savedY + 16, textWidth, 12);
                    FFBEEquipBuildAsImage.drawText(ctx, killer, 'bold', 12, 'end', 'bottom', savedX + 28 + index * 30, savedY + 30);
                }
            });
        });

        x = 355;
        y = 228 + unitLine * FFBEEquipBuildAsImage.unitLineHeight;
        races.forEach((race, index) => {
            let savedX = x;
            let savedY = y;
            let alpha = 1;
            let killer = unit.calculatedValues.killers[race].magical;
            if (!killer) {
                alpha = 0.4;
            }
            FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + `/img/icons/killers/magical-${race}.png`, x + index * 30, y, 30, 30, alpha, false, () => {
                if (killer) {
                    ctx.font = "bold 14px Arial";
                    let textWidth = ctx.measureText(killer).width;
                    ctx.fillStyle = 'black';
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(savedX + 29 - textWidth + index * 30, savedY + 16, textWidth, 12);
                    FFBEEquipBuildAsImage.drawText(ctx, killer, 'bold', 12, 'end', 'bottom', savedX + 28 + index * 30, savedY + 30);
                }
            });
        });
    },

    drawBraveShiftSeparator: function(ctx, lineIndex) {
        FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + '/img/icons/braveShift_small.png', 5, -6 + lineIndex * FFBEEquipBuildAsImage.unitLineHeight, 66, 12);
    },

    drawImage: function(ctx, imageUrl, x, y, w, h, alpha = 1, rounded = false, callback) {
        let image = new Image();
        image.onload = () => {
            ctx.globalAlpha = alpha;
            if (rounded) {
                ctx.save();
                FFBEEquipBuildAsImage.roundedImagePath(ctx, x,y,w,h);
                ctx.clip();
            }
            ctx.drawImage(image, x, y, w, h);
            if (rounded) {
                ctx.restore();
            }
            if (callback) {
                callback();
            }
        }
        image.onerror = () => {
            if (imageUrl !== FFBEEquipBuildAsImage.ffbeEquipUrl + '/img/items/icon_unknown.png') {
                // try default unit image
                FFBEEquipBuildAsImage.drawImage(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + '/img/items/icon_unknown.png', x, y, w, h, alpha, rounded, callback);
            } else {
                if (callback) {
                    callback();
                }
            }
        }
        image.src = imageUrl;
    },
    
    drawImageCentered: function(ctx, imageUrl, x, y, ratio, callback) {
        let image = new Image();
        image.onload = () => {
            let w = image.width * ratio;
            let h = image.height * ratio;
            ctx.globalAlpha = 1;
            ctx.drawImage(image, x - w /2, y - h / 2, w, h);
            if (callback) {
                callback();
            }
        }
        image.onerror = () => {
            if (imageUrl !== FFBEEquipBuildAsImage.ffbeEquipUrl + '/img/units/unit_ills_999999999.png' && imageUrl.indexOf('img/units') > 0) {
                // try default unit image
                FFBEEquipBuildAsImage.drawImageCentered(ctx, FFBEEquipBuildAsImage.ffbeEquipUrl + '/img/units/unit_ills_999999999.png', x, y, ratio, callback);
            } else {
                if (callback) {
                    callback();
                }
            }
        }
        image.src = imageUrl;
    },
    
    roundedImagePath: function(ctx, x,y,width,height){
        let radius = 10;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    drawText: function(ctx, text, style, size, textAlign, textBaseline, x, y, maxX, color = 'white'){
        let font = size + 'px Arial';
        if (style) {
            font = style + ' ' + font;
        }
        ctx.globalAlpha = 1;
        ctx.font = font;
        ctx.textBaseline = textBaseline;
        ctx.textAlign = textAlign;
        ctx.fillStyle = color;
        let lines = [];
        if (maxX) {
            lines = FFBEEquipBuildAsImage.getLines(ctx, text, maxX);
        } else {
            lines = [text];
        }
        let baseY = 0;
        if (textBaseline === 'middle') {
            baseY = -(lines.length - 1) * (size + 2) / 2
        }
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, baseY + y + i * (size + 2));
        }
    },

    getLines: function(ctx, text, maxWidth) {
        var words = text.split(" ");
        var lines = [];
        var currentLine = words[0];

        for (var i = 1; i < words.length; i++) {
            var word = words[i];
            var width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
}
