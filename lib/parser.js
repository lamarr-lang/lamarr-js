/*
 * Lamarr JS
 *
 * @author Jiri Hybek <jiri@hybek.cz>
 * @license See LICENSE file distriubted with this source code.
 */

var def = require("./langdef.js");

/*
 * Code reference
 *
 * @param string source
 * @param integer index
 */
var CodeRef = function(source, index){

	//this.source = source;
	this.index = index;

};

/*
 * Parser exceptions
 *
 * @param Parser parser
 * @param string message
 * @param integer offset (optional)
 */
var ParserException = function(parser, message, offset){

	var index;

	if(offset instanceof CodeRef)
		index = offset.index;
	else
		index = parser.index+= (offset || 0);

	var lineOffset = 0;
	var lines = parser.source.split("\n");
	var line, lineIndex, charIndex = 0;

	for(var i = 0; i < lines.length; i++){
		if(index >= lineOffset && index < lineOffset + lines[i].length + 1){
			lineIndex = i;
			break;
		}

		lineOffset+= lines[i].length + 1;
	}

	lineChar = index - lineOffset;
	line = lines[i];
	lineIndex = index - lineOffset;

	this.name = "ParserException";
	this.message = message + " at {" + (lineIndex + 1) + ":" + charIndex + "} '" + line.substr(0, lineIndex) + ">>>" + line.substr(lineIndex, 1) + "<<<" + line.substr(lineIndex + 1) + "'.";
	this.source = parser.source;

};

ParserException.prototype = Object.create(Error.prototype);

/*
 * Expression instance
 *
 * @param string exp
 */
var Expression = function(exp){

	this.exp = exp;

};

Expression.prototype.toFunction = function(){

	return 'function(locals, globals, _fn){return ' + this.exp + ';}';

};

/*
 * String token
 *
 * @param string content
 */
var StringToken = function(content){

	this.content = content;

};

StringToken.prototype.toString = function(){

	return this.content;

};

/*
 * Range token
 *
 * @param string content
 */
var RangeToken = function(from, to){

	this.from = from;
	this.to = to;

};

/*
 * Numeric token
 *
 * @param string content
 */
var NumericToken = function(value){

	this.value = value;

};

/*
 * Variable token
 *
 * @param string content
 */
var VariableToken = function(value){

	this.value = value;

};

VariableToken.prototype.toString = function(){

	return this.value;

};

/*
 * Token list
 *
 * @param array tokens
 */
var TokenList = function(tokens){

	this.tokens = tokens;

};

TokenList.prototype.match = function(pattern){

	if(this.tokens.length === 0) return false;

	var haystack = this.tokens[0];
	var xp = new RegExp(pattern);
	var match = xp.exec(haystack);

	if(match)
		return true;
	else
		return false;

};

TokenList.prototype.has = function(){

	return ( this.tokens.length > 0 ? true : false );

};

TokenList.prototype.checkToken = function(token, pattern){

	switch(pattern){

		case '%s': if(token instanceof StringToken) return true; break;
		case '%r': if(token instanceof RangeToken) return true; break;
		case '%n': if(token instanceof NumericToken) return true; break;
		case '%v': if(token instanceof VariableToken) return true; break;
		case '%e': if(token instanceof Expression) return true; break;
		case '%i': return true;
		default: if(token == pattern) return true;

	}

	return false;

};

TokenList.prototype.eat = function(format){

	var list = format.split(" ");
	var cnt = 0;

	if(this.tokens.length < list.length) return false;

	for(var i = 0; i < list.length; i++){

		if(!this.checkToken(this.tokens[i], list[i])) return false;
		cnt++;

	}

	return this.tokens.splice(0, cnt);

};

TokenList.prototype.eatOne = function(pattern){

	if(this.tokens.length === 0) return false;

	if(this.checkToken(this.tokens[0], pattern))
		return this.tokens.shift();
	else
		return false;

};

TokenList.prototype.shift = function(){

	return this.tokens.shift();

};

TokenList.prototype.empty = function(){

	return ( this.tokens.length === 0 ? true : false );

};

/*
 * Parser library
 */
var Parser = function(){

	this.source = null;

	this.index = null;
	this.buffer = null;

	this.output = null;

};

/*
 * Returns buffer contents
 *
 * @return string
 */
Parser.prototype.getBuffer = function(){

	return this.buffer;

};

/*
 * Returns buffer conents and clears it
 *
 * @return string
 */
Parser.prototype.flushBuffer = function(){

	var  b = this.buffer;
	this.buffer = "";

	return b;

};

/*
 * Clears buffer
 *
 * @void
 */
Parser.prototype.clearBuffer = function(){

	this.buffer = "";

};

/*
 * Eats pattern, if match saves to buffer, moves index and returns true, else return false
 *
 * @param string pattern
 * @param toBuffer boolean = true
 * @param skip boolean = true
 * @return bool
 */
