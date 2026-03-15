import HonorIntrigueActor from '../../../documents/actor.mjs';
import HonorIntrigueSystemModel from '../../system-model.mjs';

export default class PartyModel extends HonorIntrigueSystemModel {
  /** @inheritDoc */
  static get metadata() {
    return { ...super.metadata, type: 'party' };
  }

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      members: new fields.SetField(new fields.DocumentUUIDField({ required: true, type: 'Actor' })),
    };
  }

  /**
   * Add a set of actors to the party.
   * @param {BaseActorModel[]} membersToAdd
   */
  async addMembers(...membersToAdd) {
    const newMembers = membersToAdd.filter(a => a.type === 'hero' && !this.members.has(a.uuid));

    await Promise.all([
      ...newMembers.map(async (m) => {
        m.system.party = this;
        return m.update({ folder: null });
      }),
      this.parent.update({ system: { members: [...this.members, ...newMembers.map(m => m.uuid)] } }),
    ]);
    ui.actors.render();
  }

  /** @inheritDoc */
  canUserModify(user, action) {
    return (super.canUserModify(user, action) || (action === 'update' && this.members.some(m => m.canUserModify(user, action))));
  }

  /** @inheritDoc */
  prepareBaseData() {
    super.prepareBaseData();

    for (const memberUuid of this.members.values()) {
      const member = fromUuidSync(memberUuid);
      if (member && member.system) member.system.party ??= this;
    }
  }

  /**
   * Remove a set of actors from the party.
   * @param {BaseActorModel[]} membersToRemove
   */
  async removeMembers(...membersToRemove) {
    await this.parent.update({ system: { members: [...this.members.filter(id => !membersToRemove.some(m => m.uuid === id))] } });
    ui.actors.render();
  }

  /** @inheritDoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    for (const memberId of this.members) {
      const member = fromUuidSync(memberId);
      if (member && member.system.party === this) member.system.party = null;
    }
  }

  /** @inheritDoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (userId === game.user.id && game.user.isGM) {
      const removedMembers = (options.removedMembers ?? []).map(id => fromUuidSync(id)).filter(a => a instanceof HonorIntrigueActor);
      for (const actor of removedMembers) {
        actor.system.party = null;
      }
    }
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    data.folder = null;
    this.parent.updateSource({
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      },
    });
    return true;
  }

  /** @inheritDoc */
  async _preUpdate(changed, options, user) {
    changed.folder = null;

    const newMemberIds = changed.system?.members;
    if (newMemberIds) {
      options.removedMembers = Array.from(this.members.filter(id => !newMemberIds.includes(id)));
    }

    return super._preUpdate(changed, options, user);
  }
}
