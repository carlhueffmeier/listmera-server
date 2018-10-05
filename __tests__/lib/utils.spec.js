const utils = require('../../lib/utils');

describe('concatAll', () => {
  it('flattens array of arrays', () => {
    const input = [[1, 2], [3, 4], [5, 6]];
    const expected = [1, 2, 3, 4, 5, 6];
    const result = utils.concatAll(input);
    expect(result).toEqual(expected);
  });

  it('works on empty arrays', () => {
    const input = [];
    const expected = [];
    const result = utils.concatAll(input);
    expect(result).toEqual(expected);
  });
});

describe('chunk', () => {
  it('creates chunks of correct size', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const expected = [[1, 2], [3, 4], [5, 6]];
    const result = utils.chunk(input, 2);
    expect(result).toEqual(expected);
  });

  it('correctly handles half-full chunks', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const expected = [[1, 2, 3, 4], [5, 6]];
    const result = utils.chunk(input, 4);
    expect(result).toEqual(expected);
  });
});

describe('both', () => {
  it('returns the correct values based on logical AND', () => {
    const T = () => true;
    const F = () => false;
    expect(utils.both(T, F)()).toBe(false);
    expect(utils.both(F, T)()).toBe(false);
    expect(utils.both(T, T)()).toBe(true);
  });

  it('returns the correct values based on logical AND', () => {
    const identity = val => val;
    const negate = val => !val;
    expect(utils.both(identity, negate)(true)).toBe(false);
    expect(utils.both(negate, identity)(true)).toBe(false);
    expect(utils.both(identity, identity)(true)).toBe(true);
  });
});
