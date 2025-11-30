import { systemPath } from '../../../../constants.mjs';
import { ItemCRUDMixin } from '../../../api/_module.mjs';
import HonorIntrigueActorSheet from '../actor-sheet.mjs';

export default class ShipSheet extends ItemCRUDMixin(HonorIntrigueActorSheet) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    actions: {
      deleteCrewDuty: this.#onDeleteCrewDuty,
      openCrewDuty: this.#onOpenCrewDuty,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    sidebar: {
      template: systemPath('templates/sheets/actor/ship/sidebar.hbs'),
      scrollable: ['.characteristics-grid-container'],
    },
    header: { template: systemPath('templates/sheets/actor/ship/header.hbs') },
    content: { template: 'templates/generic/tab-navigation.hbs' },
    management: { template: systemPath('templates/sheets/actor/ship/tabs/management.hbs') },
    hold: { template: systemPath('templates/sheets/actor/ship/tabs/hold.hbs') },
  };

  /** @inheritDoc */
  static TABS = {
    primary: {
      initial: 'management',
      labelPrefix: 'HONOR_INTRIGUE.Actor.Sheet.Labels.Ship.Tabs',
      tabs: [{ id: 'management' }, { id: 'hold' }],
    },
  };

  /**
   * Deletes a crew duty assignment.
   */
  static async #onDeleteCrewDuty(event, target) {
    const { duty } = target.closest('[data-duty]').dataset;
    await this.actor.update({
      system: {
        duties: {
          [duty]: null,
        },
      },
    });
  }

  /**
   * Opens the item assigned to a crew duty.
   */
  static async #onOpenCrewDuty(event, target) {
    const { duty } = target.closest('[data-duty]').dataset;
    const actor = await fromUuid(this.actor.system.duties[duty]);

    return actor?.sheet?.render(true);
  }

  /**
   * Highlights crew duty entries as drop targets.
   * @param {DragEvent} event
   */
  _onDragHighlight(event) {
    event.stopPropagation();

    if (event.type === 'dragenter') {
      this.element.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    } else if (event.type === 'dragleave') {
      const el = document.elementFromPoint(event.clientX, event.clientY);
      const parent = el.closest('.crew-duties-list-item');
      if (parent === event.currentTarget) return;
    }

    event.currentTarget.classList.toggle('drop-target', event.type === 'dragenter');
  }

  /** @inheritDoc */
  async _onDrop(event) {
    this.element.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    return super._onDrop(event);
  }

  /** @inheritDoc */
  async _onDropActor(event, actor) {
    await super._onDropActor(event, actor);

    const acceptsType = !['party', 'ship'].includes(actor.type);
    if (!acceptsType) return;

    const duty = event.toElement?.closest('[data-duty]')?.dataset.duty;
    if (!duty) return;

    return this.actor.update({
      system: {
        duties: {
          [duty]: actor.uuid,
        },
      },
    });
  }

  /** @inheritDoc */
  async _onDropItem(event, item) {
    if (!['boon', 'flaw'].includes(item.type)) return false;
    return super._onDropItem(event, item);
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'hold': {
        const [armor, equipment, treasure, weapon] = await Promise.all([
          this._prepareEmbeddedItemContext('armor'),
          this._prepareEmbeddedItemContext('equipment'),
          this._prepareEmbeddedItemContext('treasure'),
          this._prepareEmbeddedItemContext('weapon'),
        ]);

        context.inventory = { armor, equipment, treasure, weapon };
        break;
      }
      case 'management': {
        const [boons, flaws, duties] = await Promise.all([
          this._prepareEmbeddedItemContext('boon'),
          this._prepareEmbeddedItemContext('flaw'),
          Promise.all(
            Object.entries(hi.CONFIG.shipDuties)
              .reduce((acc, [key, { label, sort }]) => [
                ...acc,
                { key, label: game.i18n.localize(label), sort, value: this.actor.system.duties[key] },
              ], [])
              .sort((a, b) => a.sort - b.sort)
              .map(async (v) => ({ ...v, value: await fromUuid(v.value) })),
          ),
        ]);

        context.boons = boons.sort((a, b) => a.item.name.localeCompare(b.item.name, game.i18n.lang));
        context.flaws = flaws.sort((a, b) => a.item.name.localeCompare(b.item.name, game.i18n.lang));
        context.duties = duties;
        context.notes = {
          enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.document.system.notes, {
            rollData: this.document.getRollData(),
            secrets: this.document.isOwner,
          }),
          field: context.systemFields.notes,
          value: this.document.system.notes,
        };
        break;
      }
    }

    return context;
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.element.querySelectorAll('.crew-duties .crew-duties-list-item').forEach(el => {
      el.addEventListener('dragenter', this._onDragHighlight.bind(this));
      el.addEventListener('dragleave', this._onDragHighlight.bind(this));
    });
  }
}
