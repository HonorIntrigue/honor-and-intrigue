import CharacterActorModel from './characterActorModel.mjs';

const fields = foundry.data.fields;

export default class HeroModel extends CharacterActorModel {
  /** @inheritDoc */
  static get metadata() {
    return {
      ...super.metadata,
      type: 'hero',
    };
  }

  /** @inheritDoc */
  static defineSchema() {
    const schema = super.defineSchema();

    schema.advancementPoints = new fields.NumberField({ min: 0, initial: 0, integer: true, nullable: false });

    // background
    schema.description = new fields.HTMLField({ trim: true });
    schema.motivation = new fields.HTMLField({ trim: true });
    schema.origin = new fields.HTMLField({ trim: true });

    // backstory
    schema.friendsAndContacts = new fields.HTMLField({ trim: true });
    schema.rivalsAndEnemies = new fields.HTMLField({ trim: true });

    return schema;
  }
}
