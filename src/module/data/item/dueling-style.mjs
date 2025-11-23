import BaseItemModel from './base.mjs';

export default class DuelingStyle extends BaseItemModel {
  /** @inheritDoc */
  static DEFAULT_ICON = 'icons/svg/combat.svg';
  /** @inheritDoc */
  static LOCALIZATION_PREFIXES = ['HONOR_INTRIGUE.Item.Sheet.DuelingStyle'];

  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'duelingStyle' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.active = new fields.BooleanField();
    schema.benefit = new fields.SchemaField({
      name: new fields.StringField(),
      description: new fields.HTMLField(),
    });
    schema.finalSecret = new fields.SchemaField({
      name: new fields.StringField(),
      description: new fields.HTMLField(),
    });
    schema.maneuvers = new fields.SetField(new fields.DocumentUUIDField({ type: 'Item' }));
    schema.weaponry = new fields.StringField();

    return schema;
  }

  /**
   * Gets the number of maneuvers the parent actor has mastered that match this style's maneuver set.
   */
  get mastery() {
    if (!this.parent.isEmbedded || !this.parent.actor) return 0;

    return this.parent.actor.itemTypes['maneuver']
      .filter(m => this.maneuvers.has(m.uuid) || this.maneuvers.has(m._stats.compendiumSource))
      .filter(m => m.system.isMastered)
      .length;
  }
}
