/**
 *  Copyright (c) 2017 Layer3 TV. All rights reserved.
 *
 *  @file karma.setup.js
 *  @author Pat Herlihy <pherlihy@layer3tv.com>
 *  @description Setup our environment for testing with Karma
 */

/* eslint-disable import/no-unassigned-import */

// Load our polyfills before anything else
import 'babel-polyfill';

// Import the webpack loader for aurelia
import 'aurelia-loader-webpack';

// Import our jasmine installers
import { install as installJestAsync } from 'jest-jasmine2/jasmine_async';
import expect from 'expect';

/********************************************************************************
 *  Jest Compatability
 ********************************************************************************/

// Install async globally
installJestAsync(global);

/**
 *  Install a non-snapshot version of jest-jasmine2/jasmine-expect
 *
 *  @return {undefined}
 */
function installJestExpect() {
  // Use jest for our global expect
  global.expect = expect;

  // Extend Jasmine with Jest matchers
  const jasmine = global.jasmine;
  jasmine.anything = expect.anything;
  jasmine.any = expect.any;
  jasmine.objectContaining = expect.objectContaining;
  jasmine.arrayContaining = expect.arrayContaining;
  jasmine.stringMatching = expect.stringMatching;

  // Set Jest matchers to use the Jasmine matchers result
  jasmine.addMatchers = (jasmineMatchers) => {
    const jestMatchers = {};
    Object.keys(jasmineMatchers).forEach((matcher) => {
      jestMatchers[matcher] = (...args) => {
        const result = jasmineMatchers[matcher]();
        const compare = result.negativeCompare || result.compare;
        return (this.isNot) ? compare(...args) : result.compare(...args);
      };
    });

    const globalExpect = global.expect;
    globalExpect.extend(jestMatchers);
  };
}
installJestExpect();

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
  modules.push(require.context('../src', true, /\.(js|ts)$/im));

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
