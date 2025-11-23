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
  const result = document.createElement('template');

  switch (item.type) {
    case 'action': {
      if (item.system.requiresCheck || item.system.requiresOpposedCheck) {
        result.innerHTML += `
          <a data-action='rollItem' data-tooltip='${game.i18n.format('HONOR_INTRIGUE.Actor.Sheet.Tooltips.ActionAbilityTooltip', { ability: item.system.abilityTooltip })}'>
            <i class='fa-solid fa-dice-d20'></i>
          </a>
        `;
      }

      if (item.system.dealsDamage) {
        result.innerHTML += `
          <a data-action='rollItemDamage' data-tooltip='${game.i18n.format('HONOR_INTRIGUE.Actor.Sheet.Tooltips.ActionAbilityTooltip', { ability: item.system.damageTooltip })}'>
            <i class='fa-solid fa-bomb'></i>
          </a>
        `;
      }

      break;
    }
    case 'armor':
    case 'weapon': {
      result.innerHTML += `
        <a data-action='toggleItemEquipped' data-tooltip='${item.system.carriedPositionLabel}'>
          <i class='${item.system.carriedPositionIcon}'></i>
        </a>
      `;
      break;
    }
    case 'career': {
      if (item.system.isArcane) {
        result.innerHTML += `
          <a data-tooltip='HONOR_INTRIGUE.Actor.Sheet.Labels.Careers.FIELDS.isArcane.hint'>
            <i class='fa-solid illuminate fa-hat-wizard'></i>
          </a>
        `;
      }
      break;
    }
    case 'duelingStyle': {
      result.innerHTML += `
        <div class='dueling-style-mastery' data-tooltip='${game.i18n.format('HONOR_INTRIGUE.Actor.Sheet.Labels.Character.DuelingStyleProgress', {
          max: item.system.maneuvers.size,
          value: item.system.mastery,
        })}'>
          <span class='dueling-style-mastery-background'></span>
          <span class='dueling-style-mastery-foreground' style='width: ${Math.round((item.system.mastery / item.system.maneuvers.size) * 100)}%'></span>
        </div>
        <a data-action='toggleActiveStyle' data-tooltip='HONOR_INTRIGUE.Item.Sheet.DuelingStyle.FIELDS.active.hint'>
          <i class='fa-${item.system.active ? 'solid illuminate' : 'light'} fa-circle-check'></i>
        </a>
      `;

      break;
    }
    case 'maneuver': {
      if (item.system.mastery) {
        result.innerHTML += `
          <a data-action='toggleManeuverMastery' data-tooltip='HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.ToggleMastery'>
            <i class='fa-${item.system.isMastered ? 'solid illuminate' : 'light'} fa-star-shooting'></i>
          </a>
        `;
      }
      break;
    }
  }

  return new Handlebars.SafeString(result.innerHTML.trim());
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
