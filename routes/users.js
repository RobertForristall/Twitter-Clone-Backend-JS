var express = require('express')
var router = express.Router()
const db = require('../db_connection')
const jwt = require('jsonwebtoken')
const sha256 = require('crypto-js').SHA256
const funs = require('../functions')

router.route('/signup').post((req, res) => {

    Object.keys(req.body).forEach(key => {
        if (typeof(req.body[key]) === typeof('') && req.body[key].length === 0){
            return res.status(400).json(`Error: ${String.toString(key)} field is missing.`)
        }
    })

    if (req.body.is_verified !== true) return res.status(400).json('Error: User did not verify email address')
    
    query_string = `
        insert into Users (email, name, dob, is_verified, pass)
        values ("${req.body.email}", "${req.body.name}", "${req.body.dob}", ${req.body.is_verified}, "${req.body.pass}");
    `

    db.query(query_string, (err, results, fields) => {
        if (err) {
            console.log(err)
            return res.status(400).json(err)
        }

        res.set('Content-Type', 'application/json')
        res.json("User added!")
    })

})

router.route('/sendVerification/:email').get((req, res) => {

    query_string = `select count(*) from Users where email = "${req.params.email}"`

    db.query(query_string, (err, results, fields) => {
        if (err) return res.status(400).json(err)
        
        if (results[0]['count(*)'] !== 0) return res.status(400).json('Error: There is already an account associated with that email.')

        res.set('Content-Type', 'application/json')
        //res.json(funs.sendVerificationEmail())
        res.json('Email veriifcation sent!')
    })

})

router.route('/login').post((req, res) => {

    query_string = `select name, dob from Users where email = "${req.body.email}" and pass = "${req.body.pass}";`

    db.query(query_string, (err, results, fields) => {
        if (err) return res.status(400).json(err)
        if (results[0] === undefined) return res.status(400).json('Invalid Login Credentials! Please try again.')

        token = jwt.sign({data: req.body.email}, process.env.SECRET_KEY, {expiresIn: '1h'})

        res.set('Content-Type', 'application/json')
        res.json({
            token: token,
            email: req.body.email,
            name: results[0].name,
            dob: results[0].dob
        })

    })

})

module.exports = router