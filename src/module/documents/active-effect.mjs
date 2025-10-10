export default class HonorIntrigueActiveEffect extends foundry.documents.ActiveEffect {
  /**
   * Apply modifiers to a roll using the system document.
   */
  applyRollModifiers(options) {
    if (this.system.applyRollModifiers instanceof Function) return this.system.applyRollModifiers(options);
  }
}
