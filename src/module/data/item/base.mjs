import { HonorIntrigueSystemModel } from '../_module.mjs';

const fields = foundry.data.fields;

export default class BaseItemModel extends HonorIntrigueSystemModel {
  static LOCALIZATION_PREFIXES = ['HONOR_INTRIGUE.Item.Sheet'];

  /** @inheritDoc */
  static defineSchema() {
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
