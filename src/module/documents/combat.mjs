export default class HonorIntrigueCombat extends foundry.documents.Combat {
  /** @inheritDoc */
  async startCombat() {
    for (const combatant of this.combatants) {
      combatant.actor?.system.startCombat(combatant);
    }

    return super.startCombat();
  }
}
