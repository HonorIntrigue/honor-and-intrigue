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

    schema.advancementPoints = new fields.SchemaField({
      value: new fields.NumberField({ min: 0, initial: 0, integer: true, nullable: false }),
    });

    // background
    schema.description = new fields.HTMLField({ trim: true });
    schema.origin = new fields.StringField({ trim: true });

    // backstory
    schema.friendsAndContacts = new fields.HTMLField({ trim: true });
    schema.rivalsAndEnemies = new fields.HTMLField({ trim: true });

    return schema;
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      },
      system: { lifeblood: { min: -6 } },
    });
  }
}
