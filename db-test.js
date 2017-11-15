const level = require('level')
const ttl = require('level-ttl')
const hooks = require('level-hooks')

const db = ttl(level('./test'), {checkFrequency: 50})

hooks(db)

db.hooks.pre({start: '', end: '~'}, function (change, add) {
	console.log(change)
})

db.put('foo', 'bar', { ttl: 1000 * 6 }, (err) => {
	db.createReadStream().on('data', data => console.log(data))
})
