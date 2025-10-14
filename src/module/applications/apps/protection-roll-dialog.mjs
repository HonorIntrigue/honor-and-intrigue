import { systemPath } from '../../constants.mjs';
import { FormApplicationMixin } from '../api/_module.mjs';

export default class ProtectionRollDialog extends FormApplicationMixin(foundry.applications.api.ApplicationV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      setRollMode: this.#setRollMode,
    },
    classes: ['roll-dialog', 'protection-roll-dialog'],
    window: {
      icon: 'fa-solid fa-shield-halved',
      title: 'HONOR_INTRIGUE.Dialog.Roll.RollProtection',
    },
  };

  /** @inheritDoc */
  static PARTS = {
    content: { template: systemPath('templates/rolls/protection-roll-dialog.hbs') },
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

    const { itemId } = event.target.closest('.protection-option-item')?.dataset ?? 0;

    if (itemId) {
      this.options.context.protectionItems.find(({ id }) => id === itemId).toggled = event.target.checked;
    }

    this.render();
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    await super._prepareContext(options);
    const { context } = this.options;
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
