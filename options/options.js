const prefixInput = document.querySelector("#prefix");
const suffixInput = document.querySelector("#suffix");
const subjectPrefixInput = document.querySelector("#subject-prefix");
const subjectSuffixInput = document.querySelector("#subject-suffix");
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
subjectPrefixInput.addEventListener("input", autoResize, false);
subjectSuffixInput.addEventListener("input", autoResize, false);

/*
Store the currently selected settings using browser.storage.local.
*/
function storeSettings() {
  browser.storage.local.set({
    copyID: {
      prefix: prefixInput.value,
      suffix: suffixInput.value,
      subjectPrefix: subjectPrefixInput.value,
      subjectSuffix: subjectSuffixInput.value,
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
    subjectPrefixInput.value = storedSettings.copyID.subjectPrefix ?? "";
    subjectSuffixInput.value = storedSettings.copyID.subjectSuffix ?? "";
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
subjectPrefixInput.addEventListener("blur", storeSettings);
subjectSuffixInput.addEventListener("blur", storeSettings);

const shortcutInput = document.querySelector("#shortcut");
const shortcutReset = document.querySelector("#shortcut-reset");
const shortcutError = document.querySelector("#shortcut-error");
const COMMAND_NAME = "copy-message-id";

const shortcutSubjectInput = document.querySelector("#shortcut-subject");
const shortcutSubjectReset = document.querySelector("#shortcut-subject-reset");
const shortcutSubjectError = document.querySelector("#shortcut-subject-error");
const COMMAND_NAME_SUBJECT = "copy-subject";

async function loadShortcut(input, commandName) {
  const commands = await browser.commands.getAll();
  const cmd = commands.find(c => c.name === commandName);
  input.value = (cmd && cmd.shortcut) ? cmd.shortcut : "";
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

function wireShortcut(input, resetBtn, errorEl, commandName) {
  input.addEventListener("focus", () => {
    input.placeholder = "Press shortcut…";
    errorEl.textContent = "";
  });

  input.addEventListener("blur", () => {
    input.placeholder = "";
  });

  input.addEventListener("keydown", async (e) => {
    e.preventDefault();
    if (e.key === "Escape") { input.blur(); return; }
    const shortcut = keyEventToShortcut(e);
    if (!shortcut) return;
    try {
      await browser.commands.update({ name: commandName, shortcut });
      input.value = shortcut;
      errorEl.textContent = "";
    } catch (err) {
      errorEl.textContent = "Invalid shortcut: " + err.message;
    }
  });

  resetBtn.addEventListener("click", async () => {
    try {
      await browser.commands.reset(commandName);
      await loadShortcut(input, commandName);
      errorEl.textContent = "";
    } catch (err) {
      errorEl.textContent = "Reset failed: " + err.message;
    }
  });
}

wireShortcut(shortcutInput, shortcutReset, shortcutError, COMMAND_NAME);
wireShortcut(shortcutSubjectInput, shortcutSubjectReset, shortcutSubjectError, COMMAND_NAME_SUBJECT);

loadShortcut(shortcutInput, COMMAND_NAME);
loadShortcut(shortcutSubjectInput, COMMAND_NAME_SUBJECT);
