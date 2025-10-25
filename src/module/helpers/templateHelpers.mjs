/**
 * Initialize Handlebars extensions and helpers.
 */
export function initialize() {
  Handlebars.registerHelper({
    getItemControls,
  });
}

/**
 * Get a set of additional controls based on item type.
 * @param {Object} item
 */
export function getItemControls(item) {
  let result = '';

  if (item.type === 'armor' || item.type === 'weapon') {
    result = document.createElement('a');
    result.dataset.action = 'toggleItemEquipped';
    result.dataset.tooltip = item.system.carriedPositionLabel;
    result.insertAdjacentHTML('beforeend', `<i class='${item.system.carriedPositionIcon}'></i>`);
    result = result.outerHTML;
  } else if (item.type === 'maneuver' && item.system.mastery) {
    result = document.createElement('a');
    result.dataset.action = 'toggleManeuverMastery';
    result.dataset.tooltip = game.i18n.localize('HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.ToggleMastery');
    result.insertAdjacentHTML('beforeend', `<i class='fa-${item.system.isMastered ? 'solid illuminate' : 'light'} fa-star-shooting'></i>`);
    result = result.outerHTML;
  }

  return new Handlebars.SafeString(result);
}
