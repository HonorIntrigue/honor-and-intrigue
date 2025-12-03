/**
 * @typedef {Object} EnrichedField
 * @property {String} enriched
 * @property {DataField} field
 * @property {String} value
 */
/**
 * @typedef {Object} FormulaField
 * @property {Number} numDice
 * @property {Number} [dieSize]
 * @property {Number} flatModifier
 */

const FormulaRegex = /^(\d+)d(\d+)([+-]\d+)?$/;

/**
 * Prepares context for a HTML enriched field.
 * @param {ClientDocument} document
 * @param {DataField} field
 * @param {String} value
 * @returns {EnrichedField}
 */
export async function enrichedFieldToContext(document, field, value) {
  return {
    enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(value, {
      rollData: document.getRollData(),
      secrets: document.isOwner,
    }),
    field: field,
    value: value,
  };
}

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
    value += new Intl.NumberFormat(game.i18n.lang, { signDisplay: 'always' }).format(field.flatModifier);
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
