var express = require('express')
var router = express.Router()
const db = require('../db_connection')
const jwt = require('jsonwebtoken')
const sha256 = require('crypto-js').SHA256
const funs = require('../functions')

router.route('/signup').post((req, res, next) => {

    Object.keys(req.body).forEach(key => {
        if (typeof(req.body[key]) === typeof('') && req.body[key].length === 0){
            return res.send(400, {msg: `Error: ${String.toString(key)} field is missing.`})
        }
    })

    if (req.body.is_verified !== true) return res.sendStatus(400).json('Error: User did not verify email address')
    
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
        res.json('User Added!')
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

    query_string = `select name, dob, user_id from Users where email = "${req.body.email}" and pass = "${req.body.pass}";`

    db.query(query_string, (err, results, fields) => {
        if (err) return res.status(400).json(err)
        if (results[0] === undefined) return res.status(400).json('Invalid Login Credentials! Please try again.')

        console.log(results[0])

        token = jwt.sign({data: req.body.email}, process.env.SECRET_KEY, {expiresIn: '1h'})
        refresh_token = jwt.sign({data: req.body.email}, process.env.REFRESH_KEY, {expiresIn: '1d'})

        res.set('Content-Type', 'application/json')
        res.cookie('jwt', refresh_token, {httpOnly: true, sameSite: 'None', secure: true, maxAge: 24*60*60*1000})
        res.json({
            token: token,
            email: req.body.email,
            name: results[0].name,
            dob: results[0].dob,
            user_id: results[0].user_id
        })

    })

})

router.route('/delete/:id').delete((req, res) => {
    query_string = `delete from Users where user_id=${req.params.id};`

    db.query(query_string, (err, results, fields) => {
        if (err) console.log(err)

        res.set('Content-Type', 'application/json')
        res.json('User deleted')
    })
})

module.exports = router