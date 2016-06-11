/**
 * Created by igor on 11.06.16.
 */

define(function (require) {
    var WebitelEvent = require('plugins/webitel/lib/event');

    var WebitelHashCollection = function() {
        var collection = {};

        var length = 0;

        var onAddedElement = new WebitelEvent();
        var onRemovedElement = new WebitelEvent();

        var addElement = function(key, element) {
            collection[key] = element;
            length++;
            onAddedElement.trigger(collection[key]);
            return collection[key];
        };

        var getLength = function() {
            return length;
        };

        var getElement = function(key) {
            return collection[key]
        };

        var removeElement = function(key) {
            if (collection[key]) {
                var removedElement = collection[key];
                delete collection[key];
                length--;
                onRemovedElement.trigger(removedElement.getJSONObject ? removedElement.getJSONObject() : removedElement);
            };
        };

        var removeAllElement = function() {
            for (var key in collection) {
                removeElement(key);
            }
        };

        var setNewKey = function(key, newKey) {
            if (collection[key]) {
                throw new Error('Key ' + key + ' not found!');
            } else {
                var element = collection[key];
                collection[newKey] = element;
                collection[key] = undefined;
                delete collection[key];
            };
        };

        return {
            add: addElement,
            get: getElement,
            remove: removeElement,
            removeAll: removeAllElement,
            setNewKey: setNewKey,
            onAdded: onAddedElement,
            onRemoved: onRemovedElement,
            length: getLength,
            collection: collection
        };
    };

    return WebitelHashCollection;
});