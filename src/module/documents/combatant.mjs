export default class HonorIntrigueCombatant extends foundry.documents.Combatant {
  /** @inheritDoc */
  _getInitiativeFormula() {
    if (this.actor?.system.getInitiativeFormula instanceof Function) {
      return this.actor?.system.getInitiativeFormula();
    }

    return super._getInitiativeFormula();
  }
}
