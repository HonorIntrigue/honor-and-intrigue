import { ManeuverSupportMixin } from '../../api/_module.mjs';
import HonorIntrigueActorSheet from './actor-sheet.mjs';

export default class PawnSheet extends ManeuverSupportMixin(HonorIntrigueActorSheet) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    position: {
      height: 600,
      width: 650,
    },
  };
}
