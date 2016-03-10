/*
 * Lamarr JS
 *
 * @author Jiri Hybek <jiri@hybek.cz>
 * @license See LICENSE file distriubted with this source code.
 */

var def = require("./langdef.js");

/*
 * Parser exceptions
 *
 * @param Parser parser
 * @param string message
 * @param integer offset (optional)
 */
var ParserException = function(parser, message, offset){

	var index = parser.index+= (offset || 0);

	this.name = "ParserException";
	this.message = message + " at '" + parser.source.substr(0, index) + ">>>" + parser.source.substr(index, 1) + "<<<" + parser.source.substr(index + 1) + "'.";
	this.source = parser.source;

};

ParserException.prototype = Object.create(Error.prototype);

/*
 * Parser library
 */
var Parser = function(){

	this.source = null;

	this.tokenizer = null;
	this.tokenizerCb = null;
	this.context = null;
	this.stack = null;

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

Parser.prototype.begin = function(tokenizer, context, cb){

	if(this.tokenizer)
		this.stack.push({
			t: this.tokenizer,
			c: this.context,
			b: this.tokenizerCb
		});

	this.tokenizer = tokenizer;
	this.context = context || {};
	this.tokenizerCb = cb;

	return true;

};

Parser.prototype.end = function(){

	if(this.stack.length === 0)
		return this.error("Not in scope");

	if(this.tokenizerCb)
		this.tokenizerCb(this.context, this.buffer);

	var prev = this.stack.pop();

	this.tokenizer = prev.t;
	this.context = prev.c;
	this.tokenizerCb = prev.b;

	return true;

};

Parser.prototype.error = function(message, offset){

	throw new ParserException(this, message, offset);

};

Parser.prototype.debug = function(){
	console.log("---- Char: " + this.index + " ----");
	console.log(this.source.substr(0, this.index) + ">>>" + this.source.substr(this.index, 1) + "<<<" + this.source.substr(this.index + 1));
	console.log("----");
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
		"nodes": {},
		"edges": {},
		"entities": {},
		"conds": {},
		"modifiers": {}
	};

	//Set default tokenizer
	this.begin(Parser.RootTokenizer);

	//Go until end
	while(this.index < this.source.length){

		var r = this.tokenizer.call(this, this.context);

		if(r !== true)
			return this.error(r || "Unexpected token");

	}

	if(this.stack.length > 0)
		this.end();

	if(this.stack.length > 0)
		return this.error("Unexpected end of input");

	return this.output;

};

/*
 *
 * Tokenizers
 *
 */
Parser.RootTokenizer = function(ctx){

	//Multiline comment
	if(this.eat(def.mlCommentOpen))
		return this.begin(Parser.MultilineCommentTokenizer);

	//Single line comment
	if(this.eat(def.comment))
		return this.begin(Parser.CommentTokenizer);

	if(this.eat(def.sectionNodes))
		return this.begin(Parser.NodesTokenizer);

	//Blank line
	if(this.eat(def.blank))
		return true;

};

Parser.CommentTokenizer = function(ctx){

	if(this.eat(def.lineEnd)){
		return this.end();
	} else {
		return this.next();
	}

};

Parser.MultilineCommentTokenizer = function(ctx){

	if(this.eat(def.mlCommentClose)){
		return this.end();
	} else {
		return this.next();
	}

};

Parser.StringTokenizer = function(ctx){

	if(!ctx.contents) ctx.contents = "";

	if(this.eat("\\\\", false))
		return this.next();

	if(this.eat(def.stringClose, false))
		return this.end();

	return this.eat(".");

};

Parser.VarDeclarationTokenizer = function(ctx){

	this.clearBuffer();

	//Get name
	if(!ctx.name && this.eat(def.varName)){		
		ctx.name = this.flushBuffer();
		return true;
	}

	//Assign and get expression
	if(ctx.name && !ctx.assignment && this.eat(def.varAssignment)){

		ctx.assignment = true;

		return this.begin(Parser.ExpressionTokenizer, {}, function(ectx){
			ctx.expression = ectx.expression;
		});

	}

	//Line end
	if(ctx.name && this.eat(def.lineEnd))
		return this.end();

	//Blank
	if(this.eat(def.blank))
		return true;

	if(!ctx.name) return "Expecting variable name";
	if(!ctx.assignment) return "Expecting variable assignment";
	if(!ctx.expression) return "Expecting expression";

};

