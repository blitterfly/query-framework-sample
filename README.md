# Query Framework Code Sample

A while back I decided I wanted to learn how to create a JavaScript API, and so I started work on the
generically-named “QueryFramework.” This is a set of JavaScript objects that behaves very similar to
jQuery, but rather than look at how jQuery was written, I decided to write my functions blind. Afterwards
when I compared the two, the implementations were similar in some cases and very different in others.

All code has accompanying unit tests written in [qUnit](http://qunitjs.com/). While the tests here are
far from comprehensive, it should at least demonstrate my familiarity with test-writing techniques.

The framework contains several different pieces.

## QueryFramework

The base QueryFramework object (framework.js) is capable of doing basic selection, DOM traversal,
and node manipulation. I relied on the querySelector API rather than write my own from scratch 
(for sanity’s sake), so this code only works in IE8+ and recent versions of Firefox, Chrome,
Safari, etc.

## AJAX

The AJAX module (framework-ajax.js) is a plugin for the main QueryFramework library that supports
basic asynchronous GET/POST operations.

## Templates

The Templates module (framework-template.js) is a plugin for the main QueryFramework library that
supports a simple set of one-way (read-only, read-once) display templates.

## Threads

While not “threads” in the true sense of the word, the Threads module adds timer management to the
QueryFramework library, auto-executing a queue of functions on a repeating basis.