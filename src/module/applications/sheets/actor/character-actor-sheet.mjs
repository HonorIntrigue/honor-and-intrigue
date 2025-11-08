import { systemPath } from '../../../constants.mjs';
import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class CharacterActorSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      adjustAdvantage: this.#adjustAdvantage,
      adjustFortune: { handler: this.#adjustFortune, buttons: [0, 2] },
      refreshFortune: this.#onRefreshFortune,
      toggleAdvantagePanel: this.#onToggleAdvantagePanel,
    },
  };

  /**
   * Reference to the element holding the advantage panel.
   */
  #advantageEl;

  /**
   * Adjusts the character's advantage.
   */
  static async #adjustAdvantage(event, target) {
    const change = target.dataset.adjustment === 'increment' ? 1 : -1;
    this.actor.update({ system: { advantage: this.actor.system.advantage + change } });
  }

  /**
   * Adjusts the character's total fortune points.
   */
  static async #adjustFortune(event) {
    const change = event.type === 'click' ? 1 : -1;
    await this.actor.update({ 'system.fortune.value': this.actor.system.fortune.value + change });
  }

  /**
   * Refresh the character's Fortune statistic.
   */
  static async #onRefreshFortune() {
    await this.actor.update({ 'system.fortune.value': this.actor.system.fortune.base + this.actor.system.qualities.flair });
  }

  /**
   * Toggle the expanded advantage side panel.
   */
  static async #onToggleAdvantagePanel() {
    this.#advantageEl?.classList.toggle('expanded');
  }

  /** @inheritDoc */
  _onPosition(position) {
    if (this.#advantageEl) {
      this.#advantageEl.style.left = `${position.width}px`;
    }
  }

  /** @inheritDoc */
  async _renderHTML(context, options) {
    const [img, label] =
      this.actor.system.advantage === 0 ? ['advantage_defeated', 'Defeated'] :
        this.actor.system.advantage === 1 ? ['advantage_scrambling', 'Scrambling'] :
          this.actor.system.advantage === 2 ? ['advantage_retreating', 'Retreating'] :
            ['advantage_en-garde', 'EnGarde'];
    const htmlString = await foundry.applications.handlebars.renderTemplate(systemPath('templates/sheets/actor/partials/advantage-panel.hbs'), {
      advantage: this.actor.system.advantage,
      advantageLevelImg: systemPath(`assets/images/${img}.webp`),
      advantageLevelLabel: game.i18n.localize(`HONOR_INTRIGUE.Actor.Sheet.Labels.Advantage.${label}`),
      isEditable: this.isEditable,
      offset: this.element.style.width,
    });
    const tempEl = document.createElement('div');
    tempEl.innerHTML = htmlString;

    const expanded = this.#advantageEl?.classList.contains('expanded');
    this.#advantageEl = tempEl.firstElementChild;
    this.#advantageEl.classList.toggle('expanded', !!expanded);

    return await super._renderHTML(context, options);
  }

  /** @inheritDoc */
  _replaceHTML(result, content, options) {
    super._replaceHTML(result, content, options);

    const priorEl = this.element.querySelector('.advantage-panel');

    if (priorEl) {
      priorEl.replaceWith(this.#advantageEl);
    } else {
      this.element.insertAdjacentElement('beforeend', this.#advantageEl);
    }
  }
}
