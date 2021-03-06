const EventEmitter = require('events');
const Data = require('./data');
const PassEvent = require('./pass-event');

class Block extends EventEmitter {
	constructor(config) {
		super();
		this.rotate = config.rotate || 0;
		this.name = config.name;
		this.config = config;
		this.inputExists = false; // indicates whether self has input
		this.outputExists = false; // indicates whether self has anything as output now
		this.inputQueues = new Map([
			['top', []],
			['left', []],
			['right', []],
			['bottom', []],
		]);

		this.outputQueues = new Map([
			['top', []],
			['left', []],
			['right', []],
			['bottom', []],
		]);
		if (this.config.type === 'wire' || this.config.type === 'calc') {
			this.rotatedPlugs = this.config.io.plugs.map((direction) => this.rotatedDirection(direction));
		} else if (this.config.type === 'wireF') {
			this.rotatedFlow = {};
			const directions = ['top', 'right', 'bottom', 'left'];
			directions.forEach((from) => {
				if (this.config.io.flow[from]) {
					this.rotatedFlow[this.rotatedDirection(from)] =
						this.config.io.flow[from].map((to) => this.rotatedDirection(to));
				}
			});
		}
	}

	rotatedDirection(direction) {
		if (!this.config.rotatable) {
			return direction;
		}

		const directions = ['top', 'right', 'bottom', 'left'];
		return directions[(directions.indexOf(direction) + this.rotate) % 4];
	}

	input(position, data) {
		this.inputExists = true;
		this.inputQueues.get(position).push(data);
		this.emit('get', {direction: position, data});
	}

	step() {
		this.inputExists = false;

		switch (this.config.type) {
			case 'empty': {
				// Erase all data passed to the empty block
				for (const queue of this.inputQueues.values()) {
					while (queue.length) {
						const data = queue.shift();
						this.emit('reject', data);
					}
				}
				break;
			}
			case 'wire': {
				for (const [source, queue] of this.inputQueues.entries()) {
					// When data exists in pluged direction
					if (queue.length === 0) {
						continue;
					}
					if (this.rotatedPlugs.includes(source)) {
						const destinations = this.rotatedPlugs.filter((direction) => direction !== source);
						const data = queue.shift();

						// pass through
						const input = new Map([[source, data]]);

						const output = new Map();
						destinations.forEach((direction) => {
							const outData = new Data(data.value);
							this.outputQueues.get(direction).push(outData);
							output.set(direction, outData);
						});

						this.emit('pass', new PassEvent({in: input, out: output}));
						this.outputExists = true;
					} else {
						// Erase data when data exists in non-pluged direction
						while (queue.length) {
							const data = queue.shift();
							this.emit('reject', data);
						}
					}
				}
				break;
			}
			case 'calc': {
				for (const [source, queue] of this.inputQueues.entries()) {
					// When data exists in pluged direction
					if (queue.length !== 0 && this.rotatedPlugs.includes(source)) {
						const destinations = this.rotatedPlugs.filter((direction) => direction !== source);
						const data = queue.shift();

						// Calculate and pass through
						const input = new Map([[source, data]]);

						const output = new Map();
						destinations.forEach((direction) => {
							const value = this.config.func(data.value);
							const outData = new Data(isNaN(value) ? 0 : value);
							this.outputQueues.get(direction).push(outData);
							output.set(direction, outData);
						});

						this.emit('pass', new PassEvent({in: input, out: output}));
						this.outputExists = true;
					}

					// Erase data when data exists in non-pluged direction
					if (!this.rotatedPlugs.includes(source)) {
						while (queue.length) {
							const data = queue.shift();
							this.emit('reject', data);
						}
					}
				}
				break;
			}
			case 'calc2': {
				const sources = this.config.io.in.map((direction) => this.rotatedDirection(direction));
				const destination = this.rotatedDirection(this.config.io.out);

				// Execute calculation when all inputs are satisfied
				if (sources.every((source) => this.inputQueues.get(source).length > 0)) {
					const datas = [];

					// Calculate and pass through
					const input = new Map();
					sources.forEach((source) => {
						const data = this.inputQueues.get(source).shift();
						input.set(source, data);
						datas.push(data);
					});

					const value = this.config.func(...datas.map((data) => data.value));
					const outData = new Data(isNaN(value) ? 0 : value);
					this.outputQueues.get(destination).push(outData);
					const output = new Map([[destination, outData]]);

					this.emit('pass', new PassEvent({in: input, out: output}));
					this.outputExists = true;
				}

				// Erase data when data exists in non-pluged direction
				for (const [source, queue] of this.inputQueues.entries()) {
					if (!sources.includes(source)) {
						while (queue.length) {
							const data = queue.shift();
							this.emit('reject', data);
						}
					}
				}
				break;
			}
			case 'calc-switch': {
				const sources = this.config.io.in.map((direction) => (
					this.rotatedDirection(direction)
				));
				const destinations = this.config.io.out.map((direction) => (
					this.rotatedDirection(direction)
				));

				// Execute calculation when all inputs are satisfied
				if (sources.every((source) => this.inputQueues.get(source).length > 0)) {
					const datas = [];

					// Calculate and pass through
					const input = new Map();
					sources.forEach((source) => {
						const data = this.inputQueues.get(source).shift();
						input.set(source, data);
						datas.push(data);
					});

					const values = datas.map((data) => data.value);
					const {directionIndex, value} = this.config.func(...values);

					const data = new Data(isNaN(value) ? 0 : value);
					const destination = destinations[directionIndex];
					this.outputQueues.get(destination).push(data);
					const output = new Map([[destination, data]]);

					this.emit('pass', new PassEvent({in: input, out: output}));
					this.outputExists = true;
				}

				// Erase data when data exists in non-pluged direction
				for (const [source, queue] of this.inputQueues.entries()) {
					if (!sources.includes(source)) {
						while (queue.length) {
							const data = queue.shift();
							this.emit('reject', data);
						}
					}
				}
				break;
			}
			case 'wireF': {
				for (const [source, queue] of this.inputQueues.entries()) {
					if (queue.length === 0) {
						continue;
					}

					if (this.rotatedFlow[source]) {
						// When data exists in the starting direction of some flow
						const destinations = this.rotatedFlow[source];
						const data = queue.shift();

						const input = new Map([[source, data]]);
						const output = new Map();

						destinations.forEach((direction) => {
							const outData = new Data(data.value);
							this.outputQueues.get(direction).push(outData);
							output.set(direction, outData);
						});

						this.emit('pass', new PassEvent({in: input, out: output}));
						this.outputExists = true;
					} else {
						// Erase data otherwise
						while (queue.length) {
							const data = queue.shift();
							this.emit('reject', data);
						}
					}
				}
				break;
			}
		}
	}

	hand() {
		this.outputExists = false;

		for (const [direction, queue] of this.outputQueues.entries()) {
			while (queue.length) {
				const data = queue.shift();
				this.emit('put', {direction, data});
			}
		}
	}

	clearData() {
		// Erase data when data exists in non-pluged direction
		[this.inputQueues, this.outputQueues].forEach((queues) => {
			for (const queue of queues.values()) {
				while (queue.length) {
					const data = queue.shift();
					this.emit('reject', data);
				}
			}
		});
	}
}

module.exports = Block;
