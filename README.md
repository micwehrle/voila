# Voilà

Voilà is a jQuery plugin that provides callbacks for images, letting you know when they've loaded.

It's based on the work done by David DeSandro on [imagesLoaded](http://imagesloaded.desandro.com)

## Installation

```
<script type="text/javascript" src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
<script type="text/javascript" src="voila.js"></script>
```

## Usage

```js
new Voila(element, callback);
```

+ `element` _Element, NodeList, Array, or Selector String_
+ `callback` _Function_ - function called when all images have been loaded

Additional callbacks are available by providing options instead of the callback:

```js
new Voila('#container', {
  complete: function(instance) {
    console.log('COMPLETE - All images have finished loading');
  },
  progress: function(instance, image) {
    var status = image.loaded ? 'loaded' : 'broken';
    console.log('PROGRESS - Image ' + status + ': ' + image.img.src);
  },
  error: function(instance) {
    console.log('ERROR - All images finished loading, but some are broken');
  },
  success: function(instance) {
    console.log('SUCCESS - All images finished loading succesfully');
  }
});
```

## API

A `voila` instance can be stored, exposing some extra properties and functions:

```js
var voila = new Voila('#container', callback);
```

+ `voila.images` _Array_ - contains an `image` object for each `img` element found
+ `voila.abort()` _Function_ - aborts all callbacks

Within the callbacks the `voila` instance is always the first argument, the second one can be an `image` object.

+ `image.img` _ImageElement_ - the `img` element
+ `image.loaded` _Boolean_ - `true` when succesfully loaded

Here's how to find out which images have succesfully loaded within the complete callback:

```js
new Voila('#container', function(instance) {
  $.each(instance.images, function(i, image) {
    var status = image.loaded ? 'loaded' : 'broken';
    console.log(status + ': ' + image.img.src);
  });
});
```

## jQuery

Some sugar is added to jQuery for convenience:

```js
var voila = $('#container').voila(callback);
```
