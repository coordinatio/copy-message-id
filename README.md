# Copy Message ID

This is an extension that adds a button to the message header toolbar to
copy the message ID to the clipboard. This is useful for sending email
replies via the command line.

## Installation

### Get it from the Mozilla add-ons platform

[Located
here](https://addons.mozilla.org/en-US/thunderbird/addon/copy-message-id/)

### Install it manually

1. Checkout this repo
2. Run `make` to generate the `xpi` file.
3. In Thunderbird, go to the `Add-ons Manager`.
4. Click `Install Add-on From File...` and select the `xpi` file from step 2.

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
Open any message and click the **Copy Message ID** button (or use the keyboard
shortcut) to test the addon.

Re-running `make test-install` reinstalls the latest build into the same
profile — no need to restart or toggle the addon.
