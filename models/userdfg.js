const mongoose = require('mongoose');
const User = require('./user');

const preparedUser = {
    name: 'Imanol Conde',
    email: 'imanolcondeimanol@gmail.com',
    password: 'rh*617/lat'
}

const validUsers = [
    {
        ...preparedUser
    },
    {
        name: 'Kevin',
        email: 'kevin@hotmail.com',
        password: '123dfg9$'
    },
    {
        name: 'Katrin',
        email: 'katrin@ikasle.ehe.eus',
        password: '12df670#'
    }
]

const invalidPassword = ['124@dfs', 'sdfdsfdsfsdf@#', 'fdasdaf443'];
const invalidEmail = ['imanol@.com', 'dsafsa@gmail.', '@hotmail.com'];
const invalidName = ['f1', '1', '12f'];

require('dotenv').config();

describe('User model', () => {


    describe('Incorrect user data', () => {

        it('user without a name, email and password', (done) => {

            let user = new User();
            user.validate((err) => {

                try {
                    expect(err.errors.name).toBeDefined;
                    expect(err.errors.name.kind).toBe('required');
                    expect(err.errors.email).toBeDefined;
                    expect(err.errors.email.kind).toBe('required');
                    expect(err.errors.password).toBeDefined;
                    expect(err.errors.password.kind).toBe('required');
                    expect(Object.keys(err.errors)).toHaveLength(3);
                    done();
                } catch (err) {
                    done(err);
                }

            })

        });

        it('user without a email', (done) => {

            let user = { ...preparedUser };
            delete user['email'];
            user = new User(user);

            user.validate((err) => {

                try {
                    expect(err.errors.email).toBeDefined;
                    expect(err.errors.email.kind).toBe('required');
                    expect(Object.keys(err.errors)).toHaveLength(1);
                    done();
                } catch (err) {
                    done(err);
                }

            })

        });

        it('user without a name', (done) => {

            let user = { ...preparedUser };
            delete user['name'];
            user = new User(user);

            user.validate((err) => {

                try {
                    expect(err.errors.name).toBeDefined;
                    expect(err.errors.name.kind).toBe('required');
                    expect(Object.keys(err.errors)).toHaveLength(1);
                    done();
                } catch (err) {
                    done(err);
                }

            })

        });

        it('user with invalid email', (done) => {

            let user = { ...preparedUser };

            invalidEmail.forEach(value => {
                user.email = value;
                user = new User(user);

                user.validate((err) => {

                    try {

                        expect(err.errors.email).toBeDefined;
                        expect(err.errors.email.kind).toBe('user defined');
                        expect(Object.keys(err.errors)).toHaveLength(1);

                    } catch (err) {
                        done(err);
                    }

                })
            })

            done();

        });

        it('user with invalid password', (done) => {

            let user = { ...preparedUser };

            invalidPassword.forEach((value) => {

                user['password'] = value;
                user = new User(user);

                user.validate((err) => {

                    try {
                        
                        expect(err.errors.password).toBeDefined;
                        expect(err.errors.password.kind).toBe('user defined');
                        expect(Object.keys(err.errors)).toHaveLength(1);

                    } catch (err) {
                        done(err);
                    }

                })
            })
            done();

        });

        it('user with invalid name', (done) => {

            let user = { ...preparedUser };


            invalidName.forEach((value) => {
                user.name = value;
                user = new User(user);

                user.validate((err) => {

                    try {
                        
                        expect(err.errors.name).toBeDefined;
                        expect(err.errors.name.kind).toBe('user defined');
                        expect(Object.keys(err.errors)).toHaveLength(1);
                        
                    } catch (err) {
                        done(err);
                    }

                })
            })

            done();

        });

    });

    describe('Correct user data', () => {

        it('user with valid name, email and password', (done) => {


            for (let key in Object.keys(validUsers)) {
                let user = { ...validUsers[key] };
                user = new User(user);

                user.validate((err) => {

                    try {

                        expect(err).toBeUnDefined;

                    } catch (err) {
                        done(err);
                    }

                })
            }

            done();

        });

    })
});