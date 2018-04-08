/* global window */
import Event from './Event';

const ns = window.fivenations;

function EntityCreate(...args) {
  Event.apply(this, args);
}

EntityCreate.prototype = Object.create(Event.prototype);
EntityCreate.prototype.constructor = EntityCreate;

/**
 * No-op function to be overwritten in the child objects
 * @param {object} [options] [extendable object that presents event details]
 * @return {void}
 */
EntityCreate.prototype.execute = (options) => {
  if (!options.data) {
    return;
  }
  const config = options.data;
  // creates and augments the EntityManager with a new entity that
  // is generated based on the given configuration object
  ns.game.entityManager.add(config);
};

export default EntityCreate;