Parser.prototype.eat = function(pattern, toBuffer, skip){

	var haystack = this.source.substr(this.index);
	var xp = new RegExp("^" + pattern);
	var match = xp.exec(haystack);

	if(match){
		if(skip !== false)     this.index+= String(match[0]).length;
		if(toBuffer !== false) this.buffer+= match[0];
		return true;
	}

	return false;

};

/*
 * Eats pattern until match, if match saves to buffer, moves index and returns true, else return false
 *
 * @param string pattern
 * @param toBuffer boolean = true
 * @param skip boolean = true
 * @return bool
 */
Parser.prototype.eatUntil = function(pattern, toBuffer, skip){

	var haystack = this.source.substr(this.index);
	var xp = new RegExp(pattern);
	var match = xp.exec(haystack);

	if(match){
		if(skip !== false)     this.index+= match.index + String(match[0]).length;
		if(toBuffer !== false) this.buffer+= haystack.substr(0, match.index) + match[0];
		return true;
	}

	return false;

};

/*
 * Eats one character and adds it to buffer
 */
Parser.prototype.next = function(){

	this.buffer+= this.source.substr(this.index, 1);
	this.index++;

	return true;

};

/*
 * Skip specified characters without adding to buffer
 *
 * @param integer count
 */
Parser.prototype.skip = function(count){

	this.index+= (count || 1);

	return true;

};

Parser.prototype.isEnd = function(){

	return (this.index >= this.source.length ? true : false);

};

Parser.prototype.error = function(message, offset){

	throw new ParserException(this, message, offset);

};

Parser.prototype.getRef = function(){

	return new CodeRef(this.source, this.index);

};

Parser.prototype.debug = function(){
	console.log("---- Char: " + this.index + " '" + this.source.substr(this.index, 1) + "' ----");
	console.log(this.source.substr(0, this.index) + ">>>" + this.source.substr(this.index, 1) + "<<<" + this.source.substr(this.index + 1));
	console.log("----");
};

Parser.prototype.logToken = function(description){

	console.log("[%s] at %d '%s'", description, this.index, this.source.substr(this.index, 1));

};

Parser.prototype.parse = function(source){

	//Reset state
	this.source = source;

	this.tokenizer = null;
	this.tokenizerCb = null;
	this.context = null;
	this.stack = [];

	this.index = 0;
	this.buffer = "";

	this.output = {
		"variables": {},
		"properties": {},
		"actions": [],
		"nodes": {},
		"edges": {},
		"entities": { "player": {
			"variables": {}
		} },
		"items": {},
		"boring": {},
		"modifiers": {},
		"start": null
	};

	//Set default tokenizer
	while(this.parseStatement()){}

	return this.output;

};

/*
 *
 * Tokenizers
 *
 */
Parser.prototype.parseStatement = function(){

	if(this.eat(def.mlCommentOpen)) return this.parseMultilineComment();
	if(this.eat(def.comment)) return this.parseComment();

	if(this.eat(def.sectionNodes)) return this.parseSection( this.parseNode );
	if(this.eat(def.sectionVars)) return this.parseSection( this.parseVarDefinition );
	if(this.eat(def.sectionProperties)) return this.parseSection( this.parseProperty );
	if(this.eat(def.sectionActions)) return this.parseSection( this.parseAction );
	if(this.eat(def.sectionMap)) return this.parseSection( this.parsePath );
	if(this.eat(def.sectionItem)) return this.parseItem();
	if(this.eat(def.sectionBoring)) return this.parseSection( this.parseBoringDefinition );
	if(this.eat(def.sectionMod)) return this.parseMod();

	if(this.eat(def.start)) return this.parseStart();
	if(this.eat(def.node)) return this.parseNode();
	if(this.eat(def.property)) return this.parseProperty(null);
	if(this.eat(def.path)) return this.parsePath();
	if(this.eat(def.action)) return this.parseAction();

	if(this.eat(def.condFirst)) return this.parseItemFirst();
	if(this.eat(def.pick)) return this.parsePick(null, null);
	if(this.eat(def.check)) return this.parseCheck(null, null);
	if(this.eat(def.use)) return this.parseUse(null, null);
	if(this.eat(def.lay)) return this.parseLay(null, null);
	if(this.eat(def.location)) return this.parseLocation(null, null);
	if(this.eat(def.resources)) return this.parseResources(null, null);

	if(this.eat(def.varName, false, false)) return this.parseVarDefinition();
	if(this.eat(def.var)) return this.parseVarDefinition();


	//if(this.eat(def.sectionNodes))
	//	return this.parseNodes();

	//Blank line
	if(this.eat(def.blank) || this.eat(def.lineEnd))
		return this.parseStatement();

	if(this.isEnd())
		return false;

	return this.error("Unexpected token");

};

Parser.prototype.parseComment = function(){

	this.logToken("comment");

	if(this.isEnd())
		return true;
	else if(this.eatUntil(def.lineEnd)){
		return true;
	}

	this.next();
	return this.parseComment();

};

