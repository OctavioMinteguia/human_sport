// Single place for server-side logging so the output target can change later.
module.exports = {
  info:  (...args) => console.log(...args),
  error: (...args) => console.error(...args)
};
