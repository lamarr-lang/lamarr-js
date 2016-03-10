/*
 * Lamarr JS
 *
 * @author Jiri Hybek <jiri@hybek.cz>
 * @license See LICENSE file distriubted with this source code.
 */

var fs = require("fs");

var logger = require("meta-logger");
var Parser = require("../lib/parser.js");

logger.toConsole({
	level: "debug",
	timestamp: false,
	colorize: true
});

try {

	var src = fs.readFileSync("./demo2.txg", { encoding: 'utf8' } );
	var r = Parser.parse(src);

	console.dir(r, { depth: null, colors: true });

} catch(err) {

	//logger.debug(err, err.stack);
	logger.error(err.toString(), err.stack);

}