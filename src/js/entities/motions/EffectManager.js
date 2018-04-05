function EffectManager(motionManager) {
  this.motionManager = motionManager;
  this.effects = [];
}

EffectManager.prototype = {
  /**
   * Immediately exectutes the given effect
   * @param {function} effect to get executed immediately
   * @return {void}
   */
  execute(effect) {
    effect.call(null, this.motionManager);
  },

  /**
   * Invoking the currently selected effect from the effect queue at every tick
   * @return {[void]}
   */
  updateEffects() {
    // invoking the first effect as long as it returns true
    // then remove it
    while (this.effects[0]) {
      if (!this.effects[0].call(null, this.motionManager)) {
        this.effects.splice(0, 1);
      } else {
        return false;
      }
    }
  },

  /**
   * Pushing a new effect to the effect queue
   * @param {[function]} effect [function that will be triggered at every tick when selected]
   */
  addEffect(effect) {
    this.effects.push(effect);
  },

  /**
   * Unshifring a new effect to the top of the effect queue as the next effect to be execited
   * @param {[function]} effect [function that will be triggered at every tick when selected]
   */
  addEffectToTop(effect) {
    this.effects.unshift(effect);
  },

  /**
   * Reseting the effect queue by removing all the effects from the queue
   * @return {[void]}
   */
  resetEffects() {
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      this.effects[i] = null;
      this.effects.splice(i, 1);
    }
  },

  /**
   * Removing the given function from the effect queue
   * @param  {[function]} effect []
   * @return {[void]}}
   */
  removeEffect(effect) {
    for (let i = this.effects.length - 1; i >= 0; i -= 1) {
      if (effect === this.effects[i]) {
        this.effects.splice(i, 1);
      }
    }
  },
};

export default EffectManager;
