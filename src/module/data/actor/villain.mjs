import CharacterActorModel from './characterActorModel.mjs';

const fields = foundry.data.fields;

export default class VillainModel extends CharacterActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'villain',
    };
  }

  /** @inheritDoc */
  calcLifebloodMax() {
    return 10 + this.qualities.might.value;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({ prototypeToken: { actorLink: true } });
  }
}
