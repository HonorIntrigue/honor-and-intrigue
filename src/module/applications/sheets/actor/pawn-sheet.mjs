import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class PawnSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    position: {
      height: 600,
      width: 650,
    },
  };
}
