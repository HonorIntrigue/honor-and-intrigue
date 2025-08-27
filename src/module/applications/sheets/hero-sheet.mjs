import { systemPath } from '../../constants.mjs'
import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class HeroSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      adjustAdvancementPoints: { handler: this.#adjustAdvancementPoints, buttons: [0, 2] },
      adjustFortune: { handler: this.#adjustFortune, buttons: [0, 2] },
      editImage: this.#onEditImage,
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
}
