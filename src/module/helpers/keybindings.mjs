import { systemID } from '../constants.mjs';

export default class HonorIntrigueKeybindings {
  /**
   * All system keybindings.
   */
  static get keybindings() {
    return {
      openPartySheet: {
        name: 'HONOR_INTRIGUE.KEYBINDING.OpenPartySheet',
        editable: [{ key: 'KeyP' }],
        onUp: async () => {
          const party = game.actors.party;
          if (!party) return false;

          const { sheet } = party;
          if (sheet.rendered) {
            if (sheet.minimized) {
              sheet.maximize();
            } else {
              sheet.close();
            }
          } else {
            sheet.render(true);
          }
        },
      },
    };
  }

  /**
   * Helper function to register keybindings.
   */
  static registerKeybindings() {
    for (const [key, value] of Object.entries(this.keybindings)) {
      game.keybindings.register(systemID, key, value);
    }
  }
}
