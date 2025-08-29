import { systemPath } from '../../constants.mjs';
import { HonorIntrigueRoll } from '../../rolls/_module.mjs';
import { FormApplicationMixin } from '../api/_module.mjs';

export default class RollDialog extends FormApplicationMixin(foundry.applications.api.ApplicationV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['roll-dialog', 'd6-dialog'],
    actions: {
      setRollMode: this.#setRollMode,
    },
    window: {
      icon: 'fa-solid fa-dice-d6',
    },
  };

  /** @inheritDoc */
  static PARTS = {
    content: {
      template: systemPath('templates/apps/roll-dialog.hbs'),
    },
    footer: {
      template: systemPath('templates/api/roll-dialog-footer.hbs'),
    },
  };

  /**
   * Sets the chosen roll mode.
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static #setRollMode(event, target) {
    this.options.context.rollMode = target.dataset.rollMode;
    this.render({ parts: ['footer'] });
  }

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    const result = super._initializeApplicationOptions(options);

    result.context ??= {};
    result.context.rollMode = game.settings.get('core', 'rollMode');
    result.context.useAlternateD10 = (result.context.formula === HonorIntrigueRoll.ROLL_FORMULA.d10);

    if (result.context.useAlternateD10) {
      result.classes.splice(result.classes.indexOf('d6-dialog'), 1, 'd10-dialog');
      result.window.icon = 'fa-solid fa-dice-d10';
    }

    result.window.title = options.context.title;

    return result;
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    return { ...this.options.context };
  }

  /** @inheritDoc **/
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if (partId === 'footer') {
      context.rollModes = CONFIG.Dice.rollModes;
    }

    return context;
  }

  /** @inheritDoc */
  _processFormData(event, form, formData) {
    formData = super._processFormData(event, form, formData);

    return {
      rollMode: this.options.context.rollMode,
    };
  }
}
