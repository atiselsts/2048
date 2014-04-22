# 2048 solver

A solver for the 2048(https://github.com/gabrielecirulli/2048/) puzzle, made in just a few evenings.

[Some day the demo may be available here](http://atiselsts.github.io/2048/)

### Instructions

Run the solver by opening 2048/index.html in your web browser.

"Auto move": make a single move

"Auto play": play automatically, until stopped.

### Tweaks and the internals

The settings (search depth and maximum time) for now are hardcoded in the js/game_manager.js

The algorithm itself is contained in the file js/ai.js

Occasionally the AI is going to lose. At least with the default search depth it's unavoidable.
