import { systemID, systemPath } from '../../constants.mjs';
import { PartyModel } from '../../data/actor/_module.mjs';
import { HonorIntrigueActor } from '../../documents/_module.mjs';

export default class HonorIntrigueActorDirectory extends foundry.applications.sidebar.tabs.ActorDirectory {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      createMember: this.#onCreateMember,
      openPartySheet: this.#onOpenPartySheet,
      togglePartyFolder: HonorIntrigueActorDirectory.#onTogglePartyFolder,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    party: { template: systemPath('templates/sidebar/party-directory-partial.hbs') },
  };

  /**
   * Creates a new member in the active party.
   */
  static async #onCreateMember(event, target) {
    const { entryId } = target.closest('[data-entry-id]').dataset;
    const party = game.actors.get(entryId);
    const actor = await HonorIntrigueActor.createDialog({}, {}, {
      position: { width: 320, left: window.innerWidth - 630, top: target.offsetTop ?? 0 },
      types: ['hero', 'retainer'],
    });

    if (actor?.type) {
      this.#expandedFolders[party.id] = true;
      await party.system.addMembers(actor);
    }
  }

  /**
   * Opens the party sheet.
   */
  static async #onOpenPartySheet(event, target) {
    const { entryId } = target.closest('[data-entry-id]').dataset;
    const party = game.actors.get(entryId);

    if (party) party.sheet.render(true);
  }

  /**
   * Toggles the expanded state of the party folder.
   */
  static async #onTogglePartyFolder(event, target) {
    const folderEl = target.closest('header');
    const entryEl = folderEl.closest('li');
    const partyId = entryEl?.dataset.entryId ?? '';

    if (entryEl && partyId) {
      this.#expandedFolders[partyId] = !entryEl.classList.contains('expanded');
      entryEl.classList.toggle('expanded', this.#expandedFolders[partyId]);
      await this.#savePartyFolderState();
    }
  }

  /**
   * Flag to indicate if the party folder is being dragged.
   */
  #draggingParty = false;

  /**
   * A collection of folder elements that are maintained here.
   * @type {Record<string, boolean>}
   */
  #expandedFolders = {};

  /** @inheritDoc */
  collapseAll() {
    super.collapseAll();

    for (const el of this.element.querySelectorAll('.folder[data-party]')) {
      el.classList.remove('expanded');
      delete this.#expandedFolders[el.dataset.entryId ?? ''];
    }
  }

  /**
   * Saves the expanded state of the party folder.
   */
  async #savePartyFolderState() {
    return game.settings.set(systemID, 'partyFolderState', this.#expandedFolders[game.actors.party?.id ?? ''] ?? true);
  }

  /** @inheritDoc */
  _getFolderContextOptions() {
    const options = super._getFolderContextOptions();

    return options.map(opt => ({
      ...opt,
      condition: (header) => {
        const li = header.closest('.directory-item');
        if (foundry.utils.hasProperty(li.dataset, 'party')) return false;
        if (opt.condition instanceof Function) return opt.condition(header);
        return opt.condition;
      },
    }));
  }

  /** @inheritDoc */
  async _handleDroppedEntry(target, data) {
    await super._handleDroppedEntry(target, data);

    const toPartyId = target?.closest('[data-party]')?.dataset.entryId;
    if (toPartyId !== data.fromParty && data.uuid) {
      const toParty = game.actors.get(toPartyId ?? '');
      const fromParty = game.actors.get(data.fromParty ?? '');
      const actor = await fromUuid(data.uuid);

      if (fromParty?.system instanceof PartyModel) await fromParty.system.removeMembers(actor);
      if (toParty?.system instanceof PartyModel) await toParty.system.addMembers(actor);
    }
  }

  /** @inheritDoc */
  _onDragHighlight(event) {
    if (event.type === 'dragenter' && this.#draggingParty) {
      return event.stopPropagation();
    }

    super._onDragHighlight(event);
  }

  /** @inheritDoc */
  _onDragStart(event) {
    if (!(event.target instanceof HTMLElement && event.dataTransfer)) {
      return super._onDragStart(event);
    }

    super._onDragStart(event);

    const fromParty = event.target.closest('[data-party]')?.dataset.entryId;

    if (fromParty) {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'));
      data.fromParty = fromParty;
      this.#draggingParty = fromUuidSync(data.uuid) instanceof PartyModel;
      event.dataTransfer.setData('text/plain', JSON.stringify(data));
    } else {
      this.#draggingParty = false;
    }
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    // Ensure the directory gets rendered with the party at the top
    if (options.parts.includes('directory')) {
      const partyPart = this.parts['party'];
      partyPart.remove();
      this.parts['directory'].prepend(partyPart);
    }

    await super._onRender(context, options);
  }

  /** @inheritDoc */
  _onSearchFilter(event, query, rgx, html) {
    super._onSearchFilter(event, query, rgx, html);

    // Reveal the party folder for actors matching a search, and ensure opened party folders remain open
    const folderLikes = this.element.querySelectorAll('.folder[data-party]');
    for (const folder of folderLikes) {
      if (query !== '' && folder.querySelectorAll('.actor').some(li => li.style.display !== 'none')) {
        folder.style.display = 'flex';
        folder.classList.add('expanded');
      } else {
        folder.classList.toggle('expanded', !!this.#expandedFolders[folder.dataset.entryId ?? '']);
      }
    }
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'party': {
        const activeParty = game.actors.party;

        if (activeParty && options.isFirstRender && game.settings.get(systemID, 'partyFolderState')) {
          this.#expandedFolders[activeParty.id] = true;
        }

        context.expandedFolders = this.#expandedFolders;
        context.party = this._preparePartyContext(activeParty);
        break;
      }
    }

    return context;
  }

  /**
   * Prepare the context for a single party entry.
   */
  _preparePartyContext(party) {
    return {
      id: party.id,
      img: party.img,
      members: party.system.members.map(id => fromUuidSync(id)),
      name: party.name,
      uuid: party.uuid,
    };
  }
}
