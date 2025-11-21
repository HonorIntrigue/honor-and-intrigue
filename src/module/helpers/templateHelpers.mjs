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
  const result = document.createElement('div');
  let child;

  switch (item.type) {
    case 'action': {
      if (item.system.requiresCheck || item.system.requiresOpposedCheck) {
        child = document.createElement('a');
        child.dataset.action = 'rollItem';
        child.dataset.tooltip = game.i18n.format('HONOR_INTRIGUE.Actor.Sheet.Tooltips.ActionAbilityTooltip', { ability: item.system.abilityTooltip });
        child.insertAdjacentHTML('beforeend', '<i class="fa-solid fa-dice-d20"></i>');
        result.appendChild(child);
      }

      if (item.system.dealsDamage) {
        child = document.createElement('a');
        child.dataset.action = 'rollItemDamage';
        child.dataset.tooltip = game.i18n.format('HONOR_INTRIGUE.Actor.Sheet.Tooltips.ActionAbilityTooltip', { ability: item.system.damageTooltip });
        child.insertAdjacentHTML('beforeend', '<i class="fa-solid fa-bomb"></i>');
        result.appendChild(child);
      }

      break;
    }
    case 'armor':
    case 'weapon': {
      child = document.createElement('a');
      child.dataset.action = 'toggleItemEquipped';
      child.dataset.tooltip = item.system.carriedPositionLabel;
      child.insertAdjacentHTML('beforeend', `<i class='${item.system.carriedPositionIcon}'></i>`);
      result.appendChild(child);
      break;
    }
    case 'career': {
      if (item.system.isArcane) {
        child = document.createElement('a');
        child.dataset.tooltip = game.i18n.localize('HONOR_INTRIGUE.Actor.Sheet.Labels.Careers.FIELDS.isArcane.hint');
        child.insertAdjacentHTML('beforeend', '<i class="fa-solid illuminate fa-hat-wizard"></i>');
        result.appendChild(child);
      }
      break;
    }
    case 'maneuver': {
      if (item.system.mastery) {
        child = document.createElement('a');
        child.dataset.action = 'toggleManeuverMastery';
        child.dataset.tooltip = game.i18n.localize('HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.ToggleMastery');
        child.insertAdjacentHTML('beforeend', `<i class='fa-${item.system.isMastered ? 'solid illuminate' : 'light'} fa-star-shooting'></i>`);
        result.appendChild(child);
      }
      break;
    }
  }

  // if (result) result = result.outerHTML;
  return new Handlebars.SafeString(result.innerHTML);
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
