import {expect} from 'chai';
import {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull
} from 'graphql/type';

import {
  GraphQLDate,
  GraphQLGeneric,
  getType,
  getTypes
} from './';

describe('type', () => {
  let user;
  before(() => {
    user = {
      name: 'User',
      fields: {
        name: {
          instance: 'String'
        },
        age: {
          instance: 'Number'
        },
        mother: {
          instance: 'ObjectID',
          ref: 'User'
        },
        friends: {
          instance: 'Array',
          caster: {
            instance: 'ObjectID',
            ref: 'User'
          }
        },
        weight: {
          instance: 'Number'
        },
        createdAt: {
          instance: 'Date'
        },
        removed: {
          instance: 'Boolean'
        },
        nums: {
          instance: 'Array',
          caster: {
            instance: 'Number'
          }
        },
        unknownType: {
          instance: 'Unknown'
        },
        sub: {
          instance: 'Object',
          caster: {
            fields: {
              foo: {
                instance: 'String'
              },
              nums: {
                instance: 'Array',
                caster: {
                  instance: 'Number'
                }
              },
              subsub: {
                instance: 'Object',
                caster: {
                  fields: {
                    bar: {
                      instance: 'Number'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  });

  describe('getType', () => {
    it('should implement the Node interface', () => {
      const result = getType([], user);
      expect(result._interfaces).to.containSubset([{
        name: 'Node'
      }]);
      expect(result._typeConfig.fields()).to.containSubset({
        id: {
          type: new GraphQLNonNull(GraphQLID)
        }
      });
    });

    it('should specify the fields', () => {
      const result = getType([], user);
      let fields = result._typeConfig.fields();
      expect(fields).to.containSubset({
        name: {
          name: 'name',
          type: GraphQLString
        },
        age: {
          name: 'age',
          type: GraphQLFloat
        },
        mother: {
          name: 'mother',
          type: GraphQLID
        },
        friends: {
          name: 'friends',
          type: new GraphQLList(GraphQLID)
        },
        weight: {
          name: 'weight',
          type: GraphQLFloat
        },
        createdAt: {
          name: 'createdAt',
          type: GraphQLDate
        },
        removed: {
          name: 'removed',
          type: GraphQLBoolean
        },
        nums: {
          name: 'nums',
          type: new GraphQLList(GraphQLFloat)
        },
        unknownType: {
          name: 'unknownType',
          type: GraphQLGeneric
        },
        sub: {
          name: 'sub'
        }
      });

      // sub
      fields = fields.sub.type._typeConfig.fields();
      expect(fields).to.containSubset({
        foo: {
          name: 'foo',
          type: GraphQLString
        },
        nums: {
          name: 'nums',
          type: new GraphQLList(GraphQLFloat)
        },
        subsub: {
          name: 'subsub'
        }
      });

      // subsub
      fields = fields.subsub.type._typeConfig.fields();
      expect(fields).to.containSubset({
        bar: {
          name: 'bar',
          type: GraphQLFloat
        }
      });
    });
  });

  describe('getTypes', () => {
    it('should resolve the references', () => {
      const result = getTypes([user]);
      const userType = result[user.name];
      const fields = userType._typeConfig.fields();

      expect(fields.mother.type).to.be.equal(userType);

      // connection type
      const nodeField = fields.friends.type._typeConfig.fields().edges.type.ofType._typeConfig.fields().node;
      expect(nodeField.type).to.be.equal(userType);
    });
  });
});
