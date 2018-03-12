var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema } = require('graphql');
var fetch = require('node-fetch');
var DataLoader = require('dataloader')

var app = express();

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Query {
    human(id: ID = 1): Human
  }

  type Human implements Character {
    id: Int
    name: String
    height(unit: Unit = METER): Float
    friends: [Human]
  }

  interface Character {
    id: Int
    name: String
    friends: [Character]
  }

  enum Unit {
    METER
    FOOT
  }

  input ReviewInput {
    stars: Int!
    commentary: String
  }
`);

const fetchUserById = (id) => {
  return fetch(`http://localhost:4000/mock/user/${id}`)
    .then(function(res) {
      return res.json();
    }).then(function(json) {
      return new Human(json);
    });
}

const userLoader = new DataLoader((ids) => {
  console.log(ids);
  return Promise.all(ids.map(id => fetchUserById(id)));
  // return ids.map(id => fetchUserById(id).then(human => human));
});

class Human {
  constructor({id, name, height, friends}) {
    this.id = id;
    this.name = name;
    this._height = height;
    this._friends = friends;
  }

  height({unit = 'METER'}) {
    if (unit === 'METER') {
      return this._height;
    } else {
      return this._height * 4;
    }
  }

  friends() {
    // return userLoader.load(this._friends);
    return this._friends.map(id => userLoader.load(id));
  }
}

// The root provides a resolver function for each API endpoint
var root = {
  human: ({id}) => userLoader.load(id),
};

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

const users = [{
  id: 1,
  name: 'felix',
  height: 1.1,
  friends: [2, 3],
}, {
  id: 2,
  name: 'rick',
  height: 1.2,
  friends: [1],
}, {
  id: 3,
  name: 'negen',
  height: 1.3,
  friends: [1],
}];

app.use('/mock/user/:id', (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  console.log(`request user by id ${id}`);
  res.json(users.find(item => item.id === id));
});

app.listen(4000, () => console.log('Now browse to localhost:4000/graphql'));
