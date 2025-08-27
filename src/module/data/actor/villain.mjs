import CharacterActorModel from './characterActorModel.mjs';

export default class VillainModel extends CharacterActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'villain',
    };
  }

  /** @inheritDoc */
  prepareDerivedData() {
    this.lifeblood.max = 10 + this.qualities.might.value;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      },
    });
  }
}
