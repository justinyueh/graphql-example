# graphql-example
A simple GraphQL example

# setup
- npm install
- node index.js
- Now browse to localhost:4000/graphql
- type something like
`
{
  human {
    name
		id
    height
    friends {
      name
      friends {
        id
      }
    }
  }
}
`