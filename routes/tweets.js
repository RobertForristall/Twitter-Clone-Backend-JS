var express = require('express')
var router = express.Router()
const db = require('../db_connection')
const jwt = require('jsonwebtoken')
const fun = require('../functions')

router.route('/:id').get(fun.AuthenticateToken, (req, res) => {
    query_string = `
    select T.*, U.email from Tweets T, Users U where U.user_id=T.user_id;
    select tweet_id from Likes where user_id=${req.params.id};
    select tweet_id from Retweets where user_id=${req.params.id};
    `

    db.query(query_string, (err, results, fields) => {
        if (err){
            console.log(err)
            return res.status(400).json(err)
        }

        res.set('Content-Type', 'application/json')
        res.json(results)
    })
})

router.route('/add').post(fun.AuthenticateToken, (req, res) => {

    Object.keys(req.body.tweet).forEach(key => {
        if (typeof(req.body.tweet[key]) == typeof('') && req.body.tweet[key].length === 0 && key !== 'msg'){
            return res.status(400).json(`Error: ${String.toString(key)} field is empty...`)
        }
        if (typeof(req.body.tweet[key]) == typeof(0) && req.body.tweet[key] < 0){
            return res.status(400).json(`Error: ${String.toString(key)} field is a negative number...`)
        }
    })

    query_string_test = fun.queryInsertGenerator(req.body.tweet, "Tweets")
    console.log(query_string_test)

    //console.log(query_string)

    db.query(query_string_test, (err, results, fields) => {
        if (err) {
            console.log(err)
            return res.status(400).json(err)
        }

        res.set("Content-Type", 'application/json')
        res.json("Tweet Added!")
    })
})

router.route('/delete/:id').delete(fun.AuthenticateToken, (req, res) => {

    query_string = `
    delete from Tweets where tweet_id = ${req.params.id};
    `

    db.query(query_string, (err, results, fields) => {
        if (err) {
            console.log(err)
            res.status(400).json(err)
        }

        res.set('Content-Type', 'application/json')
        res.json('Tweet Deleted!')
    })

})

router.route('/update').put(fun.AuthenticateToken, (req, res) => {

    Object.keys(req.body.tweet).forEach(key => {
        if (typeof(req.body.tweet[key]) == typeof('') && req.body.tweet[key].length === 0 && key !== 'msg'){
            return res.status(400).json(`Error: ${String.toString(key)} field is empty...`)
        }
        if (typeof(req.body.tweet[key]) == typeof(0) && req.body.tweet[key] < 0){
            return res.status(400).json(`Error: ${String.toString(key)} field is a negative number...`)
        }
    })

})

router.route('/like/add').put(fun.AuthenticateToken, (req, res) => {

    query_string = `select count(*) from Likes where tweet_id=${req.body.tweet_id} and user_id=${req.body.user_id};`

    db.query(query_string, (err, results, fields) => {
        if (err) {
            console.log(err)
            return res.status(400).json(err)
        }

        if (results[0]['count(*)'] > 0) {
            query_string = `
            update Tweets set likes=likes-1 where tweet_id=${req.body.tweet_id};
            delete from Likes where tweet_id=${req.body.tweet_id} and user_id=${req.body.user_id};
            `

            db.query(query_string, (err, results, fields) => {
                if (err) {
                    console.log(err)
                    return res.status(400).json(err)
                }
            })
            res.set('Content-Type', 'application/json')
            res.json('Like Removed!') 
        }
        else {
            query_string = `
            update Tweets set likes=likes+1 where tweet_id=${req.body.tweet_id};
            ${fun.queryInsertGenerator(req.body, "Likes")}
            `
            console.log(query_string)
            db.query(query_string, (err, results, fields) => {
                if (err) {
                    console.log(err)
                    return res.status(400).json(err)
                }
            })
            res.set('Content-Type', 'application/json')
            res.json('Like Counted!') 
        }
    })

})

router.route('/retweet/add').post(fun.AuthenticateToken, (req, res) => {

    query_string = `
    ${fun.queryInsertGenerator(req.body.retweet, 'Retweets')}
    update Tweets set retweets=retweets+1 where tweet_id=${req.body.retweet.tweet_id};
    ${fun.queryInsertGenerator(req.body.tweet, 'Tweets')}
    `

    db.query(query_string, (err, results, fields) => {
        if (err){
            console.log(err)
            return res.status(400).json(err)
        }

        res.set('Content-Type', 'application/json')
        res.json('Retweeted!')
    })

})

module.exports = router