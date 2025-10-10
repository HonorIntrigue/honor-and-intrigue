import BaseActorModel from './base.mjs';

export default class CreatureModel extends BaseActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'creature',
    };
  }

  /** @inheritDoc */
  get isLifebloodMightDerived() {
    return false;
  }
}
