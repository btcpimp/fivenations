import StopButtonLogic from './StopButton';
import MoveButtonLogic from './MoveButton';
import PatrolButtonLogic from './PatrolButton';
import CancelButtonLogic from './CancelButton';
import AttackButtonLogic from './AttackButton';
import MineButtonLogic from './MineButton';
import FollowButtonLogic from './FollowButton';
import DockButtonLogic from './DockButton';
import UndockButtonLogic from './UndockButton';

const abilitiesJSON = require('../../assets/datas/common/abilities.json');

const buttonLogics = {};

buttonLogics[abilitiesJSON.stop] = StopButtonLogic;
buttonLogics[abilitiesJSON.move] = MoveButtonLogic;
buttonLogics[abilitiesJSON.patrol] = PatrolButtonLogic;
buttonLogics[abilitiesJSON.cancel] = CancelButtonLogic;
buttonLogics[abilitiesJSON.attack] = AttackButtonLogic;
buttonLogics[abilitiesJSON.mining] = MineButtonLogic;
buttonLogics[abilitiesJSON.follow] = FollowButtonLogic;
buttonLogics[abilitiesJSON.dock] = DockButtonLogic;
buttonLogics[abilitiesJSON.undock] = UndockButtonLogic;

export default {
  getLogicByControlButton(controlButton) {
    if (!controlButton) {
      throw new Error('invalid ControlButton!');
    }
    return this.getLogicById(controlButton.getId());
  },

  getLogicById(id) {
    if (!buttonLogics[id]) {
      throw new Error('There is no ButtonLogic registered to the given Id');
    }
    return buttonLogics[id];
  },

  getTranslationKeyById(id) {
    const prefix = 'abilities.';
    const keys = Object.keys(abilitiesJSON);
    for (let i = 0, l = keys.length; i < l; i += 1) {
      if (abilitiesJSON[keys[i]] === id) {
        return `${prefix}${keys[i]}`;
      }
    }
    return '';
  },
};
