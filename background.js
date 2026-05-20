browser.commands.onCommand.addListener(async (command) => {
	if (command !== "copy-message-id") {
		return;
	}

	try {
		let tabs = await browser.tabs.query({active: true, currentWindow: true});
		if (tabs.length != 1) {
			throw new Error("Expected a single selected tab (got " + tabs.length + ")");
		}

		let tabId = tabs[0].id;
		let message = await browser.messageDisplay.getDisplayedMessage(tabId);
		if (!message) {
			throw new Error("No message selected");
		}

		var options = {
			prefix: "",
			suffix: "",
			copyBrackets: false,
			urlEncode: false,
		};
		let config = await browser.storage.local.get("copyID");
		if (config.copyID) {
			options = config.copyID;
		}

		let parts = await browser.messages.getFull(message.id);
		let message_id = parts.headers["message-id"][0];

		if (!options.copyBrackets &&
				message_id[0] == '<' &&
				message_id[message_id.length - 1] == '>') {
			message_id = message_id.slice(1, -1);
		}
		if (options.urlEncode) {
			message_id = encodeURIComponent(message_id);
		}

		let s = options.prefix + message_id + options.suffix;
		await navigator.clipboard.writeText(s);
	} catch (error) {
		console.error("Copy Message ID shortcut failed: " + error.message);
	}
});
