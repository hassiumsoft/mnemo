module.exports = {
	name: 'make-minus-one-hard',
	version: 3,
	parts: {
		wireI: null,
		wireL: null,
		wireT: null,
		wireX: null,
		'plus-1': null,
		equal: null,
		add: null,
		'c-contact': null,
		conditional: null,
		transistor: null,
		diode: null,
	},
	inputX: 3,
	outputX: 3,
	input: [
		3,
		5,
		2,
	],
	output: [
		2,
		4,
		1,
	],
	width: 7,
	height: 9,
	clockLimit: 500,
	statement: '入力の値から1引いた値を出力してみよう!',
	title: '-1を作ろう -hard-',
};