Parser.prototype.parseMultilineComment = function(){

	this.logToken("ml-comment");

	if(this.isEnd())
		return true;
	else if(this.eatUntil(def.mlCommentClose)){
		return true;
	}

	this.next();
	return this.parseMultilineComment();

};

Parser.prototype.parseSection = function(lineParser){

	if(!this.eat(def.lineEnd)) return this.error("Expecting nodes definition");

	while(true){

		if(this.eat(def.comment)){
			this.parseComment();
			continue;
		}

		if(this.eat(def.mlCommentOpen)){
			this.parseMultilineComment();
			continue;
		}

		if(this.eat(def.lineEnd))
			return true;

		if(this.isEnd())
			return true;

		lineParser.call(this);

	}

	return true;

};

Parser.prototype.parseItem = function(){

	this.logToken("item");

	var ref = this.getRef();

	var tokens = this.parseTokens();
	var args = tokens.eat("%i %s");

	if(!args) return this.error("Expecting item name and label");

	var appendix = tokens.eat("%s");

	if(!this.output.items[args[0]])
		this.output.items[args[0]] = {};

	this.output.items[args[0]].label = args[1];
	this.output.items[args[0]].appendix = appendix;

	while(true){

		if(this.eat(def.blank))
			continue;

		if(this.eat(def.lineEnd))
			return true;

		if(this.isEnd())
			return true;
		
		if(this.eat(def.comment)){
			this.parseComment();
			continue;
		}

		if(this.eat(def.mlCommentOpen)){
			this.parseMultilineComment();
			continue;
		}

		if(this.eat(def.condFirst)){
			this.parseItemFirst();
			continue;
		}
		
		if(this.eat(def.pick)){
			this.parsePick(null, args[0]);
			continue;
		}
		
		if(this.eat(def.check)){
			this.parseCheck(null, args[0]);
			continue;
		}
		
		if(this.eat(def.use)){
			this.parseUse(null, args[0]);
			continue;
		}
		
		if(this.eat(def.lay)){
			this.parseLay(null, args[0]);
			continue;
		}
		
		if(this.eat(def.location)){
			this.parseLocation(args[0]);
			continue;
		}
		
		if(this.eat(def.resources)){
			this.parseResources(args[0]);
			continue;
		}
		
		if(this.eat(def.boring)){
			this.parseBoring(args[0]);
			continue;
		}

		return this.error("Unexpected token");

	}

	return true;

};

Parser.prototype.parseMod = function(){

	this.logToken("mod");

	var ref = this.getRef();

	var tokens = this.parseTokens();
	var name = tokens.eatOne("%i");

	if(!name) return this.error("Expecting mod name");

	if(!this.output.modifiers[name])
		this.output.modifiers[name] = [];

	while(true){

		if(this.eat(def.blank))
			continue;

		if(this.eat(def.lineEnd))
			return true;

		if(this.isEnd())
			return true;

		if(this.eat(def.comment)){
			this.parseComment();
			continue;
		}

		if(this.eat(def.mlCommentOpen)){
			this.parseMultilineComment();
			continue;
		}

		this.output.modifiers[name].push(this.parseModStatement());

	}

	return true;

};

Parser.prototype.parseStart = function(){

	this.logToken("start");

	if(this.output.start)
		return this.error("Start already defined");
	
	var ref = this.getRef();
	var args = this.parseTokens().eat("%s %i");

	if(!args) return this.error("Expecting start text and start node", ref);

	this.output.start = {
		_ref: ref,
		message: args[0],
		node: args[1]
	};

	return true;

};

Parser.prototype.parseNode = function(){

	this.logToken("node");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	var fin = tokens.eatOne("final");
	var args = tokens.eat("%i %s");

	if(!args) return this.error("Expecting node name and description", ref);

	this.output.nodes[args[0]] = {
		_ref: ref,
		message: args[1],
		isFinal: ( fin ? true : false )
	};

	return true;

};

Parser.prototype.parseProperty = function(){

	this.logToken("property");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	var name = tokens.eat("%v");
	if(name)
		name = name.toString();
	else
		name = tokens.eat("%i");

	if(!name) return this.error("Expecting variable name", ref);

	var label = tokens.eat("%s");
	if(!label) return this.error("Expecting variable label", ref);

	var range = tokens.eat("%r");

	this.output.properties[name] = {
		_ref: ref,
		label: label,
		range: ( range ? range : null )
	};

	return true;

};

Parser.prototype.parsePath = function(){

	this.logToken("path");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	var args = tokens.eat("%i %s %i");
	if(!args) return this.error("Expecting from node, label and to node", ref);

	var mod = true, mods = [];
	
	while((mod = tokens.eat("%i")))
		mods.push(mod);

	if(!this.output.edges[args[0]])
		this.output.edges[args[0]] = {};

	this.output.edges[args[0]][args[2]] = {
		_ref: ref,
		label: args[1],
		mods: mods
	};

	return true;

};

