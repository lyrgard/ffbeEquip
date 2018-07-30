const assert = require('assert');
const migration = require('../../../server/lib/migration.js');

describe('lib.migration', () => {
  it('.missing schema', () => {
    const oldData = { d: '1234' };
    const newData = migration.up('missing', oldData);
    assert.equal(newData, oldData);
  });

  it('.itemInventory v1', () => {
    const old = {
      Excalipoor: 1,
      'Save the Queen': 11,
      unrelated: 'test',
      version: 1,
    };
    const inventory = migration.up('itemInventory', old);
    assert.deepEqual(inventory, {
      303001400: 11,
      303001600: 1,
      unrelated: 'test',
      version: 3,
    });
  });

  it('.itemInventory v2', () => {
    const old = {
      303003500: 12,
      version: 2,
    };
    const inventory = migration.up('itemInventory', old);
    assert.deepEqual(inventory, {
      303001400: 12,
      version: 3,
    });
  });

  it('.itemInventory v3', () => {
    const old = {
      303001400: 12,
      version: 10,
    };
    const inventory = migration.up('itemInventory', old);
    assert.deepEqual(inventory, old);
  });
});
