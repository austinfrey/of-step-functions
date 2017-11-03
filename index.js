const OpenFaaS = require('openfaas')
const level = require('level')
const ttl = require('level-ttl')
const hooks = require('level-hooks')

const stateJSON = require('./state.json')
const {task, wait, parallel} = require('./step-functions')

require('net').createServer().listen();

const openfaas = OpenFaaS('http://localhost:8080') // TODO should pull form ENV?
const db = ttl(level('./db', {valueEncoding: 'json'}), {checkFrequency: 50})

hooks(db)

db.hooks.post('!ttl!Wait', async(change) => {
	if(change.type === 'del') {
		try {
			const state = await db.get('NextState')
			const data = await db.get('NextData')
			await triggerFunction(state, data, false)
		} catch(err) {
			console.log(err)
		}
	}
})

runStepFunction()
	.catch(console.log)

async function runStepFunction() {
	const startAt = stateJSON.StartAt
	const states = stateJSON.States
	const firstState = states[startAt]

	await triggerFunction(firstState)
}

async function triggerFunction(state, data, isDone) {
	if(isDone) {
		return console.log(data)
	}
	await chooseStateType(state, data)
}

async function chooseStateType(state, data) {
	const type = state.Type
	const stateTypes = {
		  'Task': task
		, 'Wait': wait
		, 'Parallel': parallel
	}
	return await stateTypes[type](state, data, db, next)
}

async function next(state) {
	const next = state['Next']
	const nextState = stateJSON.States[next]
	const data = await db.get('NextData')

	await triggerFunction(nextState, data, !!state['End'])
}

