async function updateButtonTitle() {
	const commands = await browser.commands.getAll();
	const cmd = commands.find(c => c.name === "copy-message-id");
	const shortcut = cmd && cmd.shortcut ? ` (${cmd.shortcut})` : "";
	await browser.messageDisplayAction.setTitle({ title: "Copy Message ID" + shortcut });
	await browser.messageDisplayAction.setLabel({ label: "Copy Message ID" });
}

updateButtonTitle();

browser.commands.onChanged.addListener(({ name }) => {
	if (name === "copy-message-id") updateButtonTitle();
});

browser.commands.onCommand.addListener(async (command) => {
	if (command !== "copy-message-id") return;
	try {
		await browser.messageDisplayAction.openPopup();
	} catch (error) {
		console.error("Copy Message ID shortcut failed: " + error.message);
	}
});
