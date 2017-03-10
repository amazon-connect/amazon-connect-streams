(function() {

   var global = this;
   lily = global.lily || {};
   global.lily = lily;

   var ONE_DAY_MILLIS = 24*60*60*1000;

   /**
    * Unpollute sprintf functions from the global namespace.
    */
   lily.sprintf = global.sprintf;
   lily.vsprintf = global.vsprintf;
   delete global.sprintf;
   delete global.vsprintf;

   /**
    * Binds the given instance object as the context for
    * the method provided.
    *
    * @param scope The instance object to be set as the scope
    *    of the function.
    * @param method The method to be encapsulated.
    *
    * All other arguments, if any, are bound to the method
    * invocation inside the closure.
    *
    * @return A closure encapsulating the invocation of the
    *    method provided in context of the given instance.
    */
   lily.hitch = function() {
      var args = Array.prototype.slice.call(arguments);
      var scope = args.shift();
      var method = args.shift();

      lily.assertNotNull(scope, 'scope');
      lily.assertNotNull(method, 'method');
      lily.assertTrue(lily.isFunction(method), 'method must be a function');

      return function() {
         var closureArgs = Array.prototype.slice.call(arguments);
         return method.apply(scope, args.concat(closureArgs));
      };
   };

   /**
    * Determine if the given value is a callable function type.
    * Borrowed from Underscore.js.
    */
   lily.isFunction = function(obj) {
      return !!(obj && obj.constructor && obj.call && obj.apply);
   };

   /**
    * Get a list of keys from a Javascript object used
    * as a hash map.
    */
   lily.keys = function(map) {
      var keys = [];

      lily.assertNotNull(map, 'map');

      for (var k in map) {
         keys.push(k);
      }

      return keys;
   };

   /**
    * Get a list of values from a Javascript object used
    * as a hash map.
    */
   lily.values = function(map) {
      var values = [];

      lily.assertNotNull(map, 'map');

      for (var k in map) {
         values.push(map[k]);
      }

      return values;
   };

   /**
    * Get a list of key/value pairs from the given map.
    */
   lily.entries = function(map) {
      var entries = [];

      for (var k in map) {
         entries.push({key: k, value: map[k]});
      }

      return entries;
   };

   /**
    * Merge two or more maps together into a new map,
    * or simply copy a single map.
    */
   lily.merge = function() {
      var argMaps = Array.prototype.slice.call(arguments, 0);
      var resultMap = {};

      argMaps.forEach(function(map) {
         lily.entries(map).forEach(function(kv) {
            resultMap[kv.key] = kv.value;
         });
      });

      return resultMap;
   };

   lily.now = function() {
      return new Date().getTime();
   };

   lily.find = function(array, predicate) {
      for (var x = 0; x < array.length; x++) {
         if (predicate(array[x])) {
            return array[x];
         }
      }

      return null;
   };

   lily.contains = function(obj, value) {
      if (obj instanceof Array) {
         return lily.find(obj, function(v) { return v === value; }) != null;

      } else {
         return (value in obj);
      }
   };

   lily.containsValue = function(obj, value) {
      if (obj instanceof Array) {
         return lily.find(obj, function(v) { return v === value; }) != null;

      } else {
         return lily.find(lily.values(obj), function(v) { return v === value; }) != null;
      }
   };

   /**
    * Generate a random ID consisting of the current timestamp
    * and a random base-36 number based on Math.random().
    */
   lily.randomId = function() {
      return lily.sprintf("%s-%s", lily.now(), Math.random().toString(36).slice(2));
   };

   /**
    * Generate an enum from the given list of lower-case enum values,
    * where the enum keys will be upper case.
    *
    * Conversion from pascal case based on code from here:
    * http://stackoverflow.com/questions/30521224
    */
   lily.makeEnum = function(values) {
      var enumObj = {};

      values.forEach(function(value) {
         var key = value.replace(/\.?([a-z]+)_?/g, function (x, y) { return y.toUpperCase() + "_"; })
            .replace(/_$/, "");

         enumObj[key] = value;
      });

      return enumObj;
   };

   lily.makeNamespacedEnum = function(prefix, values) {
      var enumObj = lily.makeEnum(values);
      lily.keys(enumObj).forEach(function(key) {
         enumObj[key] = lily.sprintf("%s::%s", prefix, enumObj[key]);
      });
      return enumObj;
   };

   /**
    * Return a map of items in the given list indexed by
    * keys determined by the closure provided.
    *
    * @param iterable A list-like object.
    * @param closure A closure to determine the index for the
    *    items in the iterable.
    * @return A map from index to item for each item in the iterable.
    */
   lily.index = function(iterable, closure) {
      var map = {};

      iterable.forEach(function(item) {
         map[closure(item)] = item;
      });

      return map;
   };

   /**
    * Converts the given array into a map as a set,
    * where elements in the array are mapped to 1.
    */
   lily.set = function(arrayIn) {
      var setMap = {};

      arrayIn.forEach(function(key) {
         setMap[key] = 1;
      });

      return setMap;
   };

   /**
    * Returns a map for each key in mapB which
    * is NOT in mapA.
    */
   lily.relativeComplement = function(mapA, mapB) {
      var compMap = {};

      lily.keys(mapB).forEach(function(key) {
         if (! (key in mapA)) {
            compMap[key] = mapB[key];
         }
      });

      return compMap;
   };

   /**
    * Asserts that a premise is true.
    */
   lily.assertTrue = function(premise, message) {
      if (! premise) {
         throw new lily.ValueError(message);
      }
   };

   /**
    * Asserts that a value is not null or undefined.
    */
   lily.assertNotNull = function(value, name) {
      lily.assertTrue(value != null && typeof value !== undefined,
            lily.sprintf("%s must be provided", name || 'A value'));
      return value;
   };

   lily.deepcopy = function(src) {
      return JSON.parse(JSON.stringify(src));
   };

   /**
    * Get the current base url of the open page, e.g. if the page is
    * https://example.com:9494/oranges, this will be "https://example.com:9494".
    */
   lily.getBaseUrl = function() {
      var location = global.location;
      return lily.sprintf("%s//%s:%s", location.protocol, location.hostname, location.port);
   };

   /**
    * Determine if the current window is in an iframe.
    * Courtesy: http://stackoverflow.com/questions/326069/
    */
   lily.isFramed = function() {
      try {
         return window.self !== window.top;
      } catch (e) {
         return true;
      }
   };

   /**
    * A wrapper around Window.open() for managing single instance popups.
    */
   lily.PopupManager = function() {};

   lily.PopupManager.prototype.open = function(url, name) {
      var then = this._getLastOpenedTimestamp(name);
      var now = new Date().getTime();

      if (now - then > ONE_DAY_MILLIS) {
         var win = window.open('', name);
         if (win.location !== url) {
            window.open(url, name);
         }
         this._setLastOpenedTimestamp(name, now);
      }
   };
   
   lily.PopupManager.prototype.clear = function(name) {
      var key = this._getLocalStorageKey(name);
      global.localStorage.removeItem(key);
   };

   lily.PopupManager.prototype._getLastOpenedTimestamp = function(name) {
      var key = this._getLocalStorageKey(name);
      var value = global.localStorage.getItem(key);

      if (value) {
         return parseInt(value, 10);

      } else {
         return 0;
      }
   };

   lily.PopupManager.prototype._setLastOpenedTimestamp = function(name, ts) {
      var key = this._getLocalStorageKey(name);
      global.localStorage.setItem(key, '' + ts);
   };

   lily.PopupManager.prototype._getLocalStorageKey = function(name) {
      return "lilyPopupManager::" + name;
   };

   /**
    * An enumeration of the HTML5 notification permission values.
    */
   var NotificationPermission = lily.makeEnum([
      'granted',
      'denied',
      'default'
   ]);

   /**
    * A simple engine for showing notification popups.
    */
   lily.NotificationManager = function() {
      this.queue = [];
      this.permission = NotificationPermission.DEFAULT;
   };

   lily.NotificationManager.prototype.requestPermission = function() {
      var self = this;
      if (!("Notification" in global)) {
         lily.getLog().warn("This browser doesn't support notifications.");
         this.permission = NotificationPermission.DENIED;

      } else if (global.Notification.permission === NotificationPermission.DENIED) {
         lily.getLog().warn("The user has requested to not receive notifications.");
         this.permission = NotificationPermission.DENIED;

      } else if (this.permission !== NotificationPermission.GRANTED) {
         global.Notification.requestPermission(function(permission) {
            self.permission = permission;
            if (permission === NotificationPermission.GRANTED) {
               self._showQueued();

            } else {
               self.queue = [];
            }
         });
      }
   };

   lily.NotificationManager.prototype.show = function(title, options) {
      if (this.permission === NotificationPermission.GRANTED) {
         return this._showImpl({title: title, options: options});

      } else if (this.permission === NotificationPermission.DENIED) {
         lily.getLog().warn("Unable to show notification.").withObject({
            title: title,
            options: options
         });

      } else {
         var params = {title: title, options: options};
         lily.getLog().warn("Deferring notification until user decides to allow or deny.")
            .withObject(params);
         this.queue.push(params);
      }
   };

   lily.NotificationManager.prototype._showQueued = function() {
      var self = this;
      var notifications = this.queue.map(function(params) {
         return self._showImpl(params);
      });
      this.queue = [];
      return notifications;
   };

   lily.NotificationManager.prototype._showImpl = function(params) {
      var notification = new global.Notification(params.title, params.options);
      if (params.options.clicked) {
         notification.onclick = function() {
            params.options.clicked.call(notification);
         };
      }
      return notification;
   };

   lily.BaseError = function(format, args) {
      global.Error.call(this, lily.vsprintf(format, args));
   };
   lily.BaseError.prototype = Object.create(Error.prototype);
   lily.BaseError.prototype.constructor = lily.BaseError;

   lily.ValueError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      lily.BaseError.call(this, format, args);
   };
   lily.ValueError.prototype = Object.create(lily.BaseError.prototype);
   lily.ValueError.prototype.constructor = lily.ValueError;

   lily.NotImplementedError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      lily.BaseError.call(this, format, args);
   };
   lily.NotImplementedError.prototype = Object.create(lily.BaseError.prototype);
   lily.NotImplementedError.prototype.constructor = lily.NotImplementedError;

   lily.StateError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      lily.BaseError.call(this, format, args);
   };
   lily.StateError.prototype = Object.create(lily.BaseError.prototype);
   lily.StateError.prototype.constructor = lily.StateError;

})();
