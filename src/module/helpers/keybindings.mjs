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
        onUp: async () => game.actors.party?.sheet?.render(true),
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
