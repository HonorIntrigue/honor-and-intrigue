import BaseItemModel from './base.mjs';

export default class BoonModel extends BaseItemModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/aura.svg';

  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'boon' };
  }
}
