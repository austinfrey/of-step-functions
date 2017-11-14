const stateJSON = require('./state.json')

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
		queue.push(parallelQueue)
	}
	queue.push(state)
	if (!state || state.End) return
	return addToQueue(startJSON, state.Next, queue)
}

function processQueue(queue) {
	const state = queue.shift()
	if (state.End) {
		return console.log('END: Processed', state.Resource)
	}
	console.log('Processed', state.Resource || state.Type)
	processQueue(queue)
}

console.log(buildQueue(stateJSON, 'Hello World')[3][0])


//processQueue(queue)
