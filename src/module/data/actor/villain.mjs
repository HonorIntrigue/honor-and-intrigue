import CharacterActorModel from './characterActorModel.mjs';

export default class VillainModel extends CharacterActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'villain',
    };
  }

}
