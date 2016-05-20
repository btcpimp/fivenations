define('Universal.EventFactory', [
    'Universal.Event.Entity.Move',
    'Universal.Event.Entity.Patrol',
    'Universal.Event.Entity.Stop'
], function(EntityMove, EntityPatrol, EntityStop){

    'use strict';

    var singleton,
        createEventFactory = function(){

            var events = {
                'entity/move': new EntityMove(),
                'entity/patrol': new EntityPatrol(),
                'entity/stop': new EntityStop()
            };

            return {

                getEventObjectById: function(id){
                    if (!id){
                        throw 'ID has not been passed to fetch the Event!';
                    }
                    if (!events[id]){
                        throw 'There is no event registered to the given ID!';
                    }
                    return events[id];
                }

            }

        };

    return {

        getInstance: function(){
            if (!singleton){
                singleton = createEventFactory();
            }
            return singleton;

        }

    }


});