var express = require('express')
var router = express.Router()
const db = require('../db_connection')
const jwt = require('jsonwebtoken')
const fun = require('../functions')
const s3 = require('../bucket_connection')
const upload = require('../app')

router.route('/:id').get(fun.AuthenticateToken, (req, res) => {

    promise_arr = []

    promise_arr.push(fun.getTweetsWithEmail())
    promise_arr.push(fun.getLikesForUser(req.params.id))
    promise_arr.push(fun.getRetweetsForUser(req.params.id))
    promise_arr.push(fun.getPolls())

    Promise.all(promise_arr)
        .then(async(promise_res) => {
            console.log("Checking for images...")
            let images = await fun.getImages(promise_res[0])
            let polls = {}
            images.index_arr.forEach((tweet_index, image_index) => {
                promise_res[0][tweet_index] = {...promise_res[0][tweet_index], image: images.image_arr[image_index]}
            })
            console.log("Done getting images...")
            promise_res[3].forEach(poll => {
                poll.choice_arr = [poll.c_1, poll.c_2, poll.c_3, poll.c_4, poll.c_5, poll.c_6]
                polls[poll.tweet_id] = poll
            })
            promise_res[3] = polls
            
            res.set('Content-Type', 'application/json')
            res.json(promise_res)
        })
        .catch(err => {
            console.log(err)
            return res.status(400).json(err)
        })

})

router.route('/add').post(fun.AuthenticateToken, (req, res) => {

    Object.keys(req.body.tweet).forEach(key => {
        if (typeof(req.body.tweet[key]) == typeof('') && req.body.tweet[key].length === 0 && key !== 'msg' && key !== 'fileKey'){
            return res.status(400).json(`Error: ${String.toString(key)} field is empty...`)
        }
        if (typeof(req.body.tweet[key]) == typeof(0) && req.body.tweet[key] < 0){
            return res.status(400).json(`Error: ${String.toString(key)} field is a negative number...`)
        }
    })

    promise_arr = []
    promise_arr.push(fun.insertTweet(req.body.tweet))
    Promise.all(promise_arr)
        .then(promise_res_1 => {
            console.log(promise_res_1[0])
            promise_arr = []
            if (req.body.tweet.sharedContent === 'Poll') {
                promise_arr.push(fun.insertPoll({...req.body.poll, tweet_id: promise_res_1[0]["insertId"]}))
            }
            Promise.all(promise_arr)
                .then(promise_res_2 => {
                    res.set('Content-Type', 'application/json')
                    res.json('Tweet Added!')
                })
                .catch(err => {
                    console.log(err)
                    res.status(400).json(err)
                })
        })
        .catch(err => {
            console.log(err)
            res.status(400).json(err)
        })
})

router.route('/delete/:tweet_id/:user_id').delete(fun.AuthenticateToken, (req, res) => {

    query_string = `
    select sharedContent, fileKey, if(user_id = originalPoster, true, false ) as flag from Tweets where tweet_id=${req.params.tweet_id} and user_id=${req.params.user_id};
    `

    db.query(query_string, (err, results, fields) => {
        if (err) {
            console.log(err)
            res.status(400).json(err)
        }
        else {
            console.log(results)
            if (!results[0].flag) {
                promise_arr = []
                promise_arr.push(fun.deleteRetweetedTweet(req.params.tweet_id, req.params.user_id))
                promise_arr.push(fun.deleteRetweet(req.params.tweet_id, req.params.user_id))
                promise_arr.push(fun.decrementTweetRetweet(req.params.tweet_id))
                Promise.all(promise_arr)
                    .then(promise_res => {
                        //console.log(promise_res)
                        res.set('Content-Type', 'application/json')
                        res.json('Retweeted Tweet Deleted!')
                    })
            }
            else {
                promise_arr = []
                if (results[0].sharedContent === "Image" || results[0].sharedContent === "GIF"){
                    promise_arr.push(fun.deleteImage(results[0].fileKey))
                }
                promise_arr.push(fun.deleteOriginalTweet(req.params.tweet_id))
                Promise.all(promise_arr)
                    .then(promise_res => {
                        //console.log(promise_res)
                        res.set('Content-Type', 'application/json')
                        res.json('Original Tweet Deleted!')
                    })
            }
        }
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
        else {
            if (results[0]['count(*)'] > 0) {
                promise_arr = []
                promise_arr.push(fun.decrementTweetLike(req.body.tweet_id))
                promise_arr.push(fun.deleteLike(req.body))
                Promise.all(promise_arr)
                    .then(promise_res => {
                        console.log(promise_res)
                        res.set('Content-Type', 'application/json')
                        res.json('Like Removed!')
                    })
            }
            else {
                promise_arr = []
                promise_arr.push(fun.incrementTweetLike(req.body.tweet_id))
                promise_arr.push(fun.insertLike(req.body))
                Promise.all(promise_arr)
                    .then(promise_res => {
                        console.log(promise_res)
                        res.set('Content-Type', 'application/json')
                        res.json('Like Added!')
                    })
            }
        }
    })

})

router.route('/retweet/add').post(fun.AuthenticateToken, (req, res) => {

    promise_arr = []

    promise_arr.push(fun.addRetweet(req.body.retweet))
    promise_arr.push(fun.updateRetweetCounter(req.body.retweet.tweet_id))
    promise_arr.push(fun.insertTweet(req.body.tweet))

    Promise.all(promise_arr)
        .then(promise_res => {
            console.log(promise_res)
            res.set('Content-Type', 'application/json')
            res.json(promise_res)
        })
        .catch(err => {
            console.log(err)
            res.status(400).json(err)
        })

})

router.route('/image/add').post(fun.AuthenticateToken,  (req, res) => {
    
    params = {
        Bucket: process.env.BUCKET_NAME,
        Body: req.files[0].buffer,
        Key: `user_${req.body.user_id}/images/${req.files[0].originalname}`
    }

    s3.upload(params, (err, data) => {
        if (err) console.log(err)
        if (data) {
            console.log("Success, Image added!")
            res.set('Content-Type', 'application/json')
            res.json(params.Key)
        }
    })
})

router.route('image/delete/:id/:file_name').delete(fun.AuthenticateToken, (req, res) => {

    params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `user_${req.params.id}/images/${req.params.file_name}`
    }

    s3.deleteObject(params, (err, data) => {
        if (err) console.log(err)
        if (data) {
            console.log("Success, Image deleted")
            res.set('Content-Type', 'application/json')
            res.json('Image deleted')
        }
    })

})

module.exports = router