const request = require('supertest')
const assert = require('assert')
const app = require('../app')
const sha256 = require('js-sha256')

const pass = "Secure123$"

let test_user_signup = {
    user_id: 99999,
    email: "supertest@test.com",
    name: "Super Tester",
    dob: new Date().toISOString().substring(0,10),
    is_verified: true,
    pass: sha256.sha256.create().update(pass).hex()
}

let test_user_login = {
    email: test_user_signup.email,
    pass: sha256.sha256.create().update(pass).hex()
}

let user_delete_id = -1

console.log(test_user_login.pass)

describe('Post /users/signup', () => {

    it('Returns that the user was successfully added', done => {
        request(app)
            .post('/users/signup')
            .send(test_user_signup)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })

    it('Returns that the email field was empty', done => {
        request(app)
            .post('/users/signup')
            .send({...test_user_signup, email: ""})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })

    it('Returns that the pass field was empty', done => {
        request(app)
            .post('/users/signup')
            .send({...test_user_signup, pass: ""})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })

    it('Returns that the name field was empty', done => {
        request(app)
            .post('/users/signup')
            .send({...test_user_signup, name: ""})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })

    it('Returns that the dob field was empty', done => {
        request(app)
            .post('/users/signup')
            .send({...test_user_signup, dob: ""})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })
})

describe('POST /users/login', () => {

    it('Returns a logged in user successfully in json', done => {
        request(app)
            .post('/users/login')
            .send(test_user_login)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                user_delete_id = res.body.user_id
                return done()
            })
    })

    it('Returns an error that the email field is empty', done => {
        request(app)
            .post('/users/login')
            .send({...test_user_login, email: ''})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })

    it('Returns an error that the password field is empty', done => {
        request(app)
            .post('/users/login')
            .send({...test_user_login, pass: ''})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })

    it('Returns an error that the email was not tied to an existing account', done => {
        request(app)
            .post('/users/login')
            .send({...test_user_login, email: 'doesntexist@test.com'})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })

    it('Returns an error that the credentials dont match any in the database', done => {
        request(app)
            .post('/users/login')
            .send({...test_user_login, pass: 'notapass'})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
                if(err) return done(err)
                return done()
            })
    })
})

describe('DELETE /users/delete', () => {

    it('Returns that the user was successfully deleted', done => {
        request(app)
            .delete(`/users/delete/${user_delete_id}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })
})

describe('GET /images/:id', () => {
    
})
