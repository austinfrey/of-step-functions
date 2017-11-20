'use strict'

const {buildQueue} = require('./queue')
const db = require('./db.js')
const stateJSON = require('./state.json')

const queue = buildQueue(stateJSON, stateJSON.StartAt)

storeState(queue)

processQueue()

async function processQueue(queue = await db.get) {
	const queue = await db.get('Queue')
	const state = queue.shift()
	if (state.End) {
		return console.log('END: Processed', state.Resource)
	}
	if (state.Type === 'Parallel') {
		state.Branches.forEach(branchQueue => {
			console.log('in for loop')
			return processQueue(branchQueue)
		})
	}
	console.log('Processed', state.Resource || state.Type)
	return processQueue(queue)
}

async function storeState(queue) {
	await db.put('Queue', queue)
}

