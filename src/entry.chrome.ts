// This should be a real typescript file but we're having trouble
// finding the AppWindow type which has a contentWindow on it.
let commandWindow:AppWindow

chrome.app.runtime.onLaunched.addListener(function() {
	if (commandWindow && !commandWindow.contentWindow.closed) {
		commandWindow.focus();
	} else {
		chrome.app.window.create('dist/index.html',
			{id: "mainwin", innerBounds: {width: 500, height: 309, left: 0}},
			function(w) {
				commandWindow = w;
			});
	}
});
