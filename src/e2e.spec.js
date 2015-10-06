import {expect} from 'chai';

import {getSchema, graphql} from './';
import User from '../fixture/user';

describe('e2e', () => {
  describe('get schema', () => {
    let motherUser;
    let user1;
    let user2;
    let schema;

    before(() => {
      schema = getSchema([User]);
    });

    beforeEach(async function Test1() {
      motherUser = new User({
        name: 'Mother',
        age: 54
      });

      await motherUser.save();

      user1 = new User({
        name: 'Foo',
        age: 28
      });

      await user1.save();

      user2 = new User({
        name: 'Bar',
        age: 28,
        mother: motherUser._id,
        friends: [user1._id],
        objectIds: [user1._id]
      });

      await user2.save();
    });

    afterEach(async function Test2() {
      await [motherUser.remove(), user1.remove(), user2.remove()];
    });

    describe('singular query', () => {
      it('should get data from database by id', async function Test3() {
        const result = await graphql(schema, `{
          user(id: "${user2._id}") {
            _id
            name
            age
            mother {
              _id
              name
            }
            friends {
              edges {
                node {
                  _id
                  name
                }
              }
            }
            objectIds
          }
        }`);

        expect(result).to.be.eql({
          data: {
            user: {
              _id: user2._id.toString(),
              name: 'Bar',
              age: 28,
              mother: {
                _id: motherUser._id.toString(),
                name: 'Mother'
              },
              friends: {
                edges: [{
                  node: {
                    _id: user1._id.toString(),
                    name: 'Foo'
                  }
                }]
              },
              objectIds: [user1._id.toString()]
            }
          }
        });
      });

      describe('with fragments', () => {
        it('should support fragments', async function Test4() {
          // FIXME it fails in node {}
          const result = await graphql(schema, `
            query GetUser {
              user(id: "${user2._id}") {
                ...UserFragment
                friends {
                  edges {
                    node {
                      _id
                      name
                      age
                    }
                  }
                }
              }
            }
            fragment UserFragment on User {
              _id
              name
              age
            }
          `);

          expect(result).to.be.eql({
            data: {
              user: {
                _id: user2._id.toString(),
                name: 'Bar',
                age: 28,
                friends: {
                  edges: [{
                    node: {
                      _id: user1._id.toString(),
                      name: 'Foo',
                      age: 28
                    }
                  }]
                }
              }
            }
          });
        });

        it('should support inline fragments', async function Test5() {
          const result = await graphql(schema, `{
            user(id: "${user2._id}") {
              _id
              name,
              ... on User {
                age
              }
            }
          }`);

          expect(result).to.be.eql({
            data: {
              user: {
                _id: user2._id.toString(),
                name: 'Bar',
                age: 28
              }
            }
          });
        });
      });
    });

    describe('plural query', () => {
      it('should get data from database and filter by number', async function Test6() {
        const result = await graphql(schema, `{
          users(age: 28) {
            _id
            name
            age
          }
        }`);

        expect(result.data.users).to.deep.include.members([
          {
            _id: user1._id.toString(),
            name: 'Foo',
            age: 28
          }, {
            _id: user2._id.toString(),
            name: 'Bar',
            age: 28
          }
        ]);
      });

      it('should get data from database and filter by array of _id(s)', async function Test7() {
        const result = await graphql(schema, `{
          users(id: ["${user1._id}", "${user2._id}"]) {
            _id
          }
        }`);

        expect(result).to.be.eql({
          data: {
            users: [{
              _id: user1._id.toString()
            }, {
              _id: user2._id.toString()
            }]
          }
        });
      });
    });
  });
});