Parser.prototype.parseItemFirst = function(){

	this.logToken("item-first");

	this.eat(def.blank);
	this.clearBuffer();

	var cnt = 1;

	if(this.eat("[0-9]+"))
		cnt = parseInt(this.flushBuffer());

	this.eat(def.blank);

	if(this.eat(def.pick)) return this.parsePick(cnt, null);
	if(this.eat(def.check)) return this.parseCheck(cnt, null);
	if(this.eat(def.use)) return this.parseUse(cnt, null);
	if(this.eat(def.lay)) return this.parseLay(cnt, null);

	return this.error("Expecting [pick|check|use|lay]");

};

Parser.prototype.parsePick = function(count, itemName){

	this.logToken("pick");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	var no = tokens.eatOne("no");

	//Item name
	if(!itemName){
		itemName = tokens.eatOne("%i");
		if(!itemName) return this.error("Expecting item name", ref);
	}

	var cond = tokens.eatOne("%e");
	var msg = tokens.eatOne("%s");

	var mod = true, mods = [];
	
	while((mod = tokens.eat("%i")))
		mods.push(mod);

	if(!this.output.items[itemName])
		this.output.items[itemName] = {};

	if(!this.output.items[itemName].pick)
		this.output.items[itemName].pick = [];

	this.output.items[itemName].pick.push({
		_ref: ref,
		cond: ( cond ? cond : null ),
		msg: ( msg ? msg : null ),
		mods: mods,
		no: ( no ? true : false ),
		count: count
	});

	return true;

};

Parser.prototype.parseCheck = function(count, itemName){

	this.logToken("check");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	//Item name
	if(!itemName){
		itemName = tokens.eatOne("%i");
		if(!itemName) return this.error("Expecting item name", ref);
	}

	var cond = tokens.eatOne("%e");
	var msg = tokens.eatOne("%s");

	var mod = true, mods = [];
	
	while((mod = tokens.eat("%i")))
		mods.push(mod);

	if(!this.output.items[itemName])
		this.output.items[itemName] = {};

	if(!this.output.items[itemName].check)
		this.output.items[itemName].check = [];

	this.output.items[itemName].check.push({
		_ref: ref,
		cond: ( cond ? cond : null ),
		msg: ( msg ? msg : null ),
		mods: mods,
		count: count
	});

	return true;

};

Parser.prototype.parseUse = function(count, itemName){

	this.logToken("use");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	var target = null;
	var no = tokens.eatOne("no");

	//Item name
	if(!itemName){
		itemName = tokens.eatOne("%i");
		if(!itemName) return this.error("Expecting item name", ref);
	}

	//Target
	if(tokens.eatOne("on")){
		target = tokens.eatOne("%i");
		if(!target) return this.error("Expecting target identifier", ref);
	}

	var cond = tokens.eatOne("%e");
	var msg = tokens.eatOne("%s");

	var mod = true, mods = [];
	
	while((mod = tokens.eat("%i")))
		mods.push(mod);

	if(!this.output.items[itemName])
		this.output.items[itemName] = {};

	if(!this.output.items[itemName].use)
		this.output.items[itemName].use = [];

	this.output.items[itemName].use.push({
		_ref: ref,
		target: target,
		cond: ( cond ? cond : null ),
		msg: ( msg ? msg : null ),
		mods: mods,
		count: count,
		no: ( no ? true : false )
	});

	return true;

};

Parser.prototype.parseLay = function(count, itemName){

	this.logToken("lay");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	var no = tokens.eatOne("no");

	//Item name
	if(!itemName){
		itemName = tokens.eatOne("%i");
		if(!itemName) return this.error("Expecting item name", ref);
	}

	var cond = tokens.eatOne("%e");
	var msg = tokens.eatOne("%s");

	var mod = true, mods = [];
	
	while((mod = tokens.eat("%i")))
		mods.push(mod);

	if(!this.output.items[itemName])
		this.output.items[itemName] = {};

	if(!this.output.items[itemName].lay)
		this.output.items[itemName].lay = [];

	this.output.items[itemName].lay.push({
		_ref: ref,
		cond: ( cond ? cond : null ),
		msg: ( msg ? msg : null ),
		mods: mods,
		no: ( no ? true : false ),
		count: count
	});

	return true;

};

Parser.prototype.parseResources = function(itemName){

	this.logToken("resources");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	//Item name
	if(!itemName){
		itemName = tokens.eatOne("%i");
		if(!itemName) return this.error("Expecting item name", ref);
	}

	var node = true, nodes = [];
	
	while((node = tokens.eat("%i")))
		nodes.push(node);

	if(!this.output.items[itemName])
		this.output.items[itemName] = {};

	if(!this.output.items[itemName].resources)
		this.output.items[itemName].resources = {};

	for(var n in nodes)
		this.output.items[itemName].resources[nodes[n]] = {
			_ref: ref
		};

	return true;

};

