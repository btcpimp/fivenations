define('GUI.ActivityManager', function() {

    var singleton;

    function createActivityManager() {

        var selectedActivity;

        return {

            start: function(activity) {
                // cancel the current event
                this.cancel();
                this.setActivity(activity);
                return selectedActivity;
            },

            cancel: function() {
                if (this.hasActiveSelection()) {
                    selectedActivity.deactivate();
                    selectedActivity = null;
                }
            },

            setActivity: function(ActivityClass) {
                selectedActivity = new ActivityClass(this);
                selectedActivity.activate();
                return selectedActivity;
            },

            hasActiveSelection: function() {
                return selectedActivity;
            },

            getSelectedActivity: function() {
                return selectedActivity;
            }

        };

    }

    return {

        getInstance: function() {
            if (!singleton) {
                singleton = createActivityManager();
            }
            return singleton;
        }

    };

});