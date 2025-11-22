/**
 * Monkey-patch decorates inspired by https://me.dt.in.th/page/JavaScript-override/.
 *
 * @example Patch String#replaceAll() to always return uppercase
 * ```js
 * override(String.prototype, 'replaceAll', chain(function(value) {
 *   return value.toUpperCase();
 * }));
 * ```
 */

/**
 * Run a function after executing another, returning the result of the original function.
 */
export function after(fn) {
  return function(original) {
    return function() {
      const result = original.apply(this, arguments);
      fn.apply(this, arguments);
      return result;
    };
  };
}

/**
 * Run a function before executing another, returning the result of the original function.
 */
export function before(fn) {
  return function(original) {
    return function() {
      fn.apply(this, arguments);
      return original.apply(this, arguments);
    };
  };
}

/**
 * Compose an additional function in a chain, returning the result of the chained function. The chained function is
 * passed the results of the original function.
 */
export function chain(fn) {
  return function(original) {
    return function() {
      return fn.call(this, original.apply(this, arguments));
    };
  };
}

/**
 * Monkey-patch a function on an object.
 */
export function override(object, method, callback) {
  object[method] = callback(object[method]);
}