Parser.ExpressionTokenizer = function(ctx){

	if(ctx.expression === undefined) ctx.expression = "";
	if(ctx.mode === undefined) ctx.mode = 0;

	this.clearBuffer();

	//Basic operators
	if(this.eat(def.expOperators)){
		
		if(ctx.mode < 1) return "Expecting operand";

		ctx.expression+= this.getBuffer();
		ctx.mode = 0;
		return true;

	}

	//Function operand
	if(this.eat(def.expFunction)){

		if(ctx.mode !== 0) return "Unexpected operand";

		var fnName;
		var argCount;
		var token = this.getBuffer();
		var name = token.substr(0, token.length - 1).toLowerCase();

		switch(name){
			case 'min': fnName = "Math.min"; break;
			case 'max': fnName = "Math.max"; break;
			case 'abs': fnName = "Math.abs"; argCount = 1; break;
			case 'pow': fnName = "Math.pow"; argCount = 2; break;
			case 'callmod': fnName = "helpers.callmod"; break;
			default: return "Undefined function '" + name + "'";
		}

		return this.begin(Parser.ExpressionArgsTokenizer, { _fnName: fnName, argcount: argCount }, function(_ctx){
			ctx.expression+= _ctx._fnName + "(" + _ctx.args.join(",") + ")";
			ctx.mode = 1;
		});

	}

	//Sub expression open
	if(this.eat(def.expOpen)){

		if(ctx.mode !== 0) return "Unexpected operand";

		return this.begin(Parser.ExpressionTokenizer, { sub: true }, function(_ctx){
			ctx.expression+= "(" + _ctx.expression + ")";
			ctx.mode = 1;
		});

	}

	//Constants
	if(this.eat(def.expConstants)){

		if(ctx.mode !== 0) return "Unexpected operand";

		var constToken = this.getBuffer().toLowerCase();

		switch(constToken){
			case 'true': ctx.expression+= "1"; break;
			case 'false': ctx.expression+= "0"; break;
			case 'null': ctx.expression+= "0"; break;
			default: return "Internal parser error (const not implemented)";
		}

		ctx.mode = 1;

	}

	//Numeric operand
	if(this.eat("[0-9]+(\.[0-9]+)?")){

		if(ctx.mode !== 0) return "Unexpected operand";

		ctx.expression+= this.getBuffer();
		ctx.mode = 1;
		return true;

	}

	//Dot notation
	if(this.eat(def.expProperty)){

		if(ctx.mode !== 2) return "Unexpected dot notation";

		var propName = this.getBuffer();

		ctx.expression+= '["' + propName.substr(1) + '"]';
		ctx.mode = 2;
		return true;

	}

	//Local variable operand
	if(this.eat(def.expLocalVar)){

		if(ctx.mode !== 0) return "Unexpected operand";

		var lvarName = this.getBuffer();

		ctx.expression+= 'locals["' + lvarName.substr(1) + '"]';
		ctx.mode = 2;
		return true;

	}

	//Global variable operand
	if(this.eat(def.expGlobalVar)){

		if(ctx.mode !== 0) return "Unexpected operand";

		var gvarName = this.getBuffer();

		ctx.expression+= 'globals["' + gvarName + '"]';
		ctx.mode = 2;
		return true;

	}

	//Subexpression end
	if(ctx.sub && this.eat(( ctx.expClose ? ctx.expClose : def.expClose ), false, ( ctx.skipClose === false ? false : true ))){

		if(ctx.mode < 1) return "Unterminated expression";
		return this.end();
		
	}

	//End
	if(!ctx.sub && this.eat(def.lineEnd, false, false)){

		if(ctx.expression === "") return "Empty expression";
		if(ctx.mode < 1) return "Unterminated expression";

		ctx.fn = 'function(locals, globals, helpers){return ' + ctx.expression + ';}';

		return this.end();

	}

	//Blank
	if(this.eat(def.blank))
		return true;

};

Parser.ExpressionArgsTokenizer = function(ctx){

	if(ctx.args === undefined){

		ctx.args = [];

		return this.begin(Parser.ExpressionTokenizer, { sub: true, skipClose: false, expClose: def.expArgDelimiter }, function(_ctx){
			ctx.args.push(_ctx.expression);
		});

	}

	if(this.eat(def.expClose)){

		if(ctx.argcount !== undefined && ctx.argcount != ctx.args.length)
			return "Expecting {" + ctx.argcount + "} arguments";

		return this.end();
	}

	if(this.eat(def.expArgDelimiter)){

		if(ctx.args.length === 0) return "Expecting argument expression.";

		this.begin(Parser.ExpressionTokenizer, { sub: true, skipClose: false, expClose: def.expArgDelimiter }, function(_ctx){
			ctx.args.push(_ctx.expression);
		});

	}

	//Blank
	if(this.eat(def.blank))
		return true;

};

Parser.NodesTokenizer = function(ctx){

	this.clearBuffer();

	if(ctx.mode < 1 && this.eat(def.lineEnd)){
		ctx.mode = 1;
		return this.begin(Parser.NodesRecordTokenizer);
	}

	if(ctx.mode > 0 && this.eat(def.lineEnd)){
		return this.end();
	}

	if()

	//Blank
	if(this.eat(def.blank))
		return true;

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