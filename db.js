'use strict'

const level = require('level')
const ttl = require('level-ttl')
const hooks = require('level-hooks')

const db = ttl(level('./db', {valueEncoding: 'json'}), {checkFrequency: 50})

module.exports = db