Parser.prototype.parseLocation = function(itemName){

	this.logToken("location");

	var ref = this.getRef();
	var tokens = this.parseTokens();
	var type = 0;
	var node = null;

	//Item name
	if(!itemName){
		itemName = tokens.eatOne("%i");
		if(!itemName) return this.error("Expecting item name", ref);
	}

	if(tokens.eatOne("no"))
		type = 0;
	else if(tokens.eatOne("player"))
		type = 1;
	else {
		type = 3;
		node = tokens.eatOne("%i");
		if(!node) return this.error("Expecting [no|player|nodeName]", ref);
	}

	if(!this.output.items[itemName])
		this.output.items[itemName] = {};

	this.output.items[itemName].location = {
		_ref: ref,
		type: type,
		node: node
	};

	return true;

};

Parser.prototype.parseBoring = function(itemName){

	this.logToken("boring");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	//Item name
	if(!itemName){
		itemName = tokens.eatOne("%i");
		if(!itemName) return this.error("Expecting item name", ref);
	}

	if(!this.output.items[itemName])
		this.output.items[itemName] = {};

	while(!tokens.empty()){

		if(tokens.eatOne("pick")){
			
			var pickNo = false;

			if(tokens.eatOne("no")) pickNo = true;

			if(!this.output.items[itemName].pick)
				this.output.items[itemName].pick = [];

			this.output.items[itemName].pick.push({ _ref: ref, cond: null, msg: null, mods: ["boring"], no: ( pickNo ? true : false ), count: null });

			continue;

		}

		if(tokens.eatOne("check")){

			if(!this.output.items[itemName].check)
				this.output.items[itemName].check = [];

			this.output.items[itemName].check.push({ _ref: ref, cond: null, msg: null, mods: ["boring"], count: null });

			continue;
		}

		if(tokens.eatOne("use")){
			
			var useNo = false;

			if(tokens.eatOne("no")) useNo = true;

			if(!this.output.items[itemName].use)
				this.output.items[itemName].use = [];

			this.output.items[itemName].use.push({ _ref: ref, cond: null, msg: null, mods: ["boring"], count: null, no: ( useNo ? true : false ) });

			continue;
		}

		if(tokens.eatOne("lay")){

			var layNo = false;

			if(tokens.eatOne("no")) layNo = true;

			if(!this.output.items[itemName].lay)
				this.output.items[itemName].lay = [];

			this.output.items[itemName].lay.push({ _ref: ref, cond: null, msg: null, mods: ["boring"], no: ( layNo ? true : false ), count: null });

			continue;

		}

		return this.error("Unexpected action " + tokens.shift(), ref);

	}

	return true;

};

Parser.prototype.parseAction = function(){

	this.logToken("action");

	var ref = this.getRef();
	var tokens = this.parseTokens();

	var cond = tokens.eatOne("%e");
	var node = null;

	if(!cond){
		node = tokens.eatOne("%i");
		if(!node) return this.error("Expecting condition or node name", ref);
	}

	var label = tokens.eatOne("%s");
	if(!label) return this.error("Expecting action label", ref);

	var msg = tokens.eatOne("%s");

	var mod = true, mods = [];

	while((mod = tokens.eat("%i")))
		mods.push(mod);

	if(!msg && mods.length === 0) return this.error("Message or modifier must be specified", ref);

	this.output.actions.push({
		_ref: ref,
		cond: ( cond ? cond : null ),
		node: node,
		label: label,
		msg: ( msg ? msg : null ),
		mods: mods
	});

	return true;

};

Parser.prototype.parseBoringDefinition = function(){

	this.logToken("boring-def");

	var ref = this.getRef();
	var tokens = this.parseTokens();
	var type = null;

	if(tokens.eatOne("pick")){

		if(tokens.eatOne("no"))
			type = "pickNo";
		else
			type = "pick";

	} else if(tokens.eatOne("check")) {

		type = "check";

	} else if(tokens.eatOne("use")) {

		type = "use";

	} else if(tokens.eatOne("lay")) {

		if(tokens.eatOne("no"))
			type = "layNo";
		else
			type = "lay";

	} else {

		return this.error("Undefined action", ref);

	}

	var msg = tokens.eatOne("%s");
	if(!msg) return this.error("Expecting message", ref);

	this.output.boring[type] = msg;

	return true;

};

