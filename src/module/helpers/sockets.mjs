import { systemID } from '../constants.mjs';
import { ManeuverMessageModel } from '../data/message/_module.mjs';

export default class HonorIntrigueSocketHandler {
  constructor() {
    this.identifier = `system.${systemID}`;
    this.registerSocketListeners();
  }

  /**
   * Performs the action if the condition is met, but if it is not, emits on the game socket to defer to another user.
   * @param {Function} action A parameter-less arrow function to invoke if the condition is met.
   * @param {Boolean} condition A condition that qualifies if the action should be executed.
   * @param {Object} emission A socket data object to emit if the condition is not met.
   */
  async doIfOrEmit(action, condition, emission) {
    if (condition) {
      return action();
    } else {
      return this.emit(emission);
    }
  }

  /**
   * Emits a socket message preconfigured with the system identifier.
   * @param {Object} data Data object to emit on the socket channel.
   * @param {String} data.type Unique type string for this action.
   */
  emit(data) {
    return game.socket.emit(this.identifier, data);
  }

  /**
   * Registers the socket listener for taking actions.
   */
  registerSocketListeners() {
    game.socket.on(this.identifier, async (data) => {
      if (data.gmOnly && !game.user.isGM) return;

      switch (data.type) {
        case 'MESSAGE_ACTION_DODGE': {
          const message = game.messages.get(data.message?.id ?? '');

          if (message && message.system instanceof ManeuverMessageModel) {
            await message.system.onActionDodge();
          }

          break;
        }
        case 'MESSAGE_ACTION_FORTUNE': {
          const message = game.messages.get(data.message?.id ?? '');

          if (message && message.system instanceof ManeuverMessageModel) {
            await message.system.onActionFortuneDeferred(data.data.amount);
          }

          break;
        }
        case 'MESSAGE_ACTION_YIELD': {
          const message = game.messages.get(data.message?.id ?? '');

          if (message && message.system instanceof ManeuverMessageModel) {
            await message.system.onActionYield();
          }

          break;
        }
        case 'MESSAGE_REFRESH': {
          const message = game.messages.get(data.message?.id ?? '');

          if (message) {
            await message.update({ '_stats.modifiedTime': Date.now() });
          }

          break;
        }
      }
    });
    console.log(systemID, 'Registered for socket messages using identifier', this.identifier);
  }
}
