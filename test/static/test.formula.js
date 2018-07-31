const assert = require('assert');
const {
  parseFormula,
  formulaToString,
} = require('exports-loader?parseFormula,formulaToString!../../static/formula.js');

const testCases = {
  'Maximize HP': {
    type: 'value',
    name: 'hp',
  },
  'Maximize DEF * HP': {
    type: '*',
    value1: { type: 'value', name: 'def' },
    value2: { type: 'value', name: 'hp' },
  },
  'Maximize M_DAMAGE with HP > 6000': {
    type: 'condition',
    condition: {
      type: '>',
      value1: { type: 'value', name: 'hp' },
      value2: { type: 'constant', value: 6000 },
    },
    formula: { type: 'value', name: 'magicalDamage' },
  },
  'Maximize P_DAMAGE with (I_PHYSICAL) AND (HP > 5000)': {
    type: 'condition',
    condition: {
      type: 'AND',
      value1: {
        type: '>',
        value1: { type: 'value', name: 'evade.physical' },
        value2: { type: 'constant', value: 100 },
      },
      value2: {
        type: '>',
        value1: { type: 'value', name: 'hp' },
        value2: { type: 'constant', value: 5000 },
      },
    },
    formula: { type: 'value', name: 'physicalDamage' },
  },
  'Maximize P_DAMAGE with E_LIGHT OR E_FIRE': {
    type: 'condition',
    condition: {
      type: 'OR',
      value1: { type: 'elementCondition', element: 'light' },
      value2: { type: 'elementCondition', element: 'fire' },
    },
    formula: { type: 'value', name: 'physicalDamage' },
    elements: ['light', 'fire'],
  },
};

describe('static.formula', () => {
  describe('#parseFormula', () => {
    Object.keys(testCases).forEach((formula) => {
      it(formula, () => {
        const parsed = parseFormula(formula);
        assert.deepEqual(testCases[formula], parsed);
      });
    });
  });

  describe('#formulaToString', () => {
    Object.keys(testCases).forEach((formula) => {
      it(formula, () => {
        assert.equal(formula, formulaToString(parseFormula(formula)));
      });
    });
  });
});
