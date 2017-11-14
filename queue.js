'use strict'

module.exports = {
	  buildQueue
	, processQueue
}

function buildQueue(startJSON, startAt) {
	const queue = []

	addToQueue(startJSON, startAt, queue)
	return queue
}

function addToQueue(startJSON, startAt, queue) {
	const state = startJSON.States[startAt]

	if (state.Type === 'Parallel') {
		const parallelQueue = state.Branches.map(branch => {
			return buildQueue(branch, branch.StartAt)
		})
		queue.push({
			  'Type': 'Parallel'
			, 'Branches': parallelQueue
			, 'Next': state.Next
		})
	}

	if (state.Type !== 'Parallel') {
		queue.push(state)
	}

	if (!state || state.End) {
		return
	}
	return addToQueue(startJSON, state.Next, queue)
}

function processQueue(queue) {
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


//console.log(buildQueue(stateJSON, 'Hello World'))
//const queue = buildQueue(stateJSON, 'Hello World')
//processQueue(queue)
