/**
 * @typedef {Object} FormulaField
 * @property {Number} numDice
 * @property {Number} [dieSize]
 * @property {Number} flatModifier
 */

const FormulaRegex = /^(\d+)d(\d+)([+-]\d+)?$/;

/**
 * Prepare a `value` string for a dice formula field.
 * @param {FormulaField} field
 */
export function valueFromFormulaField(field) {
  let value = '';

  if (field.numDice) {
    value = `${field.numDice}d${field.dieSize}`;
  }

  if (field.flatModifier !== 0) {
    value += field.flatModifier.signedString();
  }

  return value;
}

/**
 * Process a `value` string into a formula schema.
 * @param {String} value
 * @returns {FormulaField}
 */
export function valueToFormulaField(value) {
  value = value.replaceAll(/\s/g, '');
  value = value.replace('−', '-'); // revert Foundry.signedString() em-dash

  if (/^[+-]?\d+$/.test(value)) {
    return { dieSize: null, numDice: null, flatModifier: parseInt(value) };
  } else if (FormulaRegex.test(value)) {
    const formulaMatch = FormulaRegex.exec(value);

    if (formulaMatch?.length > 1) {
      return {
        numDice: parseInt(formulaMatch.at(1)),
        dieSize: parseInt(formulaMatch.at(2)),
        flatModifier: parseInt(formulaMatch.at(3) ?? 0),
      };
    }
  } else {
    throw new Error(`Invalid damageFormula value "${value}"`);
  }
}
