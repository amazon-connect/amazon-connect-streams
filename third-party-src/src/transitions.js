/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

   /**-------------------------------------------------------------------------
    * GraphLink <<abstract class>>
    *
    * Represents the association of one or more attributes to a state transition.
    */
   var GraphLink = function(fromState, toState) {
      connect.assertNotNull(fromState, 'fromState');
      connect.assertNotNull(toState, 'toState');
      this.fromState = fromState;
      this.toState = toState;
   };

   GraphLink.prototype.getAssociations = function(context) {
      throw connect.NotImplementedError();
   };

   GraphLink.prototype.getFromState = function() {
      return this.fromState;
   };

   GraphLink.prototype.getToState = function() {
      return this.toState;
   };

   /**-------------------------------------------------------------------------
    * DirectGraphLink <<concrete class>> extends GraphLink
    *
    * Represents the by-value representation of one or more attributes to a
    * state transition.
    */
   var DirectGraphLink = function(fromState, toState, associations) {
      connect.assertNotNull(fromState, 'fromState');
      connect.assertNotNull(toState, 'toState');
      connect.assertNotNull(associations, 'associations');
      GraphLink.call(this, fromState, toState);
      this.associations = associations;
   };
   DirectGraphLink.prototype = Object.create(GraphLink.prototype);
   DirectGraphLink.prototype.constructor = DirectGraphLink;

   DirectGraphLink.prototype.getAssociations = function(context) {
      return this.associations;
   };

   /**
    * FunctionalGraphLink <<concrete class>> extends GraphLink
    *
    * Represents a functional association of one or more attributes to a
    * state transition.
    */
   var FunctionalGraphLink = function(fromState, toState, closure) {
      connect.assertNotNull(fromState, 'fromState');
      connect.assertNotNull(toState, 'toState');
      connect.assertNotNull(closure, 'closure');
      connect.assertTrue(connect.isFunction(closure), 'closure must be a function');
      GraphLink.call(this, fromState, toState);
      this.closure = closure;
   };
   FunctionalGraphLink.prototype = Object.create(GraphLink.prototype);
   FunctionalGraphLink.prototype.constructor = FunctionalGraphLink;

   FunctionalGraphLink.prototype.getAssociations = function(context) {
      return this.closure(context, this.getFromState(), this.getToState());
   };

   /**-------------------------------------------------------------------------
    * EventGraph <<class>>
    *
    * Builds a map of associations from one state to another in context of a
    * particular object.  The associations can be direct (one or more values)
    * or functional (a method returning one or more values), and are used to
    * provide additional contextual event hooks for the UI to consume.
    */
   var EventGraph = function() {
      this.fromMap = {};
   };
   EventGraph.ANY = "<<any>>";

   EventGraph.prototype.assoc = function(fromStateObj, toStateObj, assocObj) {
      var self = this;

      if (! fromStateObj) {
         throw new Error("fromStateObj is not defined.");
      }

      if (! toStateObj) {
         throw new Error("toStateObj is not defined.");
      }

      if (! assocObj) {
         throw new Error("assocObj is not defined.");
      }

      if (fromStateObj instanceof Array) {
         fromStateObj.forEach(function(fromState) {
            self.assoc(fromState, toStateObj, assocObj);
         });
      } else if (toStateObj instanceof Array) {
         toStateObj.forEach(function(toState) {
            self.assoc(fromStateObj, toState, assocObj);
         });
      } else {
         if (typeof assocObj === "function") {
            this._addAssociation(new FunctionalGraphLink(fromStateObj, toStateObj, assocObj));
         } else if (assocObj instanceof Array) {
            this._addAssociation(new DirectGraphLink(fromStateObj, toStateObj, assocObj));
         } else {
            this._addAssociation(new DirectGraphLink(fromStateObj, toStateObj, [assocObj]));
         }
      }
      return this;
   };

   EventGraph.prototype.getAssociations = function(context, fromState, toState) {
      connect.assertNotNull(fromState, 'fromState');
      connect.assertNotNull(toState, 'toState');
      var associations = [];

      var toMapFromAny = this.fromMap[EventGraph.ANY] || {};
      var toMap = this.fromMap[fromState] || {};

      associations = associations.concat(this._getAssociationsFromMap(
               toMapFromAny, context, fromState, toState));
      associations = associations.concat(this._getAssociationsFromMap(
               toMap, context, fromState, toState));

      return associations;
   };

   EventGraph.prototype._addAssociation = function(assoc) {
      var toMap = this.fromMap[assoc.getFromState()];

      if (! toMap) {
         toMap = this.fromMap[assoc.getFromState()] = {};
      }

      var assocList = toMap[assoc.getToState()];

      if (! assocList) {
         assocList = toMap[assoc.getToState()] = [];
      }

      assocList.push(assoc);
   };

   EventGraph.prototype._getAssociationsFromMap = function(map, context, fromState, toState) {
      var assocList = (map[EventGraph.ANY] || []).concat(map[toState] || []);
      return assocList.reduce(function(prev, assoc) {
         return prev.concat(assoc.getAssociations(context));
      }, []);
   };

   connect.EventGraph = EventGraph;

})();
