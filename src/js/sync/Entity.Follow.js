/* global window */
import Event from './Event';

const ns = window.fivenations;

function EntityFollow(...args) {
  Event.apply(this, args);
}

EntityFollow.prototype = Object.create(Event.prototype);
EntityFollow.prototype.constructor = EntityFollow;

/**
 * No-op function to be overwritten in the child objects
 * @param {object} [options] [extendable object that presents event details]
 * @return {void}
 */
EntityFollow.prototype.execute = (options) => {
  if (!options.targets || !options.data) {
    return;
  }
  options.targets.forEach((id) => {
    const targetEntity = ns.game.entityManager.entities(options.data.targetEntity);
    const entity = ns.game.entityManager.entities(id);
    if (options.resetActivityQueue) {
      entity.reset();
    }
    entity.follow(targetEntity);
  });
};

export default EntityFollow;
