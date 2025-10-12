import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class CharacterActorSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      adjustFortune: { handler: this.#adjustFortune, buttons: [0, 2] },
      refreshFortune: this.#onRefreshFortune,
    },
  };

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
}
