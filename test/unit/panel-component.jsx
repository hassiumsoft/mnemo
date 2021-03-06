/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */

const React = require('react');
const {configure, shallow} = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');

// Configure Enzyme
configure({adapter: new Adapter()});
chai.use(chaiEnzyme());

const {expect} = chai;

const PanelComponent = require('../../lib/panel-component.jsx');

describe('<PanelComponent/>', () => {
	it('renders .panel', () => {
		const panel = shallow(<PanelComponent parts={{}}/>);
		expect(panel).to.have.length(1);
		expect(panel).to.have.className('panel');
	});

	it('renders blocks with specified parts', () => {
		const panel = shallow(
			<PanelComponent
				parts={{
					wireI: 10,
					wireL: 30,
				}}
			/>
		);

		expect(panel.children()).to.have.length(2);

		expect(panel.childAt(0)).to.have.className('block');
		expect(panel.childAt(0)).to.have.prop('data-type', 'wireI');
		expect(panel.childAt(0).find('.count')).be.present();
		expect(panel.childAt(0).find('.count')).to.have.text('10');

		expect(panel.childAt(1)).to.have.className('block');
		expect(panel.childAt(1)).to.have.prop('data-type', 'wireL');
		expect(panel.childAt(1).find('.count')).be.present();
		expect(panel.childAt(1).find('.count')).to.have.text('30');
	});

	it('renders null blocks as Infinity', () => {
		const panel = shallow(
			<PanelComponent
				parts={{
					wireI: null,
				}}
			/>
		);

		expect(panel.find('.block').first()).to.have.prop('data-type', 'wireI');
		expect(panel.find('.block').first().find('.count')).to.have.text('∞');
	});

	it('marks first block as selected', () => {
		const panel = shallow(
			<PanelComponent
				parts={{
					wireI: 10,
				}}
			/>
		);

		expect(panel).to.have.state('selected', 'wireI');
		expect(panel.find('.block').first()).to.have.attr('data-selected', 'data-selected');
	});

	describe('#push', () => {
		it('pushes block to panel', () => {
			const panel = shallow(
				<PanelComponent
					parts={{
						wireI: 10,
					}}
				/>
			);

			panel.instance().push('wireI');
			expect(panel.state('parts').get('wireI')).to.equal(11);
		});

		it('pushes new block to panel', () => {
			const panel = shallow(
				<PanelComponent
					parts={{
						wireI: 10,
					}}
				/>
			);

			panel.instance().push('wireL');
			expect(panel.state('parts').get('wireI')).to.equal(10);
			expect(panel.state('parts').get('wireL')).to.equal(1);
		});

		it('remains Infinity blocks as Infinity', () => {
			const panel = shallow(
				<PanelComponent
					parts={{
						wireI: null,
					}}
				/>
			);

			panel.instance().push('wireI');
			expect(panel.state('parts').get('wireI')).to.be.null;
		});
	});

	describe('#take', () => {
		it('takes blocks from parts', () => {
			const panel = shallow(
				<PanelComponent
					parts={{
						wireI: 10,
					}}
				/>
			);

			panel.instance().take('wireI');
			expect(panel.state('parts').get('wireI')).to.equal(9);
		});

		it('erases last block when taken', () => {
			const panel = shallow(
				<PanelComponent
					parts={{
						wireI: 1,
					}}
				/>
			);

			panel.instance().take('wireI');
			expect(panel.state('parts').has('wireI')).to.be.false;
		});

		it('remains Infinity blocks as Infinity', () => {
			const panel = shallow(
				<PanelComponent
					parts={{
						wireI: null,
					}}
				/>
			);

			panel.instance().take('wireI');
			expect(panel.state('parts').get('wireI')).to.be.null;
		});
	});

	describe('#onClickBlock', () => {
		it('switches selected block as clicked', () => {
			const panel = shallow(
				<PanelComponent
					parts={{
						wireI: null,
						wireL: null,
					}}
				/>
			);

			expect(panel).to.have.state('selected', 'wireI');
			expect(panel.childAt(0)).to.have.attr('data-selected', 'data-selected');

			const mockedEvent = {
				target: {
					getAttribute: () => 'wireL',
				},
			};
			panel.childAt(1).simulate('click', mockedEvent);

			expect(panel).to.have.state('selected', 'wireL');
			expect(panel.childAt(1)).to.have.attr('data-selected', 'data-selected');
		});
	});
});
