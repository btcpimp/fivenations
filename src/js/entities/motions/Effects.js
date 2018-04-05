/**
 * Exposes functions that represent motion effects for entities.
 * The function needs to return a bool value. If the value is false
 * the effect will be regarded as finished and removed from the
 * effect queue supervised by the EffectManager instance
 */
import Util from '../../common/Util';

const ns = window.fivenations;

const effects = {
  /**
   * Initialise the helper variable for the movement
   * @return {boolean} always returns false
   */
  initMovement(motionManager) {
    const targetCoords = motionManager.activity.getCoords();
    const distance = Phaser.Math.distance(
      motionManager.sprite.x,
      motionManager.sprite.y,
      targetCoords.x,
      targetCoords.y,
    );

    motionManager.movement.originX = motionManager.sprite.x;
    motionManager.movement.originY = motionManager.sprite.y;
    motionManager.movement.targetX = targetCoords.x;
    motionManager.movement.targetY = targetCoords.y;
    motionManager.movement.targetInitialDistance = distance;
    motionManager.movement.targetDragTreshold = Math.min(
      motionManager.movement.maxTargetDragTreshold,
      distance / 2,
    );
    motionManager.movement.targetAngle = Math.atan2(
      motionManager.movement.targetY - motionManager.sprite.y,
      motionManager.movement.targetX - motionManager.sprite.x,
    );
    motionManager.rotation.targetAngleCode = motionManager.getAngleCodeByAngle(motionManager.movement.targetAngle);
    motionManager.rotation.angularDirection = 0; // to be determend in MotionManager

    if (motionManager.rotation.maxAngleCount === 1) {
      motionManager.movement.currentAngle = motionManager.movement.targetAngle;
    } else {
      motionManager.rotation.stepNumberToRight = Util.calculateStepTo(
        motionManager.rotation.currentAngleCode,
        motionManager.rotation.targetAngleCode,
        motionManager.rotation.maxAngleCount,
        1,
      );
      motionManager.rotation.stepNumberToLeft = Util.calculateStepTo(
        motionManager.rotation.currentAngleCode,
        motionManager.rotation.targetAngleCode,
        motionManager.rotation.maxAngleCount,
        -1,
      );
    }

    motionManager.levitation.time = 0;

    motionManager.isEntityArrivedAtDestination = false;
    motionManager.isEntityStoppedAtDestination = false;
    motionManager.isEntityHeadedToDestination = false;

    return false;
  },

  /**
   * Move the given entity object towards the x/y coordinates at a steady velocity.
   * @return {boolean} returning false when the effect is no longer must be applied on the entity
   */
  moveToTarget(motionManager) {
    motionManager.movement.acceleration = 0;
    if (
      motionManager.movement.distance >
      motionManager.movement.targetDragTreshold
    ) {
      return true;
    }
    motionManager.isEntityArrivedAtDestination = true;
    return false;
  },

  /**
   * Move the given entity towards the target coordinates with an increasing velocity
   * @return {boolean} returning false when the effect is no longer must be applied on the entity
   */
  accelerateToTarget(motionManager) {
    motionManager.movement.acceleration =
      motionManager.movement.maxAcceleration;
    return (
      motionManager.movement.distanceInverse <
        motionManager.movement.targetDragTreshold &&
      motionManager.movement.velocity < motionManager.movement.maxVelocity
    );
  },

  /**
   * Making the given entity stop with a certain amount of drag
   * @return {boolean} returning false when the effect is no longer must be applied on the entity
   */
  stopping(motionManager) {
    motionManager.movement.acceleration = -motionManager.movement
      .maxAcceleration;
    if (
      motionManager.movement.distance > 0 &&
      motionManager.movement.distanceFromOrigin <
        motionManager.movement.targetInitialDistance &&
      motionManager.movement.velocity > 0
    ) {
      motionManager.movement.stopping = true;
      return true;
    }
    if (motionManager.isEntityArrivedAtDestination) {
      motionManager.isEntityStoppedAtDestination = true;
    }
    motionManager.movement.stopping = false;
    motionManager.getEntity().dispatch('stop');
    return false;
  },

  /**
   * Reset all the helper variables influencing the given entity so that further effects
   * can be applied on the entitiy
   * @return {boolean} returning false when the effect is no longer must be applied on the entity
   */
  resetMovement(motionManager) {
    motionManager.movement.acceleration = 0;
    motionManager.movement.velocity = 0;
    motionManager.rotation.angularVelocity = 0;
    motionManager.movement.stopping = false;

    return false;
  },

  /**
   * Altering the rotation of the given entity to face towards the target coordinats
   * @return {boolean} returning false when the effect is no longer must be applied on the entity
   */
  rotateToTarget(motionManager) {
    // if the entity is already accrelerating than it doesn't have to stop for rotating
    if (motionManager.movement.velocity > 0) {
      // it also can rotate with a lot higher speed to mimic flying units in Blizzard's Starcraft
      motionManager.rotation.angularVelocity =
        motionManager.rotation.maxAngularVelocity * 1.5;
      // jumping to the next effect
      return false;
    }

    // rotating with default speed until the entity arrives at the target angle
    motionManager.rotation.angularVelocity =
      motionManager.rotation.maxAngularVelocity;
    if (
      motionManager.rotation.currentAngleCode ===
      motionManager.rotation.targetAngleCode
    ) {
      // when the rotation terminates and the entity is headed to the target
      // we have to execute an update to the collisionMap to see whether the
      // entity is now blocked or not
      const collisionMap = ns.game.map.getCollisionMap();
      const entity = motionManager.getEntity();
      collisionMap.updateObstaclesForEntity(entity);

      return false;
    }
    return true;
  },

  /**
   * Triggers any logic that needs to be executed when the movement starts
   * @param {object} motionManager
   * @return {boolean} returns false if the effect is no longer appropriate
   */
  startMovement(motionManager) {
    motionManager.getEntity().dispatch('move');
    return false;
  },

  /**
   * Trigger 'move' animation
   * @return {boolean} returning false when the effect is no longer must be applied on the entity
   */
  startMoveAnimation(motionManager) {
    motionManager.getEntity().animate('move');
    return false;
  },

  /**
   * Stops any animation applied against the entity
   * @return {boolean} returning false when the effect is no longer must be applied on the entity
   */
  stopAnimation(motionManager) {
    motionManager.getEntity().stopAnimation();
    return false;
  },

  /**
   * Introduces a constant altenation in the vertical padding of the entity's sprite
   * @return {boolean} returns true all the time
   */
  levitating(motionManager) {
    motionManager.sprite.anchor.y =
      motionManager.levitation.defaultAnchorY +
      Math.sin(motionManager.levitation.time / 50) / 100;
    motionManager.levitation.time += 1;
    return true;
  },
};

export default {
  /**
   * Returns a function that is registered as an effect
   * with the given name
   * @param  {string} name [id of the effect]
   * @return {function} function that represents the requested effect
   */
  get(name) {
    if (!name || !effects[name]) {
      throw 'No effect is registered with the given name!';
    }
    return effects[name];
  },
};
