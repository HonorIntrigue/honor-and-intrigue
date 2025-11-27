export default base => {
  /**
   * Adds actions for populating and resetting maneuvers to a sheet.
   */
  return class ManeuverSupportMixin extends base {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
      actions: {
        populateManeuvers: this.#onPopulateManeuvers,
        resetManeuvers: this.#onResetManeuvers,
        toggleManeuverMastery: this.#toggleManeuverMastery,
      },
      window: {
        controls: [
          {
            action: 'resetManeuvers',
            icon: 'fa-solid fa-broom-wide',
            label: 'HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.Reset',
            ownership: 'OWNER',
          },
        ],
      },
    };

    /**
     * Populate this actor with default maneuvers from the system compendium.
     */
    static async #onPopulateManeuvers() {
      const pack = game.packs.get(`${hi.CONST.systemID}.maneuvers`);

      if (!pack || pack.index.size === 0) {
        ui.notifications.warn('Unable to load the system pack of maneuvers. Please check your compendium collection.');
        return;
      }

      const docs = await pack.getDocuments();
      const objs = docs.map(cd => game.items.fromCompendium(cd));

      await Item.implementation.createDocuments(objs, { parent: this.actor });
      return this.render({ parts: ['maneuvers'] });
    }

    /**
     * Handle header control to reset the maneuvers content.
     */
    static async #onResetManeuvers() {
      const maneuvers = this.actor.itemTypes.maneuver;

      if (maneuvers.length > 0) {
        const confirm = await foundry.applications.api.DialogV2.confirm({
          window: { title: game.i18n.localize('HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.Reset') },
          content: game.i18n.localize('HONOR_INTRIGUE.Actor.Sheet.Labels.Maneuvers.ResetWarning'),
        });

        if (confirm) {
          await Item.deleteDocuments(maneuvers.map(m => m.id), { parent: this.actor });
        }
      }
    }

    /**
     * Toggle the mastery status of a maneuver.
     */
    static async #toggleManeuverMastery(event, target) {
      const { itemId } = target.closest('.item').dataset;
      const item = this.actor.items.get(itemId);

      await item.update({ system: { isMastered: !item.system.isMastered } });
    }
  };
};
