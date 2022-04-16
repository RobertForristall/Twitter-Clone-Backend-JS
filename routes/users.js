var express = require('express')
var router = express.Router()
const db = require('../db_connection')
const jwt = require('jsonwebtoken')
//const sha256 = require('crypto')
const funs = require('../functions')

router.route('/signup').post((req, res) => {

})

router.route('/sendVerification').get((req, res) => {

})

module.exports = router