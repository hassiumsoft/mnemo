module.exports = {
	name: 'sqrt-hard',
	version: 4,
	parts: {
		wireI: null,
		wireL: null,
		wireT: null,
		wireX: null,
		'times-2': null,
		'times-3': null,
		'div-2': null,
		'div-3': null,
		'plus-1': null,
		'plus-2': null,
		'minus-1': null,
		'minus-2': null,
		'const-0': null,
		'const-1': null,
		'const-2': null,
		add: null,
		sub: null,
		div: null,
		mul: null,
		mod: null,
		pow: null,
		'bitshift-left': null,
		'bitshift-right': null,
		'bitwise-and': null,
		'bitwise-or': null,
		'bitwise-xor': null,
		equal: null,
		neq: null,
		gt: null,
		geqq: null,
		lt: null,
		leqq: null,
		conditional: null,
		transistor: null,
		diode: null,
	},
	inputX: 7,
	outputX: 7,
	input: [9, null, null, 26040609],
	output: [3, null, null, 5103],
	ioGenerator: (random) => {
		const out1 = 3;
		const out2 = 10 + Math.floor(random() * 90);
		const out3 = 1000 + Math.floor(random() * 4000);
		const out4 = 5103;

		return {
			input: [
				out1 * out1,
				out2 * out2,
				out3 * out3,
				out4 * out4,
			],
			output: [
				out1,
				out2,
				out3,
				out4,
			],
		};
	},
	width: 15,
	height: 15,
	clockLimit: 1000,
	statement: '平方根を計算してみよう! (ただし、愚直に計算すると計算に長い時間かかるので、より速く計算できるように工夫してみよう)',
	title: '平方根 -hard-',
};
