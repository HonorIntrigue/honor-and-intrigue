import BaseActorModel from './base.mjs';

const fields = foundry.data.fields;

export default class PawnModel extends BaseActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'pawn',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    Object.values(schema.qualities.fields).forEach(quality => quality.max = 2);
    Object.values(schema.combatAbilities.fields).forEach(ability => ability.max = 2);

    schema.competence = new fields.NumberField({ initial: 0, integer: true, nullable: false });

    return schema;
  }

  /** @inheritDoc */
  get isLifebloodMightDerived() {
    return false;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({ system: { lifeblood: { min: 0 } } });
    return true;
  }
}
