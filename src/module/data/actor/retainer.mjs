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
  prepareDerivedData() {
    this.lifeblood.max = 8 + this.qualities.might.value;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      prototypeToken: {
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      },
    });
  }
}
