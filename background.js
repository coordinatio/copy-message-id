// --- Button label / title management ----------------------------------------

const DEFAULT_LABEL = "Copy Message ID / Subject";

async function updateButtonLabel() {
	const commands = await browser.commands.getAll();
	const cmdId = commands.find(c => c.name === "copy-message-id");
	const cmdSubj = commands.find(c => c.name === "copy-subject");
	const sid = cmdId && cmdId.shortcut ? cmdId.shortcut : "";
	const ssubj = cmdSubj && cmdSubj.shortcut ? cmdSubj.shortcut : "";
	const parts = ["Copy Message ID / Subject"];
	if (sid || ssubj) {
		parts.push(`(ID: ${sid || "—"} · Subject: ${ssubj || "—"})`);
	}
	await browser.messageDisplayAction.setTitle({ title: parts.join(" ") });

	const config = await browser.storage.local.get("copyID");
	const iconOnly = config.copyID?.iconOnly ?? false;
	await browser.messageDisplayAction.setLabel({ label: iconOnly ? "" : DEFAULT_LABEL });
}

updateButtonLabel();

browser.commands.onChanged.addListener(({ name }) => {
	if (name === "copy-message-id" || name === "copy-subject") updateButtonLabel();
});

browser.storage.onChanged.addListener((changes, area) => {
	if (area === "local" && changes.copyID) updateButtonLabel();
});

// --- Menu items -------------------------------------------------------------

const MENU_ID_COPY_ID = "copy-id";
const MENU_ID_COPY_SUBJECT = "copy-subject";

browser.menus.create({
	id: MENU_ID_COPY_ID,
	title: "Copy Message ID",
	contexts: ["message_display_action_menu"]
});

browser.menus.create({
	id: MENU_ID_COPY_SUBJECT,
	title: "Copy Subject",
	contexts: ["message_display_action_menu"]
});

// --- Options handling -------------------------------------------------------

const DEFAULT_OPTIONS = {
	prefix: "",
	suffix: "",
	subjectPrefix: "",
	subjectSuffix: "",
	copyBrackets: false,
	urlEncode: false,
	raw: false,
	iconOnly: false
};

async function getOptions() {
	const { copyID } = await browser.storage.local.get("copyID");
	return { ...DEFAULT_OPTIONS, ...(copyID || {}) };
}

// --- Extractors -------------------------------------------------------------

// Returns the raw Message-ID header line(s) exactly as found in the message
// source, joined and trimmed. Throws if no Message-ID header is present.
async function extractRawMessageIdHeader(message) {
	const raw = await browser.messages.getRaw(message.id);

	const parts = raw.split(/\n\n|\r\n\r\n|\r\r/);

	const lines = parts[0].match(/^.*((\n|\r\n|\r)|$)/gm);

	let message_id = "";
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Match the Message-ID tag, case insensitive.
		if (line.match(/^message-id:/im)) {
			message_id = line;
		} else if (message_id != "") {
			// Subsequent lines of a message ID spread across multiple lines
			// must start with whitespace
			if (!/^\s/.test(line)) {
				break;
			}
			message_id += line;
		}
	}
	if (message_id == "") {
		throw new Error("No Message-ID found in raw email text");
	}
	return message_id.trimEnd();
}

// Returns the canonical (parsed) Message-ID value, e.g. <foo@bar>.
async function extractMessageId(message) {
	let parts = await browser.messages.getFull(message.id);
	let headers = parts.headers["message-id"];
	if (!headers || !headers.length) {
		throw new Error("No Message-ID header");
	}
	return headers[0];
}

// --- Copy plumbing ----------------------------------------------------------

async function getActiveTab() {
	let tabs = await browser.tabs.query({ active: true, currentWindow: true });
	if (tabs.length !== 1) {
		throw new Error("Expected a single selected tab (got " + tabs.length + ")");
	}
	return tabs[0];
}

async function getDisplayedMessageForTab(tabId) {
	let message = await browser.messageDisplay.getDisplayedMessage(tabId);
	if (!message) {
		throw new Error("No message selected");
	}
	return message;
}

async function copyToClipboard(text) {
	await navigator.clipboard.writeText(text);
}

function applyOptions(value, options, isMessageId) {
	let out = value;
	if (isMessageId && !options.copyBrackets &&
		out[0] == '<' &&
		out[out.length - 1] == '>') {
		out = out.slice(1, -1);
	}
	if (options.urlEncode) {
		out = encodeURIComponent(out);
	}
	const pre = isMessageId ? options.prefix : options.subjectPrefix;
	const suf = isMessageId ? options.suffix : options.subjectSuffix;
	return pre + out + suf;
}

async function performCopy(message, what) {
	const options = await getOptions();
	let value;
	if (what === "subject") {
		if (!message.subject) {
			throw new Error("No Subject header");
		}
		value = message.subject;
	} else {
		value = options.raw
			? await extractRawMessageIdHeader(message)
			: await extractMessageId(message);
	}
	const s = applyOptions(value, options, what !== "subject");
	await copyToClipboard(s);
	return s;
}

// --- Badge feedback ---------------------------------------------------------

const badgeTimeouts = new Map();

async function flashBadge(tabId, success) {
	const details = { text: success ? "✓" : "✗", tabId };
	await browser.messageDisplayAction.setBadgeText(details);
	await browser.messageDisplayAction.setBadgeBackgroundColor({
		color: success ? "#2e7d32" : "#c62828",
		tabId
	});
	const prev = badgeTimeouts.get(tabId);
	if (prev) clearTimeout(prev);
	badgeTimeouts.set(tabId, setTimeout(() => {
		browser.messageDisplayAction.setBadgeText({ text: "", tabId });
		badgeTimeouts.delete(tabId);
	}, 1500));
}

// --- Top-level action runner ------------------------------------------------

async function runCopyAction(tabId, what) {
	try {
		const message = await getDisplayedMessageForTab(tabId);
		const copied = await performCopy(message, what);
		console.log(`Copied ${what}: ${copied}`);
		await flashBadge(tabId, true);
	} catch (error) {
		console.error(`Failed to copy ${what}: ${error.message}`);
		await flashBadge(tabId, false);
	}
}

// --- Event wiring -----------------------------------------------------------

browser.menus.onClicked.addListener(async (info, tab) => {
	if (!tab) return;
	if (info.menuItemId === MENU_ID_COPY_ID) {
		await runCopyAction(tab.id, "id");
	} else if (info.menuItemId === MENU_ID_COPY_SUBJECT) {
		await runCopyAction(tab.id, "subject");
	}
});

browser.commands.onCommand.addListener(async (command) => {
	let what = null;
	if (command === "copy-message-id") what = "id";
	else if (command === "copy-subject") what = "subject";
	if (!what) return;
	try {
		const tab = await getActiveTab();
		await runCopyAction(tab.id, what);
	} catch (error) {
		console.error(`Shortcut ${command} failed: ${error.message}`);
	}
});
