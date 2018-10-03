function both(predicateA, predicateB) {
  return input => predicateA(input) && predicateB(input);
}

function defaults(value, defaultValue) {
  return typeof value === 'undefined' ? defaultValue : value;
}

function chunk(array, chunkSize) {
  return array.reduce((setOfChunks, item, index) => {
    if (index % chunkSize === 0) {
      setOfChunks.push([item]);
    } else {
      setOfChunks[setOfChunks.length - 1].push(item);
    }
    return setOfChunks;
  }, []);
}

function concatAll(arrayOfArrays) {
  return arrayOfArrays.reduce((result, array) => [...result, ...array], []);
}

function pick(keysToPick, source) {
  return keysToPick.reduce(
    (target, key) =>
      source.hasOwnProperty(key)
        ? {
            ...target,
            [key]: source[key]
          }
        : target,
    {}
  );
}

exports.both = both;
exports.defaults = defaults;
exports.chunk = chunk;
exports.concatAll = concatAll;
exports.pick = pick;
