import chai from 'chai';
import {createSelector, createSelectorCreator} from '../src/index';

let assert = chai.assert;

suite('selector', function() {
    test("basic selector", function() {
        const selector = createSelector([state => state.a], a => a);
        assert.equal(selector({a: 1}), 1);
    });
    test("basic selector multiple keys", function() {
        const selector = createSelector(
            [state => state.a, state => state.b], (a, b) => a + b);
        assert.equal(selector({a: 1, b: 2}), 3);
    });
    test("default result function", function() {
        const selector = createSelector([state => state.a]);
        assert.equal(selector({a: 1}), 1);
    });
    test("first argument does not need to be an array", function() {
        const selector = createSelector(
            state => state.a, a => a);
        assert.equal(selector({a: 1}), 1);
    });
    test("chained selector", function() {
        const selector1 = createSelector(
            [state => state.sub], sub => sub);
        const selector2 = createSelector(
            [selector1], sub => sub.value);
        assert.equal(selector2({sub: { value: 1}}), 1);
    });
    test("memoized selector", function() {
        let called = 0;
        const selector = createSelector([state => state.a], a => {
            called++;
            return a;
        });
        assert.equal(selector({a: 1}), 1);
        assert.equal(selector({a: 1}), 1);
        assert.equal(called, 1);
        assert.equal(selector({a: 2}), 2);
        assert.equal(called, 2);
    });
    test("memoized composite arguments", function() {
        let called = 0;
        const selector = createSelector([state => state.sub], sub => {
            called++;
            return sub;
        });
        const state = {
            sub: {
                a: 1
            }
        };
        assert.deepEqual(selector(state), { a: 1 });
        assert.deepEqual(selector(state), { a: 1 });
        assert.equal(called, 1);
    });
    test("override valueEquals", function() {
        // a rather absurd equals operation we can verify in tests
        const createSelector = createSelectorCreator(
            (a, b) => typeof a === typeof b);
        let called = 0;
        const selector = createSelector([state => state.a], a => {
            called++;
            return a;
        });
        assert.equal(selector({a: 1}), 1);
        assert.equal(selector({a: 2}), 1); // yes, really true
        assert.equal(called, 1);
        assert.equal(selector({a: 'A'}), 'A');
        assert.equal(called, 2);
    });
});
