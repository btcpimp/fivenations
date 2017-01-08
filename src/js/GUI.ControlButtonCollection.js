// ------------------------------------------------------------------------------------
// Stop Button Logc
// ------------------------------------------------------------------------------------
define('GUI.StopButtonLogic', ['Universal.EventEmitter'], function(EventEmitter) {
    return {
        activate: function() {
            EventEmitter
                .getInstance()
                .synced
                .entities(':user:selected')
                .reset()
                .stop();
        }
    };
});

// ------------------------------------------------------------------------------------
// Move Button Logc
// ------------------------------------------------------------------------------------
define('GUI.MoveButtonLogic', [
    'GUI.Activity.SelectCoords',
    'GUI.ActivityManager',
    'Universal.EventEmitter',
], function(ActivitySelectCoords, ActivityManager, EventEmitter) {
    var ns = window.fivenations;
    return {
        activate: function(entityManager, controlPanel) {
            var activity = ActivityManager.getInstance().start(ActivitySelectCoords);
            activity.on('select', function(mousePointer) {

                var coords = mousePointer.getRealCoords();

                EventEmitter
                    .getInstance()
                    .synced
                    .entities(':user:selected')
                    .move({
                        x: coords.x,
                        y: coords.y
                    });

                ns.game.GUI.putClickAnim(coords.x, coords.y);
                controlPanel.selectMainPage();
            });
            // @TODO this should be unified as most of the buttons share this logic
            controlPanel.selectCancelPage();
        }
    };
});

// ------------------------------------------------------------------------------------
// Patrol Button Logic
// ------------------------------------------------------------------------------------
define('GUI.PatrolButtonLogic', [
    'GUI.Activity.SelectCoords',
    'GUI.ActivityManager',
    'Universal.EventEmitter',
], function(ActivitySelectCoords, ActivityManager,EventEmitter) {
    var ns = window.fivenations;
    return {
        activate: function(entityManager, controlPanel) {
            var activity = ActivityManager.getInstance().start(ActivitySelectCoords);
            activity.on('select', function(mousePointer) {
                var coords = mousePointer.getRealCoords();

                EventEmitter
                    .getInstance()
                    .synced
                    .entities(':user:selected')
                    .patrol({
                        x: coords.x,
                        y: coords.y
                    });

                ns.game.GUI.putClickAnim(coords.x, coords.y);
                controlPanel.selectMainPage();
            });
            // @TODO this should be unified as most of the buttons share this logic
            controlPanel.selectCancelPage();
        }
    };
});

// ------------------------------------------------------------------------------------
// Cancel Button Logc
// ------------------------------------------------------------------------------------
define('GUI.CancelButtonLogic', [
    'GUI.ActivityManager'
], function(ActivityManager) {
    return {
        activate: function(entityManager, controlPanel) {
            controlPanel.selectMainPage();
            ActivityManager.getInstance().cancel();
        }
    };
});

define('GUI.ControlButtonCollection', [
    'GUI.StopButtonLogic',
    'GUI.MoveButtonLogic',
    'GUI.PatrolButtonLogic',
    'GUI.CancelButtonLogic',
    'json!abilities'
], function(StopButtonLogic, MoveButtonLogic, PatrolButtonLogic, CancelButtonLogic, abilitiesJSON) {

    var buttonLogics = {};

    buttonLogics[abilitiesJSON.stop] = StopButtonLogic;
    buttonLogics[abilitiesJSON.move] = MoveButtonLogic;
    buttonLogics[abilitiesJSON.patrol] = PatrolButtonLogic;
    buttonLogics[abilitiesJSON.cancel] = CancelButtonLogic;

    return {

        getLogicByControlButton: function(controlButton) {
            if (!controlButton) {
                return;
            }
            return this.getLogicById(controlButton.getId());
        },

        getLogicById: function(id) {
            if (!buttonLogics[id]) {
                throw 'There is no ButtonLogic registered to the given Id';
            }
            return buttonLogics[id];
        }

    }

});