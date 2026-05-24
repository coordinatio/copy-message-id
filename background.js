async function updateButtonLabel() {
	const commands = await browser.commands.getAll();
	const cmd = commands.find(c => c.name === "copy-message-id");
	const shortcut = cmd && cmd.shortcut ? ` (${cmd.shortcut})` : "";
	await browser.messageDisplayAction.setTitle({ title: "Copy Message ID" + shortcut });

	const config = await browser.storage.local.get("copyID");
	const iconOnly = config.copyID?.iconOnly ?? false;
	await browser.messageDisplayAction.setLabel({ label: iconOnly ? "" : "Copy Message ID" });
}

updateButtonLabel();

browser.commands.onChanged.addListener(({ name }) => {
	if (name === "copy-message-id") updateButtonLabel();
});

browser.storage.onChanged.addListener((changes, area) => {
	if (area === "local" && changes.copyID) updateButtonLabel();
});

browser.commands.onCommand.addListener(async (command) => {
	if (command !== "copy-message-id") return;
	try {
		await browser.messageDisplayAction.openPopup();
	} catch (error) {
		console.error("Copy Message ID shortcut failed: " + error.message);
	}
});
