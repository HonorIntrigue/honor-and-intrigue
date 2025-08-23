import HonorIntrigueSystemModel from '../system-model.mjs';

const fields = foundry.data.fields;

export default class BaseActorModel extends HonorIntrigueSystemModel {
  /** @inheritDoc **/
  static defineSchema() {
    const schema = {};

    const quality = { min: -1, max: 6, initial: 0, integer: true, nullable: false };
    schema.qualities = new fields.SchemaField(
      Object.entries(hi.CONFIG.qualities).reduce((obj, [q, { label }]) => {
        obj[q] = new fields.SchemaField({
          value: new fields.NumberField({ ...quality, label }),
        });

        return obj;
      }, {}),
    );

    const combatAbility = { min: -1, max: 5, initial: 0, integer: true, nullable: false };
    schema.combatAbilities = new fields.SchemaField(
      Object.entries(hi.CONFIG.combatAbilities).reduce((obj, [ca, { label }]) => {
        obj[ca] = new fields.SchemaField({
          value: new fields.NumberField({ ...combatAbility, label }),
        });

        return obj;
      }, {}),
    );

    schema.lifeblood = new fields.NumberField({ min: -6, initial: 1, integer: true, nullable: false });
    schema.name = new fields.StringField({ trim: true });
    schema.notes = new fields.HTMLField({ textSearch: true, trim: true });

    return schema;
  }
}
