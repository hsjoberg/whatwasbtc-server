module.exports = (fn) => {
  return (req, res, next) => {
    // From http://thecodebarbarian.com/80-20-guide-to-express-error-handling.html and https://medium.com/@Abazhenov/using-async-await-in-express-with-node-8-b8af872c0016
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    Promise.resolve(
      fn(req, res, next)
    ).catch(next);
  };
}
