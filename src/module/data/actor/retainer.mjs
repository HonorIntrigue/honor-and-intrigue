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
  get baseLifeblood() {
    return 8;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({ system: { lifeblood: { min: 0 } } });
    return true;
  }
}
