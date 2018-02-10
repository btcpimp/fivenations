/* global window, Phaser */
import { GUI_POPUP } from '../common/Const';
import Button from './Button';
import CloseButton from './CloseButton';

const ns = window.fivenations;

/**
 * Realises a basic Popup that inherits from Phaser.Group
 */
class Popup extends Phaser.Group {
  /**
   * @param {object} config - Configuration object
   */
  constructor(config) {
    super(ns.game.game);

    this.config = config || {};

    this.initBasicComponents(config);
    this.initConfirmButton(config);
    this.initCloseButton(config);
    this.setCoordinates(config);

    if (this.config.pauseGame) {
      ns.game.paused = true;
    }
  }

  /**
   * Instantiate the components
   * @param {object} config - configuration object to specify the button
   */
  initBasicComponents(config) {
    const { game } = ns.game;
    const {
      offsetX, offsetY, spritesheet, frame, frameName, text,
    } = config;

    this.background = game.add.sprite(
      offsetX || 0,
      offsetY || 0,
      spritesheet || GUI_POPUP.spritesheet,
    );
    this.background.frame = frame || GUI_POPUP.frames.background;
    if (frameName) {
      this.background.frameName = frameName;
    }
    this.background.anchor.set(0.5);

    this.add(this.background);

    if (text) {
      this.text = game.add.text(0, 0, text, {
        ...GUI_POPUP.style,
        wordWrapWidth: this.background.width - GUI_POPUP.padding,
      });
      this.text.anchor.set(0.5);
      this.add(this.text);
    }
  }

  /**
   * Generates the Confirm button according to the given
   * configuration object
   * @param {object} config - Configuration object
   */
  initConfirmButton(config) {
    const {
      buttonLabel, onClick, buttonOffsetX, buttonOffsetY,
    } = config;
    this.button = new Button({
      buttonLabel,
      onClick,
    });
    this.button.x = buttonOffsetX || 0;
    this.button.y =
      this.background.height / 2 -
      this.button.height / 2 -
      GUI_POPUP.padding +
      (buttonOffsetY || 0);

    this.add(this.button);
  }

  /**
   * Generates the Confirm button according to the given
   * configuration object
   * @param {object} config - Configuration object
   */
  initCloseButton(config) {
    const onClose = () => {
      if (typeof config.onClose === 'function') {
        onClose.call(this);
      }
      this.hide();
    };

    this.closeButton = new CloseButton({
      onClick: onClose,
    });
    this.closeButton.x =
      this.background.width / 2 -
      this.closeButton.width / 2 -
      GUI_POPUP.padding;
    this.closeButton.y =
      this.background.height / -2 +
      this.closeButton.height / 2 +
      GUI_POPUP.padding;

    this.add(this.closeButton);
  }

  setCoordinates({ x, y }) {
    const cX = x || ns.window.width / 2;
    const cY = y || ns.window.height / 2;
    this.x = cX;
    this.y = cY;
    this.fixedToCamera = true;
    this.cameraOffset.setTo(cX, cY);
  }

  /**
   * Updates the button instance according to the passed configuration object
   * @param {object config - specify the updates
   */
  update(config) {
    if (!config) return;
    if (config.text) this.text = config.text;
  }

  /**
   * Makes the popup visible
   */
  show() {
    this.visible = true;
    if (this.config.pauseGame) {
      ns.game.paused = true;
    }
  }

  /**
   * Makes the popup hide
   */
  hide() {
    this.visible = false;
    if (this.config.pauseGame) {
      ns.game.paused = false;
    }
  }
}

export default Popup;
