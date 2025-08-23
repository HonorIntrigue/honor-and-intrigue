import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class HeroSheet extends HonorIntrigueActorSheet {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['hero'],
  };
}
