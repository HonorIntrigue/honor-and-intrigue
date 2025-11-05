import { systemID } from '../constants.mjs';

export default class HonorIntrigueActors extends foundry.documents.collections.Actors {
  /**
   * Get a reference to the active world party, if one exists.
   */
  get party() {
    const partyId = game.settings.get(systemID, 'worldPartyId');
    const actor = this.get(partyId);

    return actor?.type === 'party' ? actor : this.find(a => a.type === 'party');
  }

  /** @inheritDoc */
  _getVisibleTreeContents() {
    return super._getVisibleTreeContents().filter(a => a.type !== 'party' && !a.system.party);
  }

  /** @inheritDoc */
  _initialize() {
    super._initialize();

    const parties = [];
    for (const actor of this.values()) {
      if (actor.type === 'party') parties.push(actor);
    }

    // Reinitialize parties *after* all other actors.
    for (const actor of parties) {
      this.delete(actor.id);
      this.set(actor.id, actor);
    }
  }
}