Parser.prototype.parseModStatement = function(){

	this.logToken("mod-statement");

	var ref = this.getRef();
	var cond = null;
	var command = null;

	if(this.eat(def.expOpen)){
		cond = this.parseExpression("\\)");
		this.eat(def.blank);
	}

	if(this.eat(def.var)){

		var _varExp = this.parseVarDefinition();
		
		return {
			_ref: ref,
			cond: cond,
			command: [ "var", _varExp ]
		};

	}

	if(this.eat(def.varName)){

		var varExp = this.parseVarDefinition();
		
		return {
			_ref: ref,
			cond: cond,
			command: [ "var", varExp ]
		};

	}

	var tokens = this.parseTokens();

	if(tokens.eatOne("message")){

		var msg = tokens.eatOne("%s");
		if(!msg) return this.error("Expecting message");

		command = [ "message", msg ];

	} else if(tokens.eatOne("additem")){

		var addItem_arg1 = tokens.eatOne("%i");
		var addItem_arg2 = tokens.eatOne("%i");
		if(!addItem_arg1) return this.error("Expecting node or item name");

		command = [ "addItem", ( addItem_arg2 ? addItem_arg2 : addItem_arg1 ), ( addItem_arg2 ? addItem_arg1 : null ) ];

	} else if(tokens.eatOne("delitem")){

		var delItem_arg1 = tokens.eatOne("%i");
		if(!delItem_arg1) return this.error("Expecting item name");

		command = [ "delItem", delItem_arg1 ];

	} else if(tokens.eatOne("setitem")){

		var setItem_arg1 = tokens.eatOne("%i");
		var setItem_arg2 = tokens.eatOne("%s");
		var setItem_arg3 = tokens.eatOne("%s");
		if(!setItem_arg1) return this.error("Expecting item name");
		if(!setItem_arg2) return this.error("Expecting item label");

		command = [ "setItem", setItem_arg1, setItem_arg2, ( setItem_arg3 ? setItem_arg3 : null ) ];

	} else if(tokens.eatOne("addresource")){

		var addRes_args = tokens.eat("%i %i");
		if(!addRes_args) return this.error("Expecting item and node name");

		command = [ "addResource" ].concat(addRes_args);

	} else if(tokens.eatOne("delresource")){

		var delRes_args = tokens.eat("%i %i");
		if(!delRes_args) return this.error("Expecting item and node name");

		command = [ "delResource" ].concat(delRes_args);

	} else if(tokens.eatOne("setnode")){

		var setNode_args = tokens.eat("%i %s");
		if(!setNode_args) return this.error("Expecting node name and description");

		command = [ "setNode" ].concat(setNode_args);

	} else if(tokens.eatOne("addpath")){

		var addPath_args = tokens.eat("%i %s %i");
		if(!addPath_args) return this.error("Expecting from node, description and to node");

		command = [ "addPath" ].concat(addPath_args);

	} else if(tokens.eatOne("delpath")){

		var delPath_args = tokens.eat("%i %i");
		if(!delPath_args) return this.error("Expecting from node and to node");

		command = [ "delPath" ].concat(delPath_args);
	
	} else if(tokens.eatOne("teleport")){

		var teleport_args = tokens.eat("%i");
		if(!teleport_args) return this.error("Expecting node name");

		command = [ "teleport" ].concat(teleport_args);

	} else if(tokens.eatOne("callmod")){

		var callMod_cond = tokens.eatOne("%e");
		var callMod_name = tokens.eatOne("%i");
		if(!callMod_name) return this.error("Expecting mod name");

		command = [ "callMod", callMod_name, ( callMod_cond ? callMod_cond : null ) ];

	} else if(tokens.eatOne("skip")){

		var skip_count = tokens.eatOne("%n");
		if(!skip_count) return this.error("Expecting mod name");

		command = [ "skip", skip_count ];

	} else if(tokens.eatOne("return")){

		command = [ "return" ];

	} else {

		return this.error("Undefined command");

	}

	return {
		_ref: ref,
		cond: cond,
		command: command
	};

};

Parser.prototype.parseTokens = function(){

	this.logToken("token-list");

	var tokens = [];

	while(true){

		this.clearBuffer();

		if(this.eat(def.blank)){
			continue;
		}

		if(this.eat(",")){
			continue;
		}

		if(this.eat(def.stringOpen)){
			tokens.push(new StringToken(this.parseString()));
			continue;
		}

		if(this.eat("[0-9]+(\\.[0-9]+)?[ ]*" + def.expRange + "[ ]*[0-9]+(\\.[0-9]+)?", false, false)){
			tokens.push(this.parseRange());
			continue;
		}

		if(this.eat(def.varName)){
			tokens.push(new VariableToken(this.flushBuffer().substr(1)));
			continue;
		}

		if(this.eat(def.numeric)){
			tokens.push(new NumericToken(parseFloat(this.flushBuffer())));
			continue;
		}

		if(this.eat(def.expOpen)){
			tokens.push(this.parseExpression(def.expClose));
			continue;
		}

		if(this.eat(def.identifier)){
			tokens.push(this.flushBuffer());
			continue;
		}

		if(this.eat(def.lineEnd))
			break;

		if(this.eat(def.comment)){
			this.parseComment();
			break;
		}

		if(this.isEnd())
			break;

		return this.error("Unexpected token");

	}

	return new TokenList(tokens);

};

