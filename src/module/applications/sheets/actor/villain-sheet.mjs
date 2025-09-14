import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class VillainSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['villain'],
  };
}
