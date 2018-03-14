import EasyStar from 'easystarjs';
import Util from '../common/Util';

const ns = window.fivenations;

// aggregation of tile ids that are considered as no-wall
const ACCEPTABLE_TILES = [0];

/**
 * Wraps a matrix that contains infomations about which map tile
 * is occupied by a given entity and exposes API calls to fetch
 * these datas in certain ways
 */
class CollisionMap {
  /**
   * Generates the collision matrix
   * @param {object} map - Map instance to initialise collision tiles
   */
  constructor(map) {
    this.initMatrix(map);
    this.initEventDispatcher();
    this.initEasyStar();
  }

  /**
   * Creates a matrix that holds data about which tile is occupied by
   * an entity
   * @param {object} map - Map instance to initialise collision tiles
   */
  initMatrix(map) {
    this.tiles = Util.matrix(map.getWidth(), map.getHeight());
    this.map = map;
  }

  /**
   * Creates a local event dispatcher
   */
  initEventDispatcher() {
    this.dispatcher = new Util.EventDispatcher();
  }

  /**
   * Initialises an EasyStar pathfinding instance
   */
  initEasyStar() {
    // eslint-disable-next-line new-cap
    this.easyStar = new EasyStar.js();
    // avoids easyStar to hold up the main thread by limiting the number of
    // calculations per iteration
    this.easyStar.setIterationsPerCalculation(1000);
    this.easyStar.setGrid(this.tiles);
    this.easyStar.setAcceptableTiles(ACCEPTABLE_TILES);
    // refresh the grid when the collision map changes
    this.on('change', tiles => this.easyStar.setGrid(tiles));
  }

  /**
   * Sets the specified tile according to the given coordinates as
   * occupied by an entity
   * @param {number} x - horizontal offset
   * @param {number} y - vertical offset
   * @return {object} this
   */
  visit(x, y) {
    if (x >= 0 && y >= 0 && y < this.tiles.length && x < this.tiles[0].length) {
      this.tiles[y][x] = 1;
    }
    return this;
  }

  /**
   * Sets the specified tile according to the given coordinates as
   * empty
   * @param {number} x - horizontal offset
   * @param {number} y - vertical offset
   * @return {object} this
   */
  unvisit(x, y) {
    if (x >= 0 && y >= 0 && y < this.tiles.length && x < this.tiles[0].length) {
      this.tiles[y][x] = 0;
    }
    return this;
  }

  /**
   * Sets the tile identified by the given entity location as
   * occupied
   * @param {object} entity - Entity instance
   */
  visitTilesByEntity(entity) {
    // it's important to execute getPreviousTile first
    const previousTile = entity.getPreviousTile(this.map);
    const tile = entity.getTile(this.map);

    if (!previousTile) {
      this.visit(tile[0], tile[1]);
      return;
    }

    const sameCoords = previousTile.every((v, idx) => tile[idx] === v);
    if (!sameCoords) {
      this.unvisit(previousTile[0], previousTile[1]);
      this.visit(tile[0], tile[1]);
      this.setDirtyFlag(true);
    }
  }

  /**
   * Loops through all active entities and sets the occupiation of
   * the collision map accordingly
   * @param {object} EntityManager - instance of EntityManager
   */
  update(entityManager) {
    this.setDirtyFlag(false);

    entityManager
      .entities(':not(hibernated)')
      .forEach(entity => this.visitTilesByEntity(entity));

    // if the map has been altered since the last check
    // we execute all the registered listeners
    if (this.isDirty()) {
      this.dispatcher.dispatch('change', this.tiles);
    }
  }

  /**
   * Sets whether the map has changed since the last check
   * @param {boolean}
   */
  setDirtyFlag(flag) {
    this.dirty = flag;
  }

  /**
   * Registers external listeners against local events
   * @param {string} event
   * @param {function} listener
   */
  on(event, listener) {
    this.dispatcher.addEventListener(event, listener);
  }

  /**
   * Displays the occupied tiles on the screen for debugging purposes
   */
  debug() {
    const phaserGame = ns.game.game;
    for (let i = this.tiles.length - 1; i >= 0; i--) {
      for (let j = this.tiles[i].length - 1; j >= 0; j--) {
        if (this.tiles[i][j]) {
          const width = 40;
          const height = 40;
          const x = j * width;
          const y = i * height;
          const rect = new Phaser.Rectangle(x, y, width, height);
          phaserGame.debug.geom(rect, '#fa0000', false);
        }
      }
    }
  }

  /**
   * Returns the whole collision map for external consuming code
   * @return {object} matrix of tiles
   */
  getMatrix() {
    return this.tiles;
  }

  /**
   * Returns a chunk of the complete matrix according to the given parameter object
   * @param {object} chunk - chunk.x, chunk.y, chunk.width, chunk.height
   * @return {array} two dimensional array of the requested chunk
   */
  getMatrixChunk(chunk) {
    return this.tiles
      .map(rows =>
        rows.filter((column, idx) => idx >= chunk.x && idx < chunk.x + chunk.width))
      .filter((rows, idx) => idx >= chunk.y && idx < chunk.y + chunk.height);
  }

  /**
   * Returns the map instance
   * @return {object}
   */
  getMap() {
    return this.map;
  }

  /**
   * Returns true if any of the tiles has been changed since the
   * last check
   * @return {boolean}
   */
  isDirty() {
    return this.dirty;
  }

  /**
   * Fetches a tile identified by the given coordinats and
   * returns whether it is occupied or not
   * @param {number} x - horizontal offset
   * @param {number} y - vertical offset
   * @return {boolean} true if the tile is occupied
   */
  isOccupied(x, y) {
    if (x >= 0 && y >= 0 && y < this.tiles.length && x < this.tiles[0].length) {
      return this.tiles[y][x];
    }
    return false;
  }
}

export default CollisionMap;
