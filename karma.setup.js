/* eslint-disable import/no-unassigned-import */

// Load our polyfills before anything else
import 'babel-polyfill';

/********************************************************************************
 *  Globals
 ********************************************************************************/

// Were Karma not Jest
global.jest = false;

// Remove the stack trace limit for better error reporting
Error.stackTraceLimit = Infinity;

/********************************************************************************
 *  Load Tests
 ********************************************************************************/

/**
 *  Load our test modules
 *
 *  @return {Array} The array of module contexts
 */
function loadTests() {
  let modules = [];

  // Get the tests in our src directory
  modules.push(require.context('./src', true, /\.(js|ts)$/im));

  return modules;
}

/**
 *  Run our test modules
 *
 *  @param {Array} contexts The array of module contexts
 *
 *  @return {undefined}
 */
function runTests(contexts) {
  contexts.forEach((context) => context.keys().forEach(context)); // eslint-disable-line unicorn/no-fn-reference-in-iterator
}

// Run
runTests(loadTests());
