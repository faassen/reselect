// TODO: Add test for React Redux connect function

import chai from 'chai';
import { createSelector, createSelectorCreator, defaultMemoize, createStructuredSelector } from '../src/index';
import { default as lodashMemoize } from 'lodash.memoize';

let assert = chai.assert;

suite('selector', () => {
    test('basic selector', () => {
        const selector = createSelector(
            state => state.a,
            a => a
        );
        assert.equal(selector({a: 1}), 1);
        assert.equal(selector({a: 1}), 1);
        assert.equal(selector.recomputations(), 1);
        assert.equal(selector({a: 2}), 2);
        assert.equal(selector.recomputations(), 2);
    });
    test('basic selector multiple keys', () => {
        const selector = createSelector(
            state => state.a,
            state => state.b,
            (a, b) => a + b
        );
        const state1 = {a: 1, b: 2};
        assert.equal(selector(state1), 3);
        assert.equal(selector(state1), 3);
        assert.equal(selector.recomputations(), 1);
        const state2 = {a: 3, b: 2};
        assert.equal(selector(state2), 5);
        assert.equal(selector(state2), 5);
        assert.equal(selector.recomputations(), 2);
    });
    test('memoized composite arguments', () => {
        const selector = createSelector(
            state => state.sub,
            sub => sub
        );
        const state1 = { sub: { a: 1 } };
        assert.deepEqual(selector(state1), { a: 1 });
        assert.deepEqual(selector(state1), { a: 1 });
        assert.equal(selector.recomputations(), 1);
        const state2 = { sub: { a: 2 } };
        assert.deepEqual(selector(state2), { a: 2 });
        assert.equal(selector.recomputations(), 2);
    });
    test('first argument can be an array', () => {
        const selector = createSelector(
            [state => state.a, state => state.b],
            (a, b) => {
                return a + b;
            }
        );
        assert.equal(selector({a: 1, b: 2}), 3);
        assert.equal(selector({a: 1, b: 2}), 3);
        assert.equal(selector.recomputations(), 1);
        assert.equal(selector({a: 3, b: 2}), 5);
        assert.equal(selector.recomputations(), 2);
    });
    test('can accept props', () => {
        let called = 0;
        const selector = createSelector(
            state => state.a,
            state => state.b,
            (state, props) => props.c,
            (a, b, c) => {
                called++;
                return a + b + c;
            }
        );
        assert.equal(selector({a: 1, b: 2}, {c: 100}), 103);
    });
    test('chained selector', () => {
        const selector1 = createSelector(
            state => state.sub,
            sub => sub
        );
        const selector2 = createSelector(
            selector1,
            sub => sub.value
        );
        const state1 = {sub: { value: 1}};
        assert.equal(selector2(state1), 1);
        assert.equal(selector2(state1), 1);
        assert.equal(selector2.recomputations(), 1);
        const state2 = {sub: { value: 2}};
        assert.equal(selector2(state2), 2);
        assert.equal(selector2.recomputations(), 2);
    });
    test('chained selector with props', () => {
        const selector1 = createSelector(
            state => state.sub,
            (state, props) => props.x,
            (sub, x) => ({sub, x})
        );
        const selector2 = createSelector(
            selector1,
            (state, props) => props.y,
            (param, y) => param.sub.value + param.x + y
        );
        const state1 = {sub: { value: 1}};
        assert.equal(selector2(state1, {x: 100, y: 200}), 301);
        assert.equal(selector2(state1, {x: 100, y: 200}), 301);
        assert.equal(selector2.recomputations(), 1);
        const state2 = {sub: { value: 2}};
        assert.equal(selector2(state2, {x: 100, y: 201}), 303);
        assert.equal(selector2.recomputations(), 2);
    });
    test('chained selector with variadic args', () => {
        const selector1 = createSelector(
            state => state.sub,
            (state, props, another) => props.x + another,
            (sub, x) => ({sub, x})
        );
        const selector2 = createSelector(
            selector1,
            (state, props) => props.y,
            (param, y) => param.sub.value + param.x + y
        );
        const state1 = {sub: { value: 1}};
        assert.equal(selector2(state1, {x: 100, y: 200}, 100), 401);
        assert.equal(selector2(state1, {x: 100, y: 200}, 100), 401);
        assert.equal(selector2.recomputations(), 1);
        const state2 = {sub: { value: 2}};
        assert.equal(selector2(state2, {x: 100, y: 201}, 200), 503);
        assert.equal(selector2.recomputations(), 2);
    });
    test('override valueEquals', () => {
        // a rather absurd equals operation we can verify in tests
        const createOverridenSelector = createSelectorCreator(
          defaultMemoize,
          (a, b) => typeof a === typeof b
        );
        const selector = createOverridenSelector(
            state => state.a,
            a => a
        );
        assert.equal(selector({a: 1}), 1);
        assert.equal(selector({a: 2}), 1); // yes, really true
        assert.equal(selector.recomputations(), 1);
        assert.equal(selector({a: 'A'}), 'A');
        assert.equal(selector.recomputations(), 2);
    });
    test('custom memoize', () => {
        const customSelectorCreator = createSelectorCreator(lodashMemoize, JSON.stringify);
        const selector = customSelectorCreator(
            state => state.a,
            state => state.b,
            (a, b) => a + b
        );
        assert.equal(selector({a: 1, b: 2}), 3);
        assert.equal(selector({a: 1, b: 2}), 3);
        assert.equal(selector.recomputations(), 1);
        assert.equal(selector({a: 2, b: 3}), 5);
        assert.equal(selector.recomputations(), 2);
        // TODO: Check correct memoize function was called
    });
    test('exported memoize', () => {
        let called = 0;
        const memoized = defaultMemoize(state => {
            called++;
            return state.a;
        });

        const o1 = {a: 1};
        const o2 = {a: 2};
        assert.equal(memoized(o1), 1);
        assert.equal(memoized(o1), 1);
        assert.equal(called, 1);
        assert.equal(memoized(o2), 2);
        assert.equal(called, 2);
    });
    test('exported memoize with valueEquals override', () => {
        // a rather absurd equals operation we can verify in tests
        let called = 0;
        const valueEquals = (a, b) => typeof a === typeof b;
        const memoized = defaultMemoize(
            a => {
                called++;
                return a;
            },
            valueEquals
        );
        assert.equal(memoized(1), 1);
        assert.equal(memoized(2), 1); // yes, really true
        assert.equal(called, 1);
        assert.equal(memoized('A'), 'A');
        assert.equal(called, 2);
    });
    test("composing selectors", function() {
        const selector = createStructuredSelector({
              x: state => state.a,
              y: state => state.b
        });

        let firstResult = selector({a: 1,b: 2});
        assert.deepEqual( firstResult, {x: 1, y: 2});
        assert.strictEqual(selector({a: 1,b: 2}), firstResult);

        let secondResult = selector({a: 2,b: 2});
        assert.deepEqual( secondResult, {x: 2,y: 2});
        assert.strictEqual(selector({a: 2,b: 2}), secondResult);
    });
    test("composing selectors with custom selector creator", function() {
        const customSelectorCreator = createSelectorCreator(
            defaultMemoize,
            (a,b) => a == b
        );
        const selector = createStructuredSelector({
              x: state => state.a,
              y: state => state.b
        }, customSelectorCreator );

        let firstResult = selector({a: 1,b: 2});
        assert.deepEqual( firstResult, {x: 1, y: 2});
        assert.strictEqual(selector({a: 1,b: 2}), firstResult);
        assert.deepEqual(selector({a: 2,b: 2}), {x: 2,y: 2});
    });
});
