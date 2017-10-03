'use babel';

/*
 * atom-to-photoshop (Atom extension)
 *
 * atom-to-photoshop
 * Author: Javier Aroche
 *
 */

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

import AtomToPhotoshopView from './atom-to-photoshop-view';
import { CompositeDisposable } from 'atom';

export default {
	atomToPhotoshopView: null,
	modalPanel: null,
	subscriptions: null,

	/*
	 * Initial function to run when Atom activates
	 * @public
	 */
	activate() {
		this.atomToPhotoshopView = new AtomToPhotoshopView();
		this.modalPanel = atom.workspace.addBottomPanel({
			item: this.atomToPhotoshopView.getElement(),
			visible: false
		});

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Register commands
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'atom-to-photoshop:run': () => this.run()
		}));
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'atom-to-photoshop:toggleConsole': () => this.toggleConsole()
		}));
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'atom-to-photoshop:clearConsole': () => this.clearConsole()
		}));

		this.pathToHelpers = path.resolve(__dirname, './jsx/Helpers.jsx');
		this.pathToJSX = path.resolve(__dirname, './tmp/script.jsx');
		this.logFile = path.resolve(__dirname, './tmp/log.txt');
	},

	/*
	 * Deactivate / destroy panel, view and subscriptions
	 * @public
	 */
	deactivate() {
		this.modalPanel.destroy();
		this.subscriptions.dispose();
		this.atomToPhotoshopView.destroy();
	},

	/*
	 * Serialize
	 * @public
	 */
	serialize() {
		return {
			atomToPhotoshopViewState: this.atomToPhotoshopView.serialize()
		};
	},

	/*
	 * Toggle console on and off
	 * @public
	 */
	toggleConsole() {
		if (this.modalPanel.isVisible()) {
			this.modalPanel.hide();
		} else {
			this.modalPanel.show();
		}
	},

	/*
	 * Find the latest Photoshop version installed using mdfind and parsing the results
	 * @private
	 */
	_findLatestPhotoshopVersion() {
		var self = this;
		return new Promise(function(resolve, reject) {
			var osascriptCommand = "mdfind \"kMDItemCFBundleIdentifier == 'com.adobe.Photoshop'\"";
			exec(osascriptCommand, {
				maxBuffer: 1024 * 100000
			}, (error, stdout, stderr) => {
				if (error) {
					self.atomToPhotoshopView._sendMessageToConsole('Error: ' + stderr, 'error');
				} else {
					var output = stdout.split('\n');
					if(output[0] !== '') {
						resolve(output[0]);
					} else {
						console.log('No Photoshop version found in system.');
						reject();
					}
				}
			});
		});
	},

	/*
	 * Open latest version of Photoshop installed
	 * @private
	 * @param {String} Photoshop version
	 */
	_openPhotoshop(photoshopVersion) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var osascriptCommand = 'open -a \"' + photoshopVersion + '\"';
			exec(osascriptCommand, {
				maxBuffer: 1024 * 100000
			}, (error, stdout, stderr) => {
				if (error) {
					self.atomToPhotoshopView._sendMessageToConsole('Error: ' + stderr, 'error');
					reject();
				} else {
					resolve();
				}
			});
		});
	},

	/*
	 * Write JSX script to file
	 * @private
	 * @param {String} JSX script
	 */
	_writeToFile(jsxScript) {
		var self = this;
		return new Promise(function(resolve, reject) {
			fs.writeFile(self.pathToJSX, jsxScript, function(err) {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			})
		});
	},

	/*
	 * Get current text editor info
	 * @private
	 */
	_getCurrentTextEditorInfo() {
		var currentTextEditor = atom.workspace.getActiveTextEditor();
		return {
			isModified: currentTextEditor.isModified(),
			path: currentTextEditor.getPath(),
			text: currentTextEditor.getText()
		};
	},

	/*
	 * Main run function
	 * @public
	 */
	run() {
		var self = this;
		this.modalPanel.show();
		this._clearLogFile();
		var initialExecutionTime = new Date().getTime();
		var currentTextEditor = this._getCurrentTextEditorInfo();
		var jsxScriptWithHelper;
		if(currentTextEditor.isModified) {
			jsxScriptWithHelper = '#include ' + this.pathToHelpers + '\n\n' + currentTextEditor.text;
		} else {
			jsxScriptWithHelper = '#include ' + this.pathToHelpers + '\n\n' + '#include ' + currentTextEditor.path;
		}

		this._writeToFile(jsxScriptWithHelper)
			.then(function() {
				return self._findLatestPhotoshopVersion();
			})
			.then(function(photoshopVersion) {
				return self._openPhotoshop(photoshopVersion);
			})
			.then(function() {
				var commandToExecute = "osascript -e 'with timeout of 2592000 seconds" + "\n" + "tell application id \"com.adobe.Photoshop\" to do javascript (\"#include " + self.pathToJSX + "\") \n end timeout'";
				exec(commandToExecute, {
					maxBuffer: 1024 * 100000
				}, function (error, stdout, stderr) {
					// Read log file
					self._readLogFile();
					// Send execution time to console
					var newDate = new Date();
					var finalExecutionTime = newDate.getTime();
					var dateFormat = newDate.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");

					var executionTime = (finalExecutionTime - initialExecutionTime) * 0.001;
					// Send to console
					self.atomToPhotoshopView._sendMessageToConsole('Execution Time: ' + executionTime.toFixed(3) + ' seconds', 'execution');

					if (error) {
						self.atomToPhotoshopView._sendMessageToConsole('[' + dateFormat + '] Error: ' + stderr, 'error');
					}

					if (stdout) {
						// Log the result, mimicking ExtendScript's 'Result' log
						self.atomToPhotoshopView._sendMessageToConsole('[' + dateFormat + '] Result: ' + stdout, 'log');
					}
				});
			})
			.catch(function(err) {
				self.atomToPhotoshopView._sendMessageToConsole('Error: ' + err, 'error');
			})
	},

	/*
	 * Read log file after executing JSX
	 * @private
	 */
	_readLogFile() {
		var self = this;
		var theLogs = fs.readFileSync(this.logFile, 'utf8').toString().split('##');
		theLogs.shift();
		// Log to the console
		theLogs.forEach(function (log) {
			self.atomToPhotoshopView._sendMessageToConsole(log);
		});
	},

	/*
	 * Clear log file after executing JSX and reading log file
	 * @private
	 */
	_clearLogFile() {
		fs.writeFileSync(this.logFile, '');
	},

	/*
	 * Clear the console
	 * @public
	 */
	clearConsole() {
		this.atomToPhotoshopView.clearConsole();
	}
};
