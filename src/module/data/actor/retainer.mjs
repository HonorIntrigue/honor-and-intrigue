import BaseActorModel from './base.mjs';

export default class RetainerModel extends BaseActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'retainer',
    };
  }

  /** @inheritDoc */
  calcLifebloodMax() {
    return 8 + this.qualities.might.value;
  }
}
