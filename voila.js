/*!
 * Voilà - v0.1.0
 * (c) 2014 Nick Stakenburg
 *
 * MIT License
 */

(function($) {
  var _slice = Array.prototype.slice;

  function Voila(elements, callback) {
    if (!(this instanceof Voila)) { 
      return new Voila(elements, callback);
    }

    this.options = $.type(callback) == 'function' ? { complete: callback } : 
                   callback || {};

    this._uid = Voila._uid++;
    this._callbacks = Voila._callbacks[this._uid] = {};
    this._processed = 0;

    // create callbacks and put them on the stack
    $.each('complete success error progress'.split(' '), $.proxy(function(i, name) {
      this._callbacks[name] = this.options[name] || function() {};
    }, this));

    this.images = [];

    this.add(elements);
  };

  $.extend(Voila, {
    _uid: 1,
    _callbacks: []
  });

  $.extend(Voila.prototype, {
    add: function(elements) {
      // normalize to an array
      var array = $.type(elements) == 'string' ? $(elements) : // selector
                  elements.jQuery || elements.length > 0 ? elements : // jQuery obj, Array
                  [elements]; // element node

      // subtract the images
      $.each(array, $.proxy(function(i, element) {
        // single image
        if ($(element).is('img')) {
          this.images.push(new Loading.Image(element, this));
          return;
        }

        // nested
        $(element).find('img').each($.proxy(function(i, img) {
          this.images.push(new Loading.Image(img, this));
        }, this));
      }, this));
    },

    abort: function() {
      $.each(this.images, function(i, image) {
        image.abort();
      });

      this.images = [];
      this.callbacks = {};
    },

    progress: function(image, successful) {
      this._processed++;

      // when a broken image passes by keep track of it
      if (!successful) this._broken = true;

      // notify the progress callback
      this._callbacks.progress(this, image);

      // completed
      if (this._processed == this.images.length) {
        this._callbacks.complete(this);

        // error or succes based on broken images
        this._callbacks[this._broken ? 'error' : 'success'](this);
      }
    }
  });

  var Loading = { uid: 1 };
  Loading.Image = function() { return this.initialize.apply(this, _slice.call(arguments)); };
  $.extend(Loading.Image.prototype, {
    initialize: function(img, voila) {
      this.img = img;

      this._uid = Loading.uid++;
      this._voila = voila;
      this._timers = {};

      this.loaded = false;

      // give time for an abort before the load
      this.setTimer('load', $.proxy(function() {
        this.load();
      }, this), 1);
    },

    // timers
    setTimer: function(name, handler, ms) {
      this._timers[name] = setTimeout(handler, ms);
    },
    clearTimers: function() {
      $.each(this._timers, function(i, timer) {
        clearTimeout(timer);
      });
      this._timers = {};
    },

    load: function() {
      // naturalWidth
      if (this.img.complete && $.type(this.img.naturalWidth) == 'number') {
        this.complete(this.img.naturalWidth != 0);
        return;
      }

      // load from cache
      var detachedImage = Detached.cache[this.img.src] || (Detached.cache[this.img.src] = new Detached.Image(this.img.src));
      if (detachedImage.completed) {
        this.complete(detachedImage.loaded);
        return;
      }

      // fallback
      detachedImage.load($.proxy(function() {
        this.complete(detachedImage.loaded);
      }, this), this._uid);
    },

    complete: function(loaded) {
      this.loaded = loaded;

      // avoids browser bugs with cached images
      this.setTimer('complete', $.proxy(function() {
        this._voila.progress(this, loaded);
      }, this), 1);
    },

    abort: function() {
      this.clearTimers();

      // if there's a cached detached image, cancel its load
      var detachedImage;
      if ((detachedImage = Detached.cache[this.img.src])) {
        detachedImage.remove(this._uid);
      }
    }
  });

  // An img element detached from the DOM used for loading, multiple 'Loading.Images'
  // can be using the same detached image based on its src.
  var Detached = { cache: [], uid: 1 };
  Detached.Image = function() { return this.initialize.apply(this, _slice.call(arguments)); };
  $.extend(Detached.Image.prototype, {
    initialize: function(src) {
      this.src = src;
      this.callstack = {};
    },

    load: function(callback, uid) {
      // always push the callback onto the callstack
      this.callstack[uid] = callback;

      // when already completed this load, process the callstack
      if (this.completed) {
        this.process(this.loaded);
        return;
      }

       // don't load twice
      if (this.loading) return;
      this.loading = true;

      var image = new Image();
      $(image).bind('load error', $.proxy(function(event) {
        $(image).unbind('load error');

        this.loaded = event.type == 'load';
        this.completed = true;
        this.loading = false;

        this.process(this.loaded);
      }, this));
      image.src = this.src;
    },

    process: function(loaded) {
      $.each(this.callstack, $.proxy(function(i, callback) {
        callback(loaded);
      }, this));

      // empty the callbacks
      this.callstack = {};
    },

    // the uid is that of the loading image
    remove: function(uid) {
      if (this.callstack[uid]) {
        delete this.callstack[uid];
      }
    }
  });

  // extend jQuery
  $.fn.voila = function(callback) {
    return new Voila(this, callback);
  };

  // expose
  window.Voila = Voila;
})(jQuery);
