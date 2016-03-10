/*
 * Lamarr JS
 *
 * @author Jiri Hybek <jiri@hybek.cz>
 * @license See LICENSE file distriubted with this source code.
 */

/*
 * Language token definitions
 */
module.exports = {

	mlCommentOpen: '#\\|',
	mlCommentClose: '\\|#',
	comment: '#',
	lineEnd: '\n',
	blank: '( |\t)+',
	stringOpen: '"',
	stringClose: '"',

	identifier: '[a-zA-Z_0-9]+',
	numeric: '[0-9]+(\\.[0-9]+)?',

	varName: '@[a-zA-Z0-9_]+',
	varAssignment: ':=',
	varIncrement: '\\+=',
	varDecrement: '-=',
	varMultiply: '\\*=',
	varDivide: '\\/=',
	
	expOperators: '[\\+\\-\\*\\/]+',
	expComparators: '(>=|<=|>|<|==|\\!=|=)',
	expLogical: '(&&|\\|\\||or|OR|and|AND)',
	expFunction: '[a-zA-Z0-9_]+\\(',
	expLocalVar: '\\$[a-zA-Z0-9_]+',
	expGlobalVar: '@[a-zA-Z0-9_]+',
	expProperty: '\\.[a-zA-Z0-9_]+',
	expConstants: '(true|TRUE|false|FALSE|null|NULL)',
	expOpen: '\\(',
	expClose: '\\)',
	expArgDelimiter: '(\\,|\\))',
	expRange: 'to',
	expHasItem: 'hasitem',
	expAtNode: 'atnode',
	expNo: 'no',
	expCalled: 'called',

	var: "var",
	start: "start",
	node: "node",
	property: "property",
	path: "path",
	action: "action",
	pick: "pick",
	check: "check",
	use: "use",
	lay: "lay",
	resources: "resource(s)?",
	location: "location",
	boring: "boring",

	condFirst: "first",

	sectionNodes: "nodes",
	sectionVars: "vars",
	sectionProperties: "properties",
	sectionActions: "actions",
	sectionMap: "map",
	sectionItem: "item",
	sectionMod: "mod",
	sectionBoring: "boring"

};