/* global window, localStorage */
/* eslint no-underscore-dangle: 0 */
import Graphics from '../common/Graphics';
import Entity from './Entity';
import DataObject from '../model/DataObject';
import EnergyShield from './misc/EnergyShield';
import JetEngine from './misc/JetEngine';
import QuadTree from '../common/QuadTree';
import EventEmitter from '../sync/EventEmitter';
import Util from '../common/Util';
import {
  GROUP_EFFECTS,
  GROUP_ENTITIES,
  GROUP_ENTITIES_BUILDINGS,
} from '../common/Const';

const ns = window.fivenations;

let phaserGame;
let singleton;

const entities = [];

/**
 * Creates a function that can be used to filter entities
 * @param {array} entities Array of entities the can be filtered further
 * @return {function}
 */
function createSelector(targetEntities) {
  const playerRegExp = /:player\(([1-9+])\)/;
  /**
   * returns array of entities with the exposing the activity API against them
   * @param {mixed}
   * @return {array} [Array of entities]
   */
  return function $(filter) {
    let targets;

    if (typeof filter === 'function') {
      targets = targetEntities.filter(filter);
    } else if (typeof filter === 'string') {
      if (filter === ':selected') {
        targets = targetEntities.filter(entity => entity.isSelected());
      } else if (filter === ':not(hibernated)') {
        targets = targetEntities.filter(entity => !entity.isHibernated());
      } else if (filter === ':user') {
        targets = targetEntities.filter(entity =>
          entity.isEntityControlledByUser());
      } else if (filter === ':user:selected') {
        targets = targetEntities.filter((entity) => {
          if (!entity.isEntityControlledByUser()) return false;
          if (!entity.isSelected()) return false;
          if (entity.hasNoUserControl()) return false;
          return true;
        });
      } else if (filter === ':user:selected:not(building)') {
        targets = targetEntities.filter((entity) => {
          if (!entity.isEntityControlledByUser()) return false;
          if (!entity.isSelected()) return false;
          if (entity.hasNoUserControl()) return false;
          if (entity.getDataObject().isBuilding()) return false;
          return true;
        });
      } else if (playerRegExp.test(filter)) {
        const playerId = parseInt(filter.match(playerRegExp)[1], 10);
        targets = targetEntities.filter((entity) => {
          if (entity.getDataObject().getTeam() !== playerId) return false;
          return true;
        });
      } else {
        targets = targetEntities.filter(entity => entity.getGUID() === filter);
        return targets[0];
      }
    } else if (typeof filter === 'object') {
      targets = filter;
    } else {
      targets = targetEntities;
    }

    return [].concat.call(targets);
  };
}

function EntityManager() {
  if (!phaserGame) {
    throw new Error('Invoke setGame first to pass the Phaser Game entity!');
  }

  this.entityGroup = Graphics.getInstance().getGroup(GROUP_ENTITIES);
  this.entityBuildingGroup = Graphics.getInstance().getGroup(GROUP_ENTITIES_BUILDINGS);
  this.effectGroup = Graphics.getInstance().getGroup(GROUP_EFFECTS);

  this.updateEntityDistancesOptimised = Util.interval(
    this.updateEntityDistances,
    100,
    this,
  );
}