Parser.prototype.parseVarDefinition = function(){

	this.logToken("var-definition");

	var name, expression = null;
	var ref = this.getRef();
	var type = 0;

	this.eat(def.blank);
	this.eat("@");
	this.clearBuffer();

	if(!this.eat(def.identifier))
		return this.error("Expecting variable name");

	name = this.flushBuffer();

	this.eat(def.blank);

	if(this.eat(def.varAssignment)){
		expression = this.parseExpression('(' + def.lineEnd + '|' + def.comment + ')', false);
		type = 1;
	} else if(this.eat(def.varIncrement)){
		expression = this.parseExpression('(' + def.lineEnd + '|' + def.comment + ')', false);
		type = 2;
	} else if(this.eat(def.varDecrement)){
		expression = this.parseExpression('(' + def.lineEnd + '|' + def.comment + ')', false);
		type = 3;
	} else if(this.eat(def.varMultiply)){
		expression = this.parseExpression('(' + def.lineEnd + '|' + def.comment + ')', false);
		type = 4;
	} else if(this.eat(def.varDivide)){
		expression = this.parseExpression('(' + def.lineEnd + '|' + def.comment + ')', false);
		type = 5;
	}

	this.output.variables[name] = {
		_ref: ref,
		type: type,
		expression: expression
	};

	if(this.isEnd())
		return true;

	if(this.eat(def.comment))
		return this.parseComment();

	if(!this.eat(def.lineEnd))
		return this.error("Expecting line end or variable assigment.");

	return true;

};

Parser.prototype.parseString = function(){

	this.logToken("string");

	this.clearBuffer();

	while(!this.eat(def.stringClose, false)){

		if(this.eat("\\\\", false))
			this.next();

		this.eat(".");

		if(this.isEnd())
			return this.error("Expecting end of string");
		
	}

	return this.flushBuffer();	

};

Parser.prototype.parseRange = function(){

	this.logToken("range");

	var from,to;

	this.clearBuffer();
	if(!this.eat("[0-9]+(\\.[0-9]+)?")) return this.error("Expecting from value");

	from = parseFloat(this.flushBuffer());

	this.eat(def.blank);
	this.clearBuffer();

	if(!this.eat("[ ]*" + def.expRange + "[ ]*")) return this.error("Expecting '-'");

	this.eat(def.blank);
	this.clearBuffer();

	if(!this.eat("[0-9]+(\\.[0-9]+)?")) return this.error("Expecting to value");

	to = parseFloat(this.flushBuffer());

	return new RangeToken(from, to);

};

