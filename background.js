browser.commands.onCommand.addListener(async (command) => {
	if (command !== "copy-message-id") return;
	try {
		await browser.messageDisplayAction.openPopup();
	} catch (error) {
		console.error("Copy Message ID shortcut failed: " + error.message);
	}
});
