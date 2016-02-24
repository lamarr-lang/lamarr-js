#lamarr-js

Lamarr language parser, compiler and game engine written in JavaScript.

For more information about Lamarr language please referr to [Lammar WIKI](https://github.com/lamarr-lang/lamarr-lang.github.io/wiki).

## Under development
This library is currently under active development and API may change.

## CLI usage
```bash
node ./lamarr.js demo.lrm
```

## JavaScript API usage
```javascript
var lamarrLang = require("lamarr-js");

var game = lamarrLang.load("./demo.lmr");

var controller = game.enter("player", {
	name: "Player"
});

controller. ... #to-do
```

## API
TO-DO

## License
MIT (c) 2016 Jiri Hybek <jiri@hybek.cz>