Parser.prototype.parseExpression = function(endPattern, skipEnd){

	this.logToken("expression");

	var mode = 0;
	var expression = "";
	var separated = false;
	var end = !this.eat(endPattern, true, skipEnd);

	while(!this.eat(endPattern, true, skipEnd)){

		this.clearBuffer();

		//Basic operators
		if(this.eat(def.expOperators)){
			
			if(mode < 1) return this.error("Expecting operand");

			expression+= this.flushBuffer();
			mode = 0;
			continue;

		}

		//Comparators
		if(this.eat(def.expComparators)){
			
			if(mode < 1) return this.error("Expecting operand");

			var cmp = this.flushBuffer();

			if(cmp == "=") cmp = "==";

			expression+= cmp;
			mode = 0;
			continue;

		}

		//Logical operators
		if(this.eat(def.expLogical)){
			
			if(mode < 1) return this.error("Expecting operand");

			var exp = this.flushBuffer().toLowerCase();

			switch(exp){
				case 'and':
				case '&&': expression+="&&"; break;
				case 'or':
				case '||': expression+="||"; break;
			}

			mode = 0;
			continue;

		}

		//Separator
		if(this.eat(",")){
			
			if(expression === "") return this.error("Expecting first condition");

			if(separated)
				expression+=") && (";
			else
				expression = "(" + expression + ") && (";

			separated = true;

			mode = 0;
			continue;

		}

		//Range operand
		if(this.eat('[0-9]+[ ]*' + def.expRange + '[ ]*[0-9]+')){

			if(mode !== 0) return this.error("Unexpected operand");

			var range = this.flushBuffer();
			var delim = range.match(def.expRange);
			var startNum = parseFloat(range.substr(0, delim.index));
			var endNum = parseFloat(range.substr(delim.index + def.expRange.length));

			expression+= '(' + startNum + ' + Math.round(Math.random() * ' + (endNum - startNum) + '))';

			mode = 1;
			continue;

		}

		//Function operand
		if(this.eat(def.expFunction)){

			if(mode !== 0) return this.error("Unexpected function operand");

			var token = this.flushBuffer();
			var name = token.substr(0, token.length - 1).toLowerCase();

			var args = this.parseArguments("\\)");

			expression+= '_fn[' + name + '].call(' + args + ')';
			mode = 1;
			continue;

		}

		//Sub expression open
		if(this.eat(def.expOpen)){

			if(mode !== 0) return this.error("Unexpected operand");

			var subexp = this.parseExpression("\\)");
			expression+= '(' + subexp + ')';
			mode = 1;
			continue;

		}

		//Has item
		if(this.eat(def.expHasItem + " ")){

			if(mode !== 0) return this.error("Unexpected operand");

			var hasItemNo = false;

			this.eat(def.blank);

			if(this.eat(def.expNo)) hasItemNo = true;

			this.eat(def.blank);
			this.clearBuffer();

			if(!this.eat(def.identifier)) return this.error("Expecting item name");

			expression+='_fn["hasItem"].call("' + this.flushBuffer() + '", ' + ( hasItemNo ? "true" : "false" ) + ')';

			mode = 1;
			continue;

		}

		//At node
		if(this.eat(def.expAtNode + " ")){

			if(mode !== 0) return this.error("Unexpected operand");

			var atItemNo = false;

			this.eat(def.blank);

			if(this.eat(def.expNo)) atItemNo = true;

			this.eat(def.blank);
			this.clearBuffer();

			if(!this.eat(def.identifier)) return this.error("Expecting node name");

			expression+='_fn["atNode"].call("' + this.flushBuffer() + '", ' + ( atItemNo ? "true" : "false" ) + ')';

			mode = 1;
			continue;

		}


		//Constants
		if(this.eat(def.expConstants)){

			if(mode !== 0) return this.error("Unexpected operand");

			var constToken = this.flushBuffer().toLowerCase();

			switch(constToken){
				case 'true':  expression+= "1"; break;
				case 'false': expression+= "0"; break;
				case 'null':  expression+= "0"; break;
				default: return this.error("Internal parser error (const not implemented)");
			}

			mode = 1;
			continue;

		}

		//String operand
		if(this.eat(def.stringOpen)){

			if(mode !== 0) return this.error("Unexpected operand");

			expression+= this.parseString();
			mode = 1;
			continue;

		}

		//Percent operand
		if(this.eat("[0-9]+(\\.[0-9]+)?%")){

			if(mode !== 0) return this.error("Unexpected operand");

			var num = this.flushBuffer();
			percent= parseFloat(num.substr(0, num.length - 1));

			expression+= '(Math.round() * 100 < ' + percent + ')';

			mode = 1;
			continue;

		}

		//Numeric operand
		if(this.eat("[0-9]+(\\.[0-9]+)?")){

			if(mode !== 0) return this.error("Unexpected operand");

			expression+= this.flushBuffer();
			mode = 1;
			continue;

		}

		//Dot notation
		if(this.eat(def.expProperty)){

			if(mode !== 2) return this.error("Unexpected dot notation");

			var propName = this.flushBuffer();

			expression+= '["' + propName.substr(1) + '"]';
			mode = 2;
			continue;

		}

		//Old-school local variable operand
		if(this.eat(def.var + " ")){

			if(mode !== 0) return this.error("Unexpected operand");

			this.clearBuffer();
			if(!this.eat(def.identifier)) return this.error("Expecting variable name");

			var _lvarName = this.flushBuffer();

			expression+= 'locals["' + _lvarName + '"]';
			mode = 2;
			continue;

		}

		//Called
		if(this.eat(def.expCalled)){

			if(mode !== 0) return this.error("Unexpected operand");

			expression+= 'locals["_called"]';
			mode = 2;
			continue;

		}

		//Local variable operand
		if(this.eat(def.expLocalVar)){

			if(mode !== 0) return this.error("Unexpected operand");

			var lvarName = this.flushBuffer();

			expression+= 'locals["' + lvarName.substr(1) + '"]';
			mode = 2;
			continue;

		}

		//Global variable operand
		if(this.eat(def.expGlobalVar)){

			if(mode !== 0) return this.error("Unexpected operand");

			var gvarName = this.flushBuffer();

			expression+= 'globals["' + gvarName.substr(1) + '"]';
			mode = 2;
			continue;

		}

		//Blank
		if(this.eat(def.blank))
			continue;

		//End of input
		if(this.isEnd())
			return this.error("Unexpected end of expression");

		return this.error("Unexpected token");

	}

	//Check mode
	if(expression === "") return "Empty expression";
	if(mode < 1) return "Unterminated expression";

	if(separated)
		expression+=")";

	return new Expression(expression);

};

Parser.prototype.parseArguments = function(endPattern){

	this.logToken("arguments");

	var args = [];

	while(true){

		var arg = this.parseExpression("["+ endPattern + "|,]", false);
		args.push(arg);

		if(this.eat(endPattern)) break;
		if(this.eat(",")) continue;
		if(this.eat(def.blank)) continue;

		return this.error("Unexpected token");

	}

	return args;

};

/*
 * Parse shorthand
 *
 * Creates parser and parses source
 *
 * @param string source
 * @return object
 */
Parser.parse = function(source){

	var p = new Parser();
	return p.parse(source);

};

//EXPORT
module.exports = Parser;