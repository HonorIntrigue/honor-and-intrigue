/**
 * Initialize Handlebars extensions and helpers.
 */
export function initialize() {
  Handlebars.registerHelper({
    getItemControls,
    spread,
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

/**
 * Spread an object into attributes, similar to a splat syntax.
 * @param {Object} options An object of key/value pairs, likely created from the Foundry {@link handlebars.object} helper.
 */
export function spread(options) {
  if (!options) return '';

  const entries = Object.entries(options).reduce((acc, [k, v]) => [...acc, `${k}="${v}"`], []);

  return new Handlebars.SafeString(entries.join(' '));
}
