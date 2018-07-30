// This should be a real typescript file but we're having trouble
// finding the AppWindow type which has a contentWindow on it.
let commandWindow

chrome.app.runtime.onLaunched.addListener(function() {
	if (commandWindow && !commandWindow.contentWindow.closed) {
		commandWindow.focus();
	} else {
		chrome.app.window.create('index.html',
			{id: "mainwin", innerBounds: {width: 800, height: 609, left: 0}},
			function(w) {
				commandWindow = w;
			});
	}
});
