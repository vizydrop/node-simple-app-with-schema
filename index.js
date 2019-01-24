const express = require('express');
const resolve = require('path').resolve;
const bodyParser = require('body-parser');
const {version} = require('./package.json');

const employees = require('./data/employees.json');
const products = require('./data/products.json');
const users = require('./data/users.json');

const app = express();

app.use(bodyParser.json());

const getSourceDb = (source) => {
    if (source === 'employee') {
        return employees;
    } else {
        return products;
    }
};

const getSources = () => ([{id: 'employee', name: 'Employee'}, {id: 'products', name: 'Products'}]);

const getAuthentications = () => ([
    {
        name: 'Login & token',
        id: 'login-token',
        description: 'Provide login and token to our system',
        fields: [
            {
                'optional': false,
                'id': 'login',
                'name': 'Login',
                'type': 'text',
                'description': 'Login',
                'datalist': false
            },
            {
                'optional': false,
                'id': 'token',
                'name': 'Token',
                'type': 'text',
                'description': 'Token',
                'datalist': false
            },
        ]
    }
]);

app.get('/logo', (req, res) => res.sendFile(resolve('./logo.svg')));

app.get('/', (req, res) => {
    const app = {
        'name': 'Custom app with schema',
        'version': version,
        'type': 'crunch',
        'description': 'Custom app with predefined data schema',
        'authentication': getAuthentications(),
        'sources': getSources()
    };

    res.json(app);
});

app.post('/validate', (req, res) => {
    const {login, token} = req.body.fields;

    // login should be not empty
    if (login && login.trim().length === 0) {
        return res.status(401).json({message: `Invalid login or token`});
    }

    // token should have at least 6 chars
    if (token && token.trim().length < 6) {
        return res.status(401).json({message: `Invalid login or token`});
    }

    const userInDb = Boolean(users.find((user) => user.login === login && user.token === token));

    if (!userInDb) {
        return res.status(401).json({message: `Invalid login or token`});
    }

    res.status(200).json({name: login});
});

app.post('/schema', (req, res) => {
    const source = req.body.source;
    const account = req.body.account;
    const accountInDb = users.find(({login}) => login === account.login);

    if (source === 'employee') {
        if (accountInDb.type === `manager`) {
            return res.json({
                name: {
                    id: "name",
                    ignore: false,
                    name: "Name",
                    readonly: false,
                    type: "text"
                },
                age: {
                    id: "age",
                    ignore: false,
                    name: "Age",
                    readonly: false,
                    type: "number"
                },
                salary: {
                    id: "salary",
                    ignore: false,
                    name: "Salary",
                    readonly: false,
                    type: "number"
                }
            });
        }

        return res.json({
            name: {
                id: "name",
                ignore: false,
                name: "Name",
                readonly: false,
                type: "text"
            },
            age: {
                id: "age",
                ignore: false,
                name: "Age",
                readonly: false,
                type: "number"
            },
        });
    } else {
        return res.json({
            name: {
                id: "name",
                ignore: false,
                name: "Name",
                readonly: false,
                type: "text"
            },
            price: {
                id: "price",
                ignore: false,
                name: "Price",
                readonly: false,
                type: "number"
            },
            quantity: {
                id: "quantity",
                ignore: false,
                name: "Quantity",
                readonly: false,
                type: "number"
            }
        });
    }
});

app.post('/', (req, res) => {
    const source = req.body.source;
    const db = getSourceDb(source);
    const account = req.body.account;
    const accountInDb = users.find(({login}) => login === account.login);

    if (source === `employee` && accountInDb.type !== `manager`) {
        return res.json(db.map(({name, age}) => ({name, age})));
    }

    res.json(db);
});

app.listen(process.env.PORT || 8081);
