import { systemID, systemPath } from '../../constants.mjs';
import { FormApplicationMixin } from '../api/_module.mjs';

export default class RollDialog extends FormApplicationMixin(foundry.applications.api.ApplicationV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['roll-dialog', 'd6-dialog'],
    actions: {
      decrement: this.#decrementStepper,
      increment: this.#incrementStepper,
      setRollMode: this.#setRollMode,
    },
    window: {
      icon: 'fa-solid fa-dice-d6',
    },
  };

  /** @inheritDoc */
  static PARTS = {
    content: {
      template: systemPath('templates/rolls/roll-dialog.hbs'),
    },
    footer: {
      template: systemPath('templates/rolls/roll-dialog-footer.hbs'),
    },
  };

  /**
   * Decrement a field value by a fixed step size.
   * @param event
   * @param target
   */
  static #decrementStepper(event, target) {
    const { field } = target.dataset;
    const input = target.parentNode.querySelector(`input[id=${field}]`);
    if (!(field in this.options.context.modifiers)) return;

    this.options.context.modifiers[field] = Math.clamp(this.options.context.modifiers[field] - 1, input.min || Number.NEGATIVE_INFINITY, input.max || Number.MAX_VALUE);
    this.render({ parts: ['content'] });
  }

  /**
   * Increment a field value by a fixed step size.
   * @param event
   * @param target
   */
  static #incrementStepper(event, target) {
    const { field } = target.dataset;
    const input = target.parentNode.querySelector(`input[id=${field}]`);
    if (!(field in this.options.context.modifiers)) return;

    this.options.context.modifiers[field] = Math.clamp(this.options.context.modifiers[field] + 1, input.min, input.max);
    this.render({ parts: ['content'] });
  }

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
    result.context.useAlternateD10 = game.settings.get(systemID, 'd10');

    if (result.context.useAlternateD10) {
      result.classes.splice(result.classes.indexOf('d6-dialog'), 1, 'd10-dialog');
      result.window.icon = 'fa-solid fa-dice-d10';
    }

    result.window.title = options.context.title;

    return result;
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    return {
      ...this.options.context,
      stepperFields: {
        bonuses: {
          id: 'bonuses',
          min: 0,
          max: 10,
          stepSize: 1,
          value: this.options.context.modifiers.bonuses,
        },
        penalties: {
          id: 'penalties',
          min: 0,
          max: 10,
          stepSize: 1,
          value: this.options.context.modifiers.penalties,
        },
        flat: {
          id: 'flat',
          max: 10,
          stepSize: 1,
          value: this.options.context.modifiers.flat,
        },
      },
    };
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
      ...this.options.context,
      formData,
    };
  }
}