EntityManager.prototype = {
  /**
   * Adds an entity object to the private collection
   * @param {object} config configuration object
   */
  add(config) {
    if (!config) {
      throw new Error('Invalid configuration object passed as a parameter!');
    }

    if (Object.keys(ns.entities).indexOf(config.id) === -1) {
      throw new Error('The requrested entity is not registered!');
    }

    let dataSource;

    const team = config.team || 1;

    // instanciating a Phaser.Game.Sprite objet for the entity
    const sprite = phaserGame.add.sprite(0, 0, config.id);

    // fetching the DataObject instance from the preloaded JSON file
    if (window.editor && localStorage && localStorage.getItem(config.id)) {
      dataSource = JSON.parse(localStorage.getItem(config.id));
    } else {
      dataSource = phaserGame.cache.getJSON(config.id);
    }

    const dataObject = new DataObject(dataSource);

    // passing the team Id from the config param object
    dataObject.setTeam(team);

    // adding the freshly created entity to the main array
    const entity = new Entity({
      guid: config.guid,
      entityManager: this,
      sprite,
      dataObject,
      createdAt: config.createdAt,
      homeStation: config.homeStation,
      noUserControl: config.noUserControl,
    });

    // setting the coordinates if not ommitted
    if (config.x || config.y) {
      sprite.x = config.x || 0;
      sprite.y = config.y || 0;
    }

    entities.push(entity);

    this.notifyListenersThatEntityCountHasChanged();
  },

  /**
   * Removes entity from the private collection
   * @param {object} entity Entity instance
   */
  remove(entity) {
    for (let i = entities.length - 1; i >= 0; i -= 1) {
      if (entity === entities[i]) {
        entities.splice(i, 1);
      }
    }
    if (entity.getNumberOfDockedEntities() > 0) {
      entity.getDockedEntities().forEach((dockedEntity) => {
        this.remove(dockedEntity);
      });
    }
    entity.remove();
    // eslint-disable-next-line no-param-reassign
    entity = null;
    // when an entity is removed we've got to refresh the quad tree
    this.updateEntityDistances();
    this.notifyListenersThatEntityCountHasChanged();
  },

  /**
   * Alters entity attributes and executes update functions according to
   * the elapsed time
   * @param {boolean} authoritative determines whether the player is authorised
   * to issue changes that might alter the gameplay
   * @return {void}
   */
  update(authoritative) {
    this.updateLogic(authoritative);
  },

  /**
   * Updates all entity related game logic
   * @param {boolean} authoritative determines whether the player is authorised
   * to issue changes that might alter the gameplay
   * @return {void}
   */
  updateLogic(authoritative) {
    this.updateEntityDistancesOptimised();
    this.updateEntities(authoritative);
  },

  /**
   * destroys all the existing entities
   * @return {void}
   */
  reset() {
    while (entities.length) {
      const entity = entities.pop();
      entity.delete();
    }
  },

  /**
   * Unselect all entities expect the passed if it is not omitted
   * It can directly employ the private collection of entities since
   * it triggers only client related action
   * @param {object} [entity] [Entity instance that will be excluded from the selection]
   * @return {void}
   */
  unselectAll(excludedEntity) {
    entities.forEach((entity) => {
      if (excludedEntity !== entity && entity.isSelected()) {
        entity.unselect();
      }
    });
  },

  /**
   * Exposes EventAPI to all the active entities
   * @type {object}
   * @see EventAPI
   */
  entities: createSelector(entities),

  /**
   * Initialises a QuadTree to filter candidates for InRange typed functions
   * @param  {object} map Map instance
   * @return {void}
   */
  createQuadTree(map) {
    if (!map) throw new Error('Invalid Map instance has been passed!');

    this.quadTree = new QuadTree({
      x: 0,
      y: 0,
      width: map.getScreenWidth(),
      height: map.getScreenHeight(),
    });
  },

  /**
   * Updates the closest sibling of all the entities. With this information
   * we can easily and efficiently check whether there is an entity in range.
   * @return {void}
   */
  updateEntityDistances() {
    this.updateQuadTree();
    for (let i = entities.length - 1; i >= 0; i -= 1) {
      this.setClosestEntities(entities[i]);
    }
  },

  /**
   * Updates QuadTree according to the current state of the entity array
   * @return {void}
   */
  updateQuadTree() {
    this.quadTree.clear();
    for (let i = entities.length - 1; i >= 0; i -= 1) {
      this.quadTree.insert(entities[i].getSprite());
    }
  },

  /**
   * Emits a local event as the user needs to update all the relevant
   * components that shows the entity count
   */
  notifyListenersThatEntityCountHasChanged() {
    const emitter = EventEmitter.getInstance();
    emitter.local.dispatch('entity/number/change');
    // to alter resource display
    emitter.local.dispatch('user/resource/alter');
    // to alter control panel (to potentially disable production buttons)
    emitter.local.dispatch('gui/controlpage/update');
  },

  /**
   * Sets the closest entities to the given entity
   * @param {object} entity Entity instance
   * @return {void}
   */
  setClosestEntities(entity) {
    if (!entity) throw new Error('Invalid Entity instance is passed!');

    const closests = this.getEntitiesInApproximity(entity);
    let closestAttackableEntity = null;
    let closestEnemyInRange = null;
    const closestAllies = [];

    for (let i = closests.length - 1; i >= 0; i -= 1) {
      const { candidate, inRange, inVision } = closests[i];

      if (!candidate.isHibernated()) {
        if (entity.isEnemy(candidate)) {
          // check if the encountered enemy entity can be targeted
          if (candidate.isTargetableByEntity(entity)) {
            // closest enemy in range
            if (!closestEnemyInRange && inRange) {
              closestEnemyInRange = candidate;
            }
            // closest attackable enemy (for scanning)
            if (!closestAttackableEntity && (inVision || inRange)) {
              closestAttackableEntity = candidate;
            }
          }
        } else if (entity.getPlayer() === candidate.getPlayer()) {
          // we collect the non-hostile entities
          closestAllies.push(candidate);
        }
      }
    }

    entity.setClosestAttackableHostileEntity(closestAttackableEntity);
    entity.setClosestHostileEntityInRange(closestEnemyInRange);
    entity.setClosestAllyEntitiesInRange(closestAllies);
  },

  /**
   * Links the given entity to a new EnergyShield instance
   * @param {object} entity Instance of Eneity
   */
  addEnergyShield(entity) {
    const energyShield = new EnergyShield(phaserGame);
    energyShield.appendTo(entity);
    return energyShield;
  },

  /**
   * Links the given entity to a new JetEngine instance
   * @param {object} entity Instance of Eneity
   */
  addJetEngine(entity) {
    const jetEngine = new JetEngine(phaserGame);
    jetEngine.appendTo(entity);
    return jetEngine;
  },

  /**
   * Returns an array of candidates that are in range to the given entity
   * @param {object} entity [description]
   * @return {object} array of {inVision, inRange, candidate, distance}
   */
  getEntitiesInApproximity(entity) {
    const maxRange = entity.getWeaponManager().getMaxRange();
    const visionRange = entity.getDataObject().getVisionRange() * 1.25;
    const maxDistance = Math.max(maxRange, visionRange);
    const sprite = entity.getSprite();
    const candidates = this.quadTree.retrieve(sprite);
    return candidates
      .map(candidate => ({
        distance: Util.distanceBetweenSprites(sprite, candidate),
        candidate,
      }))
      .filter((data) => {
        if (data.candidate === sprite) return false;
        if (data.candidate._parent.isHibernated()) return false;
        return data.distance <= maxDistance;
      })
      .sort((a, b) => a.distance < b.distance)
      .map(data => ({
        inVision: data.distance <= visionRange,
        inRange: data.distance <= maxRange,
        candidate: data.candidate._parent,
        distance: data.distance,
      }));
  },

  /**
   * Updates each entities
   * @param {boolean} authoritative determines wether the player is authorised
   * to generate effects that migh alter the gameplay
   * @return {void}
   */
  updateEntities(authoritative) {
    for (let i = entities.length - 1; i >= 0; i -= 1) {
      entities[i].update(authoritative);
    }
  },

  /**
   * returns the subsection of the attributes of the given entities
   * @param  {array} targetEntities - Array of the given entities
   * @return {object} consolidated object of attributes
   */
  getMergedAbilities(targetEntities) {
    const subsection = ability => val =>
      ability
        .getAbilityManager()
        .getAbilities()
        .indexOf(val) !== -1;

    let abilities;
    let next;

    if (!targetEntities || !targetEntities.length) {
      return [];
    }

    const clones = targetEntities.slice(0);
    abilities = clones
      .shift()
      .getAbilityManager()
      .getAbilities();

    // eslint-disable-next-line no-cond-assign
    while ((next = clones.shift())) {
      abilities = abilities.filter(subsection(next));
    }

    return abilities.slice(0);
  },

  /**
   * returns the Phaser.Game object for inconvinience
   * @return {object} Phaser.Game instance
   */
  getGame() {
    return phaserGame;
  },

  /**
   * Creates a selector function with the given entities.
   * This selector function can be used to filter down entities through a specified API.
   * @param {object} targetEntities - array of entity instances
   * @return {function}
   */
  getSelector(targetEntities) {
    return createSelector(targetEntities);
  },

  /**
   * Returns the first entity that is hovered by the UserPointer
   * @return {object} Entity instance
   */
  getHoveredEntity() {
    // checks whether the user hovers an entity
    const candidates = this.entities(':not(hibernated)');
    for (let i = candidates.length - 1; i >= 0; i -= 1) {
      if (candidates[i].isHover()) {
        return candidates[i];
      }
    }
    return null;
  },
};

export default {
  /**
   * sets the global Phaser.Game instance
   * @param {void}
   */
  setGame(game) {
    phaserGame = game;
  },

  /**
   * returns singleton instance of the manager object
   * @param {boolean} forceNewInstance
   * @return {object} Singleton instance of EntityManager
   */
  getInstance(forceNewInstance) {
    if (!phaserGame) {
      throw new Error('Invoke setGame first to pass the Phaser Game entity!');
    }
    if (!singleton || forceNewInstance) {
      singleton = new EntityManager();
      singleton.reset();
    }
    return singleton;
  },
};
