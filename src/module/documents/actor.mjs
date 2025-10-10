export default class HonorIntrigueActor extends foundry.documents.Actor {
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

  /**
   * Rolls a characteristic for this actor.
   * @param {String} characteristic
   * @param {Object} [options] Options passed through to the roll.
   */
  async rollCharacteristic(characteristic, options) {
    return this.system.rollCharacteristic(characteristic, options);
  }

  /** @inheritDoc */
  async toggleStatusEffect(statusId, { active, overlay = false } = {}) {
    if (statusId === 'dead' || statusId === 'defeated') {
      overlay = true;
    }

    super.toggleStatusEffect(statusId, { active, overlay });
  }
}
