import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class RetainerSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    position: {
      height: 700,
      width: 800,
    },
  };
}
