# Contributing to ai-profile-switch

Thanks for helping. This guide covers how to set up the project, how to try a change without touching your own Claude profiles, and how to send a pull request.

## Ways to help

- **Pick a small task.** Issues labeled [`good first issue`](https://github.com/ftery0/ai-profile-switch/labels/good%20first%20issue) are small and explain where to look.
- **Add support for another AI coding CLI.** The tool works with Claude Code today. [#23](https://github.com/ftery0/ai-profile-switch/issues/23) collects the design, and issues labeled [`new tool`](https://github.com/ftery0/ai-profile-switch/labels/new%20tool) cover Codex, Gemini CLI, Grok CLI and others.
- **Improve the docs.** The site lives in `website/` (English) and `website/ko/` (Korean).
- **Report a bug or suggest a feature** with the [issue forms](https://github.com/ftery0/ai-profile-switch/issues/new/choose).

Before you start on something big, comment on the issue (or open one) so we can agree on the approach first. If you want to take an issue, say so in a comment so nobody else works on it at the same time.

## Set up

You need git and Node.js 18.19 or later (20.10 or later on the 20 line).

```bash
git clone https://github.com/<your-name>/ai-profile-switch.git
cd ai-profile-switch
npm test
```

The CLI has no runtime dependencies, so you can run it and its tests without `npm install`. Install only to work on the docs site.

## Try your change safely

The tool works on `~/.claude-profiles` and adds lines to your shell startup files. Run it with a throwaway home folder so your real setup stays untouched:

```bash
SANDBOX="$(mktemp -d)"
HOME="$SANDBOX" CLAUDE_SWITCH_DISABLE_AUTO_UPDATE=1 node bin/cli.mjs --help
HOME="$SANDBOX" CLAUDE_SWITCH_DISABLE_AUTO_UPDATE=1 node bin/cli.mjs list
```

On Windows, Node reads the home folder from `USERPROFILE`. Use a new PowerShell window and close it when you're done:

```powershell
$env:USERPROFILE = (New-Item -ItemType Directory (Join-Path $env:TEMP "aps-$(Get-Random)")).FullName
$env:CLAUDE_SWITCH_DISABLE_AUTO_UPDATE = '1'
node bin/cli.mjs --help
```

- Set `AI_PROFILE_SWITCH_LANG=ko` to see the Korean screens.
- `init`, `add` and `login` start the real Claude Code to sign in. The sign-in is saved for the sandbox folder only, but it is a real sign-in to your account.
- Don't run `node bin/cli.mjs install-shell` without the sandbox. It edits your real shell startup files.

## Project layout

```
bin/cli.mjs              Entry point and command routing
src/commands/            One file per command (add, remove, manage, shell, share, update, …)
src/lib/                 Profiles, shared folders, shell setup, prompts, i18n, updates
src/locales/             Every message shown on screen, in en.mjs and ko.mjs
src/shell-templates/     The claude and cpf functions for sh/bash/zsh, fish and PowerShell
test/                    Tests for Node's built-in runner
website/                 The docs site (VitePress)
docs/                    Older platform guides linked from the README
```

## Tests

- `npm test` runs every test. Run one file with `node --test test/profile.test.mjs`.
- Start every test file with `import './helpers/home.mjs';`. It points `HOME`, temp folders, npm and git at a throwaway folder, turns off automatic updates, sets the language to English, and puts a fake `claude` first on `PATH` so a test can never start the real one.
- Pull requests run the tests on Linux, macOS and Windows with Node 18 to 26, and check the shell integration in bash, zsh, fish, PowerShell and cmd. See `.github/workflows/test-platforms.yml`. To run the shell check locally, use `node test/cross-shell-smoke.mjs --shell=/bin/zsh`.
- If the `validateProfileName` tests fail on your machine, that's [#16](https://github.com/ftery0/ai-profile-switch/issues/16).

## Code guidelines

- Plain JavaScript ES modules, with no build step and no runtime dependencies. Please open an issue before adding a dependency.
- Use only Node APIs available in Node 18.19.
- Every message shown on screen goes in both `src/locales/en.mjs` and `src/locales/ko.mjs`. If you can't write Korean, put the English text in `ko.mjs` too and say so in the pull request. It will be translated before release.
- Paths, links and shell commands must work on macOS, Linux, WSL and Windows. Use `node:path`, and check `IS_WINDOWS` where behavior differs.
- Never print, log or copy sign-in data such as Keychain items, `.credentials.json` or tokens, and keep it out of test fixtures and issues.
- Follow the style of the code around you. Comments are short and explain why.

## Docs

- If a change affects what users see or type, update `README.md`, `README.ko.md`, and the matching pages in `website/` and `website/ko/`.
- To preview the site, run `npm install` and then `npm run docs:dev`.

## Commits and pull requests

- Branch from `main` and name the branch after the topic, such as `fix/profile-test-language` or `feat/codex-support`.
- Write commit messages as `type :: subject`, for example `fix :: keep the profile tests in English`. Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.
- Keep one topic per pull request. Fill in the template, link the issue with `Closes #123`, and say how you tested.
- Small pull requests get reviewed sooner. For a large change, agree on the approach in the issue first.
- Don't change the version in `package.json`. Releases to npm are done by the maintainer.

## Security

Please don't report security problems in a public issue. See [SECURITY.md](SECURITY.md).

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By taking part, you agree to follow it.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
