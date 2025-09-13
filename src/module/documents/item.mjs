import BaseDocumentMixin from './base-document-mixin.mjs';

export default class HonorIntrigueItem extends BaseDocumentMixin(foundry.documents.Item) {
  /** @inheritDoc */
  static getDefaultArtwork(itemData) {
    if (CONFIG.Item.dataModels[itemData.type]?.DEFAULT_ICON) {
      return { img: CONFIG.Item.dataModels[itemData.type].DEFAULT_ICON };
    }

    return super.getDefaultArtwork(itemData);
  }

  /** @inheritDoc */
  static migrateData(data) {
    return super.migrateData(data);
  }

  /** @inheritDoc */
  getRollData() {
    const rollData = {
      ...super.getRollData(),
      flags: this.flags,
      name: this.name,
    };

    if (this.system.modifyRollData instanceof Function) {
      this.system.modifyRollData(rollData);
    }

    return rollData;
  }
}
