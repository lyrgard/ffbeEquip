module.exports.up = (inventory) => {
  if (inventory.version >= 3) return inventory;

  const newInventory = Object.assign({}, inventory);
  if (inventory['303003500']) {
    newInventory['303001400'] = inventory['303003500'];
    delete newInventory['303003500'];
  }

  newInventory.version = 3;

  return newInventory;
};
