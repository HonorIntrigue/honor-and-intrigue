import { systemID, systemPath } from '../../constants.mjs';
import { FormApplicationMixin } from '../api/_module.mjs';

export default class DamageRollDialog extends FormApplicationMixin(foundry.applications.api.ApplicationV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      setRollMode: this.#setRollMode,
      toggleHalfMight: this.#toggleHalfMight,
    },
    classes: ['roll-dialog', 'damage-roll-dialog'],
    window: {
      icon: 'fa-solid fa-sword',
      title: 'HONOR_INTRIGUE.Dialog.Roll.RolLDamage',
    },
  };

  /** @inheritDoc */
  static PARTS = {
    content: { template: systemPath('templates/rolls/damage-roll-dialog.hbs') },
    footer: { template: systemPath('templates/rolls/roll-dialog-footer.hbs') },
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

  /**
   * Toggles the selection of half Might score.
   */
  static #toggleHalfMight(event, target) {
    this.options.context.halfMight = !this.options.context.halfMight;

    if (this.options.context.halfMight) {
      this.options.context.mightValue = Math.round(this.options.context.realMightValue / 2);
    } else {
      this.options.context.mightValue = this.options.context.realMightValue;
    }

    this.render({ parts: ['content'] });
  }

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    const result = super._initializeApplicationOptions(options);

    result.context ??= {};
    result.context.rollMode = game.settings.get('core', 'rollMode');

    return result;
  }

  /** @inheritDoc */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    const formData = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.element).object);
    foundry.utils.mergeObject(this.options.context, formData);

    this.render();
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    await super._prepareContext(options);
    const { context } = this.options;

    context.numDice = context.numDice || context.formula.numDice;
    context.dieSize = context.dieSize || context.formula.dieSize;
    context.dieSizeChoices = hi.CONFIG.damageDice;
    context.flatModifier = context.flatModifier || context.formula.flatModifier;
    context.mightValue = context.mightValue || context.realMightValue;

    return context;
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
