---
title: Shell Integration — ai-profile-switch
description: Local runtime, profile selection and existing launch hooks.
---

# Shell Integration

Open a new terminal after first `init` or `install-shell`. These instructions describe the repository source; the new management commands need this source or a release containing them.

## Where to type commands

1. If Claude's chat is open, type `/exit` **in Claude** to return to the terminal.
2. At the **terminal shell prompt** (`%` or `$`), run `cpf`, choose the profile action, then select Exit when finished.
3. At the terminal, run `claude` to start a new session.

`cpf` is a shell command; entering it in Claude's chat sends chat text instead of switching profiles. Installing shell integration does not import the default `~/.claude` account or sign in. See [importing your existing account](/guide/commands#import-an-existing-configuration).

| Command | Behavior |
| --- | --- |
| `claude [args]` | Launch Claude under the selected profile |
| `cpf` | Open the list/switch/add/rename/remove menu |
| `cpf work` | Change active profile to `work` without launching Claude |
| `cpf --list` | List profiles |
| `cpf add work2` | Add a profile |
| `cpf rename wrok2 work2` | Rename a profile after its Claude sessions are closed |
| `cpf remove work2` | Delete a profile after confirmation |
| `cpf --help` | Show management command usage |

The `cpf` menu needs an interactive terminal. A single argument always selects a profile, including names such as `add`, `rename`, `remove`, and `list`. Use `cpf --list` for listing. The older `claude-pick` command still selects an active profile without launching Claude. See [profile management](/guide/commands) for adding accounts and renaming.

With multiple profiles, interactive `claude` shows a picker with the active profile selected. Single-profile and noninteractive launches use the active profile immediately. The picker and profile notice go to stderr; Claude output passes through. Ctrl-C cancels selection.

Arguments including `--help`, `--version` and spaces, as well as exit status, pass through. `CLAUDE_CONFIG_DIR` is set only in the Claude child process.

IDE extensions (VS Code, JetBrains) and the desktop app start Claude themselves, not through the shell's `claude` command. They keep using the default `~/.claude`, or whatever `CLAUDE_CONFIG_DIR` the editor was started with, so sign in there separately. Your original `~/.claude` is never moved, so they keep working as before.

## Installation and repair

For the published npm version:

```bash
npx ai-profile-switch@latest install-shell
```

To install changes from this checkout, run this from its root instead:

```bash
node bin/cli.mjs install-shell
```

Open a new terminal afterward so the `cpf` function loads the updated management interface. The command installs the version it runs from; `@latest` does not install unpublished source changes.

This copies the runtime into `~/.claude-profiles/_runtime` and adds a source line to shell configuration. Active source lines are not duplicated. If the integration appears only in a comment or printed text, rerunning `install-shell` reconnects it. Existing custom overrides after the active source line are preserved. Read and switch commands do not edit shell files.

| Shell | Config file |
| --- | --- |
| zsh | `$ZDOTDIR/.zshrc` when `ZDOTDIR` is set; otherwise `~/.zshrc` |
| bash | `~/.bashrc` |
| fish | `$XDG_CONFIG_HOME/fish/config.fish` when set; otherwise `~/.config/fish/config.fish` |
| PowerShell | `~/Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, or an existing WindowsPowerShell profile |

Detection uses the current shell and existing config files. Run `install-shell` again after adding a shell. Configure WSL separately inside WSL. Missing Node.js or runtime files produce a repair instruction and an error status.

## Profile launch hooks

The current shell runs the matching `pre-launch.sh`, `pre-launch.fish` or `pre-launch.ps1` in the profile directory. Hook environment changes apply to Claude without remaining in the calling shell. A failed hook stops the launch.

The existing bash/zsh `__claude_switch_launch(profile, args...)` override call point remains supported. Keep a custom override after the integration source line.

Switching profiles does not change an already running Claude session. [Update notifications](/guide/commands#update-compatibility) are optional.
