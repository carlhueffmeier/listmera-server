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
