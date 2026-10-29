# Security policy

## Supported versions

Only the latest release on npm gets security fixes. The automatic update, or `npx ai-profile-switch@latest update`, brings you to it.

## Reporting a vulnerability

Please don't open a public issue. Email **haejun7388@gmail.com** with:

- what an attacker could do, and to whom
- the version, operating system and shell
- steps to reproduce, or a proof of concept

Leave out real tokens, Keychain items and `.credentials.json` contents. A made-up value shows the problem just as well.

You'll get a reply as soon as possible. Once a fix is released, the report can be made public, with credit if you want it.

## What is in scope

ai-profile-switch handles sensitive things, so these areas matter most:

- Sign-in data: macOS Keychain items, and `.credentials.json` copies on Linux, WSL and Windows
- The lines it adds to shell startup files (`.zshrc`, `.bashrc`, `config.fish`, PowerShell profiles)
- The self-update, which downloads a package from npm and switches to it
- Links and copies between profiles and `_shared`, such as following a link out of the profiles folder
