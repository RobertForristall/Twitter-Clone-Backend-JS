const jwt = require('jsonwebtoken')

const nodemailer = require('nodemailer')

const s3 = require('./bucket_connection')

const db = require('./db_connection')

function AuthenticateToken(req, res, next) {

    const authHeader = req.headers['authorization']

    if (authHeader == null) return res.status(403).json('Error: Token Required')

    if (authHeader.split(' ')[0] !== 'bearer' && authHeader.split(' ')[0] !== 'Bearer'){
        return res.status(403).json('Error: token is not of the correct format')
    } 

    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.status(403).json('Error: token string missing')

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json('Error: Token failed to verify' + err)

        req.user = user
        next()
    })
}

function generateValuesStr (object) {
    arr = []
    Object.keys(object).forEach(key => {
        if (typeof(object[key]) == typeof('')){
            if (key === "datePosted") arr.push(`"${object[key].substring(0, 10)}"`)
            else arr.push(`"${object[key]}"`)
        }
        else if (typeof(object[key]) == typeof(0)){
            arr.push(`${object[key]}`)
        }
    })
    return arr
}

function queryInsertGenerator (object, table_name) {
    keys = Object.keys(object)
    return `
    insert into ${table_name} (${keys.join(', ')}) 
    values (${generateValuesStr(object).join(', ')});
    `

}

function queryUpdateGenerator (object, table_name) {
    
}

async function getImages(data) {

    let rv = {
        image_arr: [],
        index_arr: []
    }

    data.map((tweet, index) => {
        if (tweet.sharedContent === 'Image' || tweet.sharedContent === 'GIF'){
            params = {
                Bucket: process.env.BUCKET_NAME,
                Key: tweet.fileKey
            }
            console.log(`Getting object with key: ${tweet.fileKey}`)
            rv.image_arr.push(s3.getObject(params).promise())
            rv.index_arr.push(index)
        }
    })

    await Promise.all(rv.image_arr)
        .then(res => {
            //console.log(new Buffer.from(res[0].Body).toString('base64'))
            rv.image_arr = res.map((image) => {
                return new Buffer.from(image.Body).toString('base64')
            })
        })
    
    return rv
}

function addRetweet(retweet) {
    return new Promise((resolve, reject) => {
        query_string = `
        ${queryInsertGenerator(retweet, 'Retweets')}
        `

        db.query(query_string, (err, results, fields) => {
            if (err) {
                return reject(err)
            }
            resolve(results)
        })
        
    })
}

function updateRetweetCounter(tweet_id) {

    return new Promise ((resolve, reject) => {
        query_string = `
        update Tweets set retweets=retweets+1 where tweet_id=${tweet_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err) {
                return reject(err)
            }
            resolve(results)
        })
    })
}

function insertTweet(tweet) {

    return new Promise((resolve, reject) => {
        query_string = `
        ${queryInsertGenerator(tweet, 'Tweets')}
        `

        db.query(query_string, (err, results, fields) => {
            if (err) {
                return reject(err)
            }
            resolve(results)
        })
    })
}

function getTweetsWithEmail() {

    return new Promise((resolve, reject) => {
        query_string = `
        select T.*, U.email, S.* from Users U join Tweets T on T.user_id=U.user_id join SharedContent S on T.tweet_id=S.tweet_id;
        `

        db.query(query_string, (err, results, fields) => {
            if (err){
                return reject(err)
            }
            resolve(results)
        })
    })
}

function getLikesForUser(user_id) {

    return new Promise((resolve, reject) => {
        query_string = `
        select tweet_id from Likes where user_id=${user_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err){
                return reject(err)
            }
            resolve(results)
        })
    })
}

