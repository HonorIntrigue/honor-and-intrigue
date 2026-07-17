/**
 * A hook that expands the advantage panel on the first round of combat.
 * @param {Combat} combat The combat being updated
 * @param {object} changed The object of changed properties
 */
export function onCombatUpdate(combat, changed) {
  if (!('round' in changed) || combat.round !== 1) return;

  for (const { actor } of combat.combatants) {
    const sheet = actor?.sheet;

    if (sheet?.rendered && typeof sheet.expandAdvantagePanel === 'function') {
      sheet.expandAdvantagePanel();
    }
  }
}
