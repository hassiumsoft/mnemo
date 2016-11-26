const assert = require('assert');
const express = require('express');
const router = express.Router();

const Stages = require('../models/stage');
const Submissions = require('../models/submission');

const {validateSubmission, calculateScore} = require('../../lib/validator');
const stageData = require('../../stages');

router.get('/', (req, res) => {
	Stages.findAll().then((stages) => {
		res.json(stages);
	});
});

router.get('/:stage', (req, res) => {
	const stageName = req.params.stage;

	Stages.findOne({
		where: {
			name: stageName,
		},
	}).then((stage) => {
		if (stage === null) {
			res.status(404).json({
				error: true,
				message: 'not found',
			});
		} else {
			res.json(stage);
		}
	});
});

router.get('/:stage/submissions', (req, res) => {
	const stageName = req.params.stage;

	Submissions.findAll({
		include: [{
			model: Stages,
			where: {name: stageName},
		}],
		order: [
			['score', 'DESC'],
			['createdAt', 'ASC'],
		],
		limit: 20,
	}).then((submissions) => {
		const data = submissions.map((submission) => ({
			name: submission.name,
			score: submission.score,
			blocks: submission.blocks,
			clocks: submission.clocks,
		}));

		res.json(data);
	});
});

router.post('/:stage/submissions', (req, res) => {
	const stageName = req.params.stage;

	Promise.all([
		Stages.findOne({
			where: {
				name: stageName,
			},
		}),
		Submissions.findOne({
			where: {
				name: req.body.name,
			},
			include: [{
				model: Stages,
				where: {
					name: stageName,
				},
			}],
			order: [
				['score', 'DESC'],
			],
		}),
	]).then(([stage, existingSubmission]) => {
		const submissionData = req.body;

		if (stage === null) {
			res.status(404).json({
				error: true,
				message: 'stage not found',
			});
		} else {
			submissionData.stage = stageName;

			const {pass, message, blocks, clocks} = validateSubmission(submissionData);

			if (!pass) {
				res.status(400).json({
					error: true,
					message,
				});
				return;
			}

			const stageDatum = stageData.find((s) => s.name === stageName);

			const score = calculateScore({
				clocks,
				blocks,
				stage: stageDatum,
			});

			if (existingSubmission) {
				if (score <= existingSubmission.score) {
					res.status(400).json({
						error: true,
						message: 'The user name is existing',
					});
					return;
				}

				Submissions.update({
					name: req.body.name,
					board: JSON.stringify(req.body.board),
					score,
					blocks,
					clocks,
					stageId: stage.id,
				}, {
					where: {
						name: req.body.name,
						stageId: stage.id,
					},
				}).then(([count]) => {
					assert.strictEqual(count, 1);
					return Submissions.findOne({
						where: {
							name: req.body.name,
							stageId: stage.id,
						},
					});
				}).then((submission) => {
					res.json(submission);
				}).catch((error) => {
					res.status(500).json({
						error: true,
						message: error.message,
					});
				});
			} else {
				// If no previous submission is existing
				Submissions.create({
					name: req.body.name,
					board: JSON.stringify(req.body.board),
					score,
					blocks,
					clocks,
					stageId: stage.id,
				}).then((submission) => {
					res.json(submission);
				}).catch((error) => {
					res.status(500).json({
						error: true,
						message: error.message,
					});
				});
			}
		}
	});
});

module.exports = router;
