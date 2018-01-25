const fs = require('fs');
const path = require('path');

const GLDataPath = path.join(__dirname, '../../../static/GL/data.json');
const GLData = JSON.parse(fs.readFileSync(GLDataPath, 'utf8'));
const GLDataByName = GLData.reduce((accumulator, current) => {
  /* eslint no-param-reassign: 0 */
  accumulator[current.name] = current.id;
  return accumulator;
}, {});

GLDataByName['Blade Mastery'] = '504201670';
GLDataByName['Zwill Crossblade'] = '1100000083';
GLDataByName['Zwill Crossblade (FFT)'] = '301002000';
GLDataByName['Imperial Helm (Item)'] = '404001100';
GLDataByName['Defender (FFT)'] = '303002400';
GLDataByName['Save the Queen'] = '303001400';

module.exports.up = (inventory) => {
  if (inventory.version >= 2) return inventory;

  const newInventory = Object.keys(inventory).reduce((accumulator, current) => {
    if (GLDataByName[current]) {
      accumulator[GLDataByName[current]] = inventory[current];
    } else {
      accumulator[current] = inventory[current];
    }
    return accumulator;
  }, {});

  newInventory.version = 2;

  return newInventory;
};
