# Atom-to-Photoshop

[![npm-image](https://img.shields.io/badge/atom%20to%20photoshop-v2.0.1-09bc00.svg)](https://github.com/JavierAroche/atom-to-photoshop)

### Description
---------
Atom to Photoshop is an extension for [Atom](https://atom.io/) that allows you to execute a JSX file in Photoshop.

### How to Install
---------
Search for the **Atom-To-Photoshop** package in Atom.

### Usage
---------
This extension works on Atom's current document.

If your file is saved, the extension will execute the script using its local path, otherwise it will execute it through a temporary file.

Click on the **atom-to-photoshop > Run** menu item, or hit the shortcut **ctrl-alt-shift-p** to execute your script.

Shortcuts:
* Run - **ctrl-alt-shift-p**
* Toggle Console - **ctrl-alt-shift-o**
* Clear Console - **ctrl-alt-shift-c**

### Include external files
---------
If your script file is saved, the extension will load your script path and execute it. This makes it easier to use ExtendScript's #include to load relative external files.

```
#include "~/Development/personal/descriptor-info/jsx/descriptor-info.jsx"
```

If your file is not saved, the extension will execute your script through a temporary file, making it impossible to load external relative files using #include. Absolute paths will always work.


### Polyfills
---------
atom-to-photoshop includes by default 3 JavaScript polyfills, which you can use in your code at any time.
* JSON.stringify
* JSON.parse
* Array.forEach

### Log to the console
---------
This extension has an internal module that recreates JavaScript's console module, including a way to log a JSON.stringify response.

You can use functions in your code such as:
```
console.log( 'Hello' );
// Returns: [log: 16:16:2.649] Hello

console.info( 'Hello' );
// Returns: [info: 16:16:23.823] Hello

console.error( 'Hello' );
// Returns: [error: 16:16:37.985] Hello

console.stringify( { foo : 'bar' } );
// Returns: [stringify: 16:16:50.185] {
    "foo": "bar"
}
```

This extension also allows the use of ExtendScript's native $.write and $.writeln functions to log to the console using JSON.stringify.
```
$.writeln( "Hello" );
// Returns: [log: 16:20:34.337] "Hello"

$.write( "Hello" );
// Returns: [log: 16:20:37.171] "Hello"
```

### Anatomy of a log
---------
**Successful execution**
```
function foo() {
    return app.name;
}
foo();
// Returns: [11:10:02] Result: Adobe Photoshop
```
Breakdown:
* **[11:10:02]** --> Time stamp of when the extension executed the script
* **Result: Adobe Photoshop** --> Message received from the Adobe application mimicking ExtendScript's "Result:" log

**console.log**
```
console.log( 'Hello' );
// Returns: [log: 11:10:02.649] Hello
```
Breakdown:
* **[log: 16:16:2.649]** --> Time stamp of when the console.log function was executed inside your script
* **Hello** --> Message received from the Adobe application

**Error in execution**
```
return app.name;
// Returns: [11:10:02] 78:256: execution error: Adobe Photoshop CC 2015 got an error: General Photoshop error occurred. This functionality may not be available in this version of Photoshop.
- Error 30: Illegal 'return' outside of a function body.
Line: 1
```
Breakdown:
* **[11:10:02]** --> Time stamp of when the extension executed the script through Node
* **78:256: execution error: Adobe Photoshop CC 2015 got an error: General Photoshop error occurred. This functionality may not be available in this version of Photoshop.** --> Execution error received from Photoshop
* **- Error 30: Illegal 'return' outside of a function body.** --> Descriptive error
* **Line: 1** --> Line in your script that triggered the error


### Console
---------
A console will show up at the bottom of your editor displaying any messages returned from the executed script. Errors will display in red.

![atom-to-photoshop-console](https://raw.githubusercontent.com/JavierAroche/atom-to-photoshop/master/images/atom-to-photoshop-console.png)

### Known Limitations
---------
* This extension uses Photoshop's AppleScript API, so it will only work for MacOS users at the moment.

### Changelog
---------
[Atom to Photoshop Changelog](https://github.com/JavierAroche/atom-to-photoshop/blob/master/CHANGELOG.md)

### License
---------
MIT © Javier Aroche
