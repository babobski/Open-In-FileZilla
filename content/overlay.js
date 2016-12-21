/**
 * Namespaces
 */

if (typeof(extensions) === 'undefined') extensions = {};
if (typeof(extensions.openInFileZilla) === 'undefined') extensions.openInFileZilla = { version : '1.0' };
(function() {	
	const { classes: Cc, interfaces: Ci } = Components;
	
	var notify = require("notify/notify"),
		self = this,
		system = require("sdk/system"),
		prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService).getBranch("extensions.openInFileZilla.");
		
		
	this.openCurrentFileInFilezilla = function(){
		var komodo = ko.views.manager.currentView;
		if (komodo === undefined) {
			self._notifcation('No current file');
			return false;
		}
		
		var koDoc = (komodo.koDoc === undefined ? komodo.document : komodo.koDoc);
		if (koDoc === undefined) {
			return false;
		}
		
		var file = koDoc.file;
		if (file === undefined) {
			self._notifcation('Please save the file first');
			return false;
		}
		
		self._openFileZilla(file);
	};
	
	this.openCurrentPlacesFileInFilezilla = function(){
		var item = ko.places.manager.getSelectedItem();
		switch(item.type){
			case 'file':
				self._openFileZilla(item.file);
				break;
			case 'folder':
				self._openFileZilla(item.file, 'folder');
				break;
		}
	};
	
	this._openFileZilla = function(file, type = 'file') {
		var pathFileZilla = prefs.getCharPref('locFileZilla'),
		RCS = Cc["@activestate.com/koRemoteConnectionService;1"].getService(Ci.koIRemoteConnectionService);
		
		if (file === undefined) {
			return false;
		}
		
		if (pathFileZilla.length === 0) {
			self.openWarning();
			return false;
		}
		
		if (file.isRemoteFile) {
			// Remote
			var serverInfo = RCS.getConnectionUsingUri(file.URI);
			var serverPath = type === 'file'? file.dirName : (file.dirName + '/' + file.baseName);
			ko.run.output.kill(); // Kill any running command
			ko.run.command('"' + pathFileZilla + '" ' + serverInfo.username +':"\"'+ serverInfo.password +'"\"@'+serverInfo.server+':'+serverInfo.port + serverPath, {
				"runIn": 'no-console',
				"openOutputWindow": false,	
			});
		} else {
			// Local
			ko.run.output.kill(); // Kill any running command
			var sep = system.platform === 'winnt' ? '\\' : '/'; // os specific sep.
			var localPath = type === 'file'? file.dirName : (file.dirName + sep + file.baseName);
			ko.run.command('"' + pathFileZilla + '" --local="' + localPath + '"', {
				"runIn": 'no-console',
				"openOutputWindow": false,	
			});
		}
	};

	this._selectOutputFile = function(node) {
		var input = node.previousSibling;
		
		var file = ko.filepicker.browseForExeFile();
		
		input.value = file;
		return false;
		
	};
	
	this._openConfig = function() {
		setTimeout(function(){
			self.openSettings();
		}, 1000);
	};
	
	this.openSettings = function() {
		var features = "chrome,titlebar,toolbar,centerscreen";
		window.openDialog('chrome://openInFileZilla/content/pref-overlay.xul', "openInFileZillaSettings", features);
	};
	
	this.openWarning = function() {
		var features = "chrome,titlebar,toolbar,centerscreen";
		window.openDialog('chrome://openInFileZilla/content/config-warning.xul', "openInFileZillaWarning", features, self);
	};

	this._notifcation = function($message){
		$message = $message || false;
		notify.send(
				$message,
				'tools'
		);
	};

}).apply(extensions.openInFileZilla);
