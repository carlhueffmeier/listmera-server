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

exports.chunk = chunk;
exports.concatAll = concatAll;
