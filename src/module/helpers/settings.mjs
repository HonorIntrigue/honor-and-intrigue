import { systemID } from '../constants.mjs';

const fields = foundry.data.fields;

export default class HonorIntrigueSettingsHandler {
  /**
   * All system settings.
   */
  static get systemSettings() {
    return {
      d10: {
        name: 'HONOR_INTRIGUE.Setting.AlternateRules.d10.label',
        hint: 'HONOR_INTRIGUE.Setting.AlternateRules.d10.hint',
        type: new fields.BooleanField(),
        config: true,
        default: false,
        scope: 'world',
      },
    };
  }

  /**
   * Helper function to register all system settings.
   */
  static registerSettings() {
    for (const [key, value] of Object.entries(this.systemSettings)) {
      game.settings.register(systemID, key, value);
    }
  }
}
