/* What differs between repos for the shared test runner. */
module.exports = {
  cachePrefix: 'maths-',   // sw.js names its cache cachePrefix + APP_VERSION
  unit: 'tests/run.js'     // prints "N passed, M failed"
};
