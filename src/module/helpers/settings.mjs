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
        scope: 'world',
        config: true,
        default: false,
      },
      // background settings
      worldPartyId: {
        name: 'World Party ID',
        type: String,
        scope: 'world',
        config: false,
        default: '',
        onChange: async () => ui.actors.render({ parts: ['party'] }),
      },
      createdParty: {
        name: 'Created Default World Party',
        type: Boolean,
        scope: 'world',
        config: false,
        default: false,
      },
      partyFolderState: {
        name: 'Party Folder Expanded',
        type: Boolean,
        scope: 'client',
        config: false,
        default: true,
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
