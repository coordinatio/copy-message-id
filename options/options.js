const prefixInput = document.querySelector("#prefix");
const suffixInput = document.querySelector("#suffix");
const copyBracketsInput = document.querySelector("#copyBrackets");
const urlEncodeInput = document.querySelector("#urlEncode");
const rawInput = document.querySelector("#raw");
const iconOnlyInput = document.querySelector("#iconOnly");

/*
Set text boxes to automatically resize.
*/
function autoResize() {
  this.style.height = "5px";
  this.style.height = this.scrollHeight + "px";
}

prefixInput.addEventListener("input", autoResize, false);
suffixInput.addEventListener("input", autoResize, false);

/*
Store the currently selected settings using browser.storage.local.
*/
function storeSettings() {
  browser.storage.local.set({
    copyID: {
      prefix: prefixInput.value,
      suffix: suffixInput.value,
      copyBrackets: copyBrackets.checked,
      urlEncode: urlEncode.checked,
      raw: raw.checked,
      iconOnly: iconOnlyInput.checked
    }
  });
}

/*
Update the options UI with the settings values retrieved from storage,
or the default settings if the stored settings are empty.
*/
function updateUI(storedSettings) {
  if (storedSettings.copyID) {
    prefixInput.value = storedSettings.copyID.prefix;
    suffixInput.value = storedSettings.copyID.suffix;
    copyBracketsInput.checked = storedSettings.copyID.copyBrackets;
    urlEncodeInput.checked = storedSettings.copyID.urlEncode;
    rawInput.checked = storedSettings.copyID.raw;
    iconOnlyInput.checked = storedSettings.copyID.iconOnly ?? false;
  }
}

function onError(e) {
  console.error(e);
}

/*
On opening the options page, fetch stored settings and update the UI with them.
*/
const gettingStoredSettings = browser.storage.local.get();
gettingStoredSettings.then(updateUI, onError);

/*
On checkbox change, save the currently selected settings.
*/
copyBracketsInput.addEventListener("change", storeSettings);
urlEncodeInput.addEventListener("change", storeSettings);
rawInput.addEventListener("change", storeSettings);
iconOnlyInput.addEventListener("change", storeSettings);

/*
On textbox blur, save the currently selected settings.
*/
prefixInput.addEventListener("blur", storeSettings);
suffixInput.addEventListener("blur", storeSettings);

const shortcutInput = document.querySelector("#shortcut");
const shortcutReset = document.querySelector("#shortcut-reset");
const shortcutError = document.querySelector("#shortcut-error");
const COMMAND_NAME = "copy-message-id";

async function loadShortcut() {
  const commands = await browser.commands.getAll();
  const cmd = commands.find(c => c.name === COMMAND_NAME);
  shortcutInput.value = (cmd && cmd.shortcut) ? cmd.shortcut : "";
}

function keyEventToShortcut(e) {
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return null;
  const modifiers = [];
  if (e.ctrlKey)  modifiers.push("Ctrl");
  if (e.altKey)   modifiers.push("Alt");
  if (e.shiftKey) modifiers.push("Shift");
  if (e.metaKey)  modifiers.push("Command");
  if (modifiers.length === 0) return null;
  const keyMap = {
    " ": "Space", "ArrowUp": "Up", "ArrowDown": "Down",
    "ArrowLeft": "Left", "ArrowRight": "Right",
    ",": "Comma", ".": "Period",
  };
  let key = keyMap[e.key] ?? e.key;
  if (key.length === 1) key = key.toUpperCase();
  return [...modifiers, key].join("+");
}

shortcutInput.addEventListener("focus", () => {
  shortcutInput.placeholder = "Press shortcut…";
  shortcutError.textContent = "";
});

shortcutInput.addEventListener("blur", () => {
  shortcutInput.placeholder = "";
});

shortcutInput.addEventListener("keydown", async (e) => {
  e.preventDefault();
  if (e.key === "Escape") { shortcutInput.blur(); return; }
  const shortcut = keyEventToShortcut(e);
  if (!shortcut) return;
  try {
    await browser.commands.update({ name: COMMAND_NAME, shortcut });
    shortcutInput.value = shortcut;
    shortcutError.textContent = "";
  } catch (err) {
    shortcutError.textContent = "Invalid shortcut: " + err.message;
  }
});

shortcutReset.addEventListener("click", async () => {
  try {
    await browser.commands.reset(COMMAND_NAME);
    await loadShortcut();
    shortcutError.textContent = "";
  } catch (err) {
    shortcutError.textContent = "Reset failed: " + err.message;
  }
});

loadShortcut();
