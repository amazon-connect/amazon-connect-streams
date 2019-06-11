#81:

The code change fixes uncaught promise DOMException with the play() function.
Before user has interacted with the iframe it's not allowed to play sound.
This fix delegates the autoplay permission via allow attribute to the ccp iframe preventing this error.


By submitting this pull request, I confirm that you can use, modify, copy, and redistribute this contribution, under the terms of your choice.
