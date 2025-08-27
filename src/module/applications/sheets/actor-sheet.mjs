import { DocumentSheetMixin } from '../api/_module.mjs';

export default class HonorIntrigueActorSheet extends DocumentSheetMixin(foundry.applications.sheets.ActorSheetV2) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['actor'],
    position: {
      width: 900,
      height: 800,
    },
  };
}