function getRetweetsForUser(user_id) {

    return new Promise((resolve, reject) => {
        query_string = `
        select tweet_id from Retweets where user_id=${user_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err){
                return reject(err)
            }
            resolve(results)
        })
    })
}

function incrementTweetLike(tweet_id){
    return new Promise((resolve, reject) => {
        query_string=`
        update Tweets set likes=likes+1 where tweet_id=${tweet_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err) {
                return reject(err)
            }
            resolve(results)
        })
    })
}

function decrementTweetLike(tweet_id){
    return new Promise((resolve, reject) => {
        query_string=`
        update Tweets set likes=likes-1 where tweet_id=${tweet_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err) {
                return reject(err)
            }
            resolve(results)
        })
    })
}

function insertLike(like_object) {
    return new Promise((resolve, reject) => {
        query_string=`
        ${queryInsertGenerator(like_object, "Likes")}
        `

        db.query(query_string, (err, results, fields) => {
            if (err) {
                return reject(err)
            }
            resolve(results)
        })
    })
}

function deleteLike(like_object) {
    return new Promise((resolve, reject) => {
        query_string=`
        delete from Likes where tweet_id=${like_object.tweet_id} and user_id=${like_object.user_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err) {
                return reject(err)
            }
            resolve(results)
        })
    })
}

function deleteRetweetedTweet(tweet_id, user_id) {

    return new Promise((resolve, reject) => {
        
        query_string = `
        delete from Tweets where tweet_id=${tweet_id} and user_id=${user_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err){
                return reject(err)
            }
            resolve(results)
        })
    })
}

function deleteRetweet(tweet_id, user_id) {

    return new Promise((resolve, reject) => {
        
        query_string = `
        delete from Retweets where tweet_id=${tweet_id} and user_id=${user_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err){
                return reject(err)
            }
            resolve(results)
        })
    })
}

function decrementTweetRetweet(tweet_id) {
    return new Promise((resolve, reject) => {
        
        query_string = `
        update Tweets set retweets=retweets-1 where tweet_id=${tweet_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err){
                return reject(err)
            }
            resolve(results)
        })
    })
}

function deleteImage(fileKey) {

    params = {
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey
    }

    return s3.deleteObject(params).promise()
}

function deleteOriginalTweet(tweet_id) {
    return new Promise((resolve, reject) => {
        
        query_string = `
        delete from Tweets where tweet_id=${tweet_id};
        `

        db.query(query_string, (err, results, fields) => {
            if (err){
                return reject(err)
            }
            resolve(results)
        })
    })
}

function insertSharedContent(content) {
    return new Promise((resolve, reject) => {
        query_string=`
        ${queryInsertGenerator(content, 'SharedContent')}
        `

        db.query(query_string, (err, results, fields) => {
            if (err){
                return reject(err)
            }
            resolve(results)
        })
    })
}

function insertPollResult(poll_res) {
    return new Promise((resolve, reject) => {
        query_string=`
        ${queryInsertGenerator(poll_res, 'PollResults')}
        `

        db.query(query_string, (err, results, fields) => {
            if (err) {
                return reject(err)
            }
            resolve(results)
        })
    })
}

module.exports = {
    AuthenticateToken: AuthenticateToken,
    queryInsertGenerator: queryInsertGenerator,
    getImages: getImages,
    addRetweet: addRetweet,
    updateRetweetCounter: updateRetweetCounter,
    insertTweet: insertTweet,
    getTweetsWithEmail: getTweetsWithEmail,
    getLikesForUser: getLikesForUser,
    getRetweetsForUser: getRetweetsForUser,
    incrementTweetLike: incrementTweetLike,
    decrementTweetLike: decrementTweetLike,
    insertLike: insertLike,
    deleteLike: deleteLike,
    deleteRetweetedTweet: deleteRetweetedTweet,
    deleteRetweet: deleteRetweet,
    decrementTweetRetweet: decrementTweetRetweet,
    deleteImage: deleteImage,
    deleteOriginalTweet: deleteOriginalTweet,
    insertSharedContent: insertSharedContent,
    insertPollResult: insertPollResult,
}