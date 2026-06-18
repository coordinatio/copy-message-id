# Copy Message ID and Subject

This extension adds a button to the message view toolbar that copies either the
**Subject** or the **Message-ID** of the displayed message to the clipboard.
Copying the Message-ID is useful when referencing an email from the command line
(e.g. `git send-email --in-reply-to`); copying the Subject is handy for bug
tracker entries, chat references, and notes.

The toolbar button opens a small menu with two entries:

- **Copy Message ID**
- **Copy Subject**

Two keyboard shortcuts are provided for one-keystroke access (configurable in
the add-on's options page):

- `Ctrl+Alt+O` — copy Message-ID
- `Ctrl+Shift+O` — copy Subject

## Installation

### Get it from the Mozilla add-ons platform

[Located
here](https://addons.mozilla.org/en-US/thunderbird/addon/copy-message-id/)

### Install it manually

1. Checkout this repo
2. Run `make` to generate the `xpi` file.
3. In Thunderbird, go to the `Add-ons Manager`.
4. Click `Install Add-on From File...` and select the `xpi` file from step 2.

## Options

Open the add-on's options page to configure:

- **Prefix / Suffix** — wrapped around the copied value (applies to both
  Message-ID and Subject).
- **Include angle brackets** — keep the `<>` around the Message-ID
  (Message-ID only).
- **URL encode** — percent-encode the copied value.
- **Raw Message-ID header** — copy the verbatim `Message-ID:` header line(s)
  from the raw message source (Message-ID only).
- **Compact button** — show icon only, no text label.
- **Keyboard shortcuts** — re-bind or reset both shortcuts.

## Development

### Dependencies

The build requires **GNU Make** and **Node.js**, plus a zip tool.

#### Windows

- **GNU Make** — install via [Chocolatey](https://chocolatey.org): `choco install make`
  or download from [GnuWin32](https://gnuwin32.sourceforge.net/packages/make.htm)
- **Node.js** — download from [nodejs.org](https://nodejs.org)
- **7-Zip** — download from [7-zip.org](https://www.7-zip.org). The build script
  finds it automatically in `Program Files` without needing it on your PATH.

#### Linux

- **GNU Make** — `sudo apt install make` / `sudo dnf install make`
- **Node.js** — `sudo apt install nodejs` / `sudo dnf install nodejs`
- **zip** — `sudo apt install zip` / `sudo dnf install zip`

### Building

```sh
make        # builds copy-message-id@j.kahn.xpi
make clean  # removes built xpi files
```

### Testing locally

`make test-install` builds the XPI, installs it into a dedicated
`thunderbird-test` profile, populates an inbox with the emails from `tests/`,
and launches Thunderbird automatically:

```sh
make test-install
```

Thunderbird will open with a fresh profile containing all the test messages.
Open any message and click the toolbar button to choose **Copy Message ID** or
**Copy Subject** from the menu (or press `Ctrl+Alt+O` / `Ctrl+Shift+O` to copy
directly without opening the menu).

A small badge (`✓` green / `✗` red) flashes on the toolbar button for ~1.5s to
confirm the result of the copy.

Re-running `make test-install` reinstalls the latest build into the same
profile — no need to restart or toggle the addon.
