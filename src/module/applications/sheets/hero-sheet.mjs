import { systemPath } from '../../constants.mjs'
import HonorIntrigueActorSheet from './actor-sheet.mjs'

export default class HeroSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      adjustAdvancementPoints: { handler: this.#adjustAdvancementPoints, buttons: [0, 2] },
      adjustFortune: { handler: this.#adjustFortune, buttons: [0, 2] },
      editImage: this.#onEditImage,
      rollCharacteristic: this.#onRollCharacteristic,
    },
    classes: ['hero'],
  };

  /** @inheritDoc */
  static PARTS = {
    sidebar: {
      id: 'sidebar',
      template: systemPath('templates/sheets/actor/hero/sidebar.hbs'),
    },
    header: {
      id: 'header',
      template: systemPath('templates/sheets/actor/hero/header.hbs'),
    },
    content: {
      id: 'content',
      template: systemPath('templates/sheets/actor/hero/sheet.hbs'),
    },
  };

  /**
   * Adjusts the charcter's total advancement points.
   * @param event
   * @param target
   * @returns {Promise<void>}
   */
  static async #adjustAdvancementPoints(event, target) {
    let change = event.type === 'click' ? 1 : -1;
    if (event.shiftKey) change *= 5;
    this.document.update({ system: { advancementPoints: { value: this.document.system.advancementPoints.value + change } } });
  }

  /**
   * Adjusts the character's total fortune points.
   * @param event
   * @param target
   * @returns {Promise<void>}
   */
  static async #adjustFortune(event, target) {
    const change = event.type === 'click' ? 1 : -1;
    this.document.update({ system: { fortune: this.document.system.fortune + change } });
  }

  /**
   * Handler to edit the portrait image.
   * @param event
   * @param target
   */
  static async #onEditImage(event, target) {
    return new foundry.applications.apps.FilePicker({
      type: 'image',
      current: foundry.utils.getProperty(this.document, 'img'),
      callback: (path) => this.document.update({ img: path }),
    }).render(true);
  }

  /**
   * Begin rolling a characteristic such as a Quality or Combat Ability.
   * @param event
   * @param target Should have the target characteristic in its "dataset" field, such as <code>dataset.characteristic.qualities.might</code>.
   * @returns {Promise<void>}
   */
  static async #onRollCharacteristic(event, target) {
    return this.actor.rollCharacteristic(target.dataset.characteristic);
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);

    return {
      ...ctx,
      getValueField: (type, name) => this.document.system.schema.getField(`${type}.${name}.value`),
      getValueFieldValue: (type, name) => foundry.utils.getProperty(this.document.system, `${type}.${name}.value`),
    };
  }
}
