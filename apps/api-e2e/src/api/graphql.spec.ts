import axios from 'axios';

describe('GraphQL API', () => {
    describe('Query.query', () => {
        it('should return the root query', async () => {
            const res = await axios.post('/graphql', {
                query: `
                    query {
                        query {
                            id
                        }
                    }
                `,
            });

            expect(res.status).toBe(200);
            expect(res.data.errors).toBeUndefined();
            expect(res.data.data.query).toHaveProperty('id');
        });
    });

    describe('Query.node', () => {
        it('should return null for non-existent node ID', async () => {
            const res = await axios.post('/graphql', {
                query: `
                    query GetNode($id: ID!) {
                        node(id: $id) {
                            id
                        }
                    }
                `,
                variables: {
                    id: 'WyJxdWVyeSJd', // Base64 encoded non-existent ID
                },
            });

            expect(res.status).toBe(200);
            expect(res.data.errors).toBeUndefined();
            expect(res.data.data.node).toBeNull();
        });

        it('should fetch Query node using its ID', async () => {
            // First get the Query node ID
            const queryRes = await axios.post('/graphql', {
                query: `
                    query {
                        query {
                            id
                        }
                    }
                `,
            });

            const queryNodeId = queryRes.data.data.query.id;

            // Now fetch it using the node query
            const nodeRes = await axios.post('/graphql', {
                query: `
                    query GetNode($id: ID!) {
                        node(id: $id) {
                            id
                            ... on Query {
                                __typename
                            }
                        }
                    }
                `,
                variables: {
                    id: queryNodeId,
                },
            });

            expect(nodeRes.status).toBe(200);
            expect(nodeRes.data.errors).toBeUndefined();
            expect(nodeRes.data.data.node).toHaveProperty('id', queryNodeId);
            expect(nodeRes.data.data.node).toHaveProperty('__typename', 'Query');
        });
    });

    describe('Introspection', () => {
        it('should return schema types', async () => {
            const res = await axios.post('/graphql', {
                query: `
                    query {
                        __schema {
                            types {
                                name
                            }
                        }
                    }
                `,
            });

            expect(res.status).toBe(200);
            expect(res.data.errors).toBeUndefined();
            expect(res.data.data.__schema.types).toBeInstanceOf(Array);

            const typeNames = res.data.data.__schema.types.map((t: { name: string }) => t.name);
            expect(typeNames).toContain('Query');
            expect(typeNames).toContain('Node');
        });

        it('should return Node interface fields', async () => {
            const res = await axios.post('/graphql', {
                query: `
                    query {
                        __type(name: "Node") {
                            kind
                            name
                            fields {
                                name
                                type {
                                    name
                                    kind
                                }
                            }
                        }
                    }
                `,
            });

            expect(res.status).toBe(200);
            expect(res.data.errors).toBeUndefined();
            expect(res.data.data.__type).toEqual({
                kind: 'INTERFACE',
                name: 'Node',
                fields: [
                    {
                        name: 'id',
                        type: {
                            name: null,
                            kind: 'NON_NULL',
                        },
                    },
                ],
            });
        });
    });
});
