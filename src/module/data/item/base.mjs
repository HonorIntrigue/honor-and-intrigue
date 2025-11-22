import HonorIntrigueSystemModel from '../system-model.mjs';

export default class BaseItemModel extends HonorIntrigueSystemModel {
  /**
   * The default icon for newly created model documents.
   */
  static DEFAULT_ICON = 'icons/svg/item-bag.svg';

  /** @inheritDoc */
  static LOCALIZATION_PREFIXES = ['HONOR_INTRIGUE.Item.Sheet'];

  /** @inheritDoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      description: new fields.HTMLField({ textSearch: true, trim: true }),
    };
  }

  /**
   * Generates an embeddable element for this item.
   */
  async toEmbed() {
    const embed = document.createElement('div');
    embed.classList.add('honor-intrigue', this.parent.type);
    embed.innerHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.description, {
      relativeTo: this.parent,
      secrets: this.parent.isOwner,
    });

    return embed;
  }
}
