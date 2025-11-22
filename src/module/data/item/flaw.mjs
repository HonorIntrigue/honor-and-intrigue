import BaseItemModel from './base.mjs';

export default class FlawModel extends BaseItemModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/stoned.svg';

  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'flaw' };
  }
}
