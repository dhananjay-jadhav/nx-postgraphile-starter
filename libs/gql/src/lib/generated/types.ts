export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
}

/** An object with a globally unique `ID`. */
export interface Node {
    /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
    id: Scalars['ID']['output'];
}

/** The root query type which gives access points into the data universe. */
export interface Query extends Node {
    __typename?: 'Query';
    /** The root query type must be a `Node` to work well with Relay 1 mutations. This just resolves to `query`. */
    id: Scalars['ID']['output'];
    /** Fetches an object given its globally unique `ID`. */
    node?: Maybe<Node>;
    /**
     * Exposes the root query type nested one level down. This is helpful for Relay 1
     * which can only query top level fields if they are in a particular form.
     */
    query: Query;
}

/** The root query type which gives access points into the data universe. */
export interface QueryNodeArgs {
    id: Scalars['ID']['input'];
}
