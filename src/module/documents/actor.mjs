export default class HonorIntrigueActor extends foundry.documents.Actor {
  /** @inheritDoc */
  static async createDialog(data = {}, createOptions = {}, dialogOptions = {}) {
    return super.createDialog(data, createOptions, {
      types: [
        'hero',
        'pawn',
        'retainer',
        'villain',
        'creature',
        'ship',
      ],
      ...dialogOptions,
    });
  }

  /** @inheritDoc */
  static migrateData(data) {
    return super.migrateData(data);
  }

  /**
   * Get an active GM or a player who can update this actor.
   */
  get legalUpdater() {
    const { activeGM } = game.users;
    if (activeGM) return activeGM;

    const activeUsers = game.users.filter(u => u.active);
    const playerOwner = activeUsers.find(u => u.character?.id === this.id);
    if (playerOwner) return playerOwner;

    const firstUpdater = game.users
      .filter(u => this.canUserModify(u, 'update'))
      .sort((a, b) => a.id > b.id ? 1 : -1)
      .shift();
    return firstUpdater ?? null;
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

  /** @inheritDoc */
  _onEmbeddedDocumentChange() {
    super._onEmbeddedDocumentChange();

    this.system.party?.parent.sheet?.render();
  }
}
