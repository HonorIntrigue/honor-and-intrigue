import { HonorIntrigueSystemModel } from '../_module.mjs';

export default class BaseEffectModel extends HonorIntrigueSystemModel {
  /** @inheritDoc */
  static get metadata() {
    return { type: 'base' };
  }

  /** @inheritDoc */
  static defineSchema() {
    return {};
  }

  /**
   * Attaches status effect modifiers to a roll object.
   * @param {Object} modifiers The roll options object to modify.
   */
  applyRollModifiers(modifiers) {
    if (this.parent.statuses.has('at-a-loss')) {
      modifiers['at-a-loss'] = { label: 'HONOR_INTRIGUE.EFFECT.Status.AtALoss', value: -2 };
    }
  }
}
