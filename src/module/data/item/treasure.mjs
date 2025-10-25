import EquipmentModel from './equipment.mjs';

export default class TreasureModel extends EquipmentModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/chest.svg';

  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'treasure' };
  }
}
