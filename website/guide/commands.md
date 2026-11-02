---
title: Commands and Migration — ai-profile-switch
description: Profile management, safe import and version 2 compatibility.
---

# Commands and Migration

## Manage profiles with cpf

Enter `cpf` at the **terminal shell prompt** (`%` or `$`) to open the interactive menu. If Claude's chat is open, enter `/exit` **in Claude** first and wait for the terminal prompt. Typing `cpf` in Claude's chat sends a message instead of running a shell command.

Choose list, switch, add, rename, remove, or exit with ↑/↓ and Enter. The menu stays open after an action; choose Exit when finished. Profile management does not launch Claude; run `claude` at the terminal when you want to start a session.

| Copyable command | Behavior |
| --- | --- |
| `cpf` | Open the management menu |
| `cpf work` | Make `work` active without launching Claude |
| `cpf --list` | Show profiles and active selection |
| `cpf add work2` | Create `work2`; select it on the next `claude` launch and sign in |
| `cpf rename wrok2 work2` | Rename `wrok2` to `work2` |
| `cpf remove work2` | Delete `work2` after confirmation |
| `cpf login work2` | Sign `work2` in to another Claude account with `claude auth login` |
| `cpf language ko` | Show screens in Korean; `en` for English, `auto` to follow the system |
| `cpf --help` | Show command usage |

Replace the example names with yours. A single argument is always a profile name: `cpf add`, `cpf rename`, `cpf remove`, and `cpf list` select profiles with those names. Listing uses `cpf --list` to avoid conflicting with a profile called `list`. Use explicit commands in scripts; the menu needs an interactive terminal.

Creating a profile does not sign in or switch to it. For another account:

```bash
cpf add work2
claude
```

Select `work2` and sign in to the intended account when Claude asks. Switching affects future launches; existing Claude sessions keep their profile.

## Rename a profile

Close every Claude session using the profile, then correct its name:

```bash
cpf rename wrok2 work2
```

The profile's history, settings, list position, and active selection are preserved. An existing destination is rejected. The configuration path changes, so macOS may require login again. Start a new session after renaming.

Names use lowercase letters, digits and hyphens, up to 30 characters, and start/end with a letter or digit. `_shared` and `default` are reserved.

## Full CLI

These examples run the source checkout from its root. For a released version, replace `node bin/cli.mjs` with `npx ai-profile-switch@latest`, or use `ai-profile-switch` with a global installation.

| Copyable command | Behavior |
| --- | --- |
| `node bin/cli.mjs manage` | Open the same menu as `cpf` |
| `node bin/cli.mjs manage --list` | List profiles through the management interface |
| `node bin/cli.mjs init` | First setup wizard; summary if profiles already exist |
| `node bin/cli.mjs add work2` | Create a profile |
| `node bin/cli.mjs rename wrok2 work2` | Rename a profile |
| `node bin/cli.mjs remove work2` | Delete a profile after confirmation |
| `node bin/cli.mjs list` | Show profiles and active selection |
| `node bin/cli.mjs use work` | Change active profile |
| `node bin/cli.mjs migrate work --from ~/.claude` | Copy configuration into an existing profile |
| `node bin/cli.mjs install-shell` | Install, repair, or refresh shell commands and the local runtime |
| `node bin/cli.mjs update --check` | Check for a published update without installing |
| `node bin/cli.mjs update` | Update the local runtime |
| `node bin/cli.mjs mcp list` | Read legacy MCP server names and file paths |
| `node bin/cli.mjs rename --help` | Show help without changing files |

`manage` accepts the same arguments as `cpf`, for example `node bin/cli.mjs manage rename wrok2 work2`. All commands accept `--help` without running the action; unsupported options and extra arguments fail before making changes. `claude --help` remains Claude Code's own help.

## Import an existing configuration

To run the original Claude CLI without importing a profile, use `command claude` at a Bash/zsh terminal prompt to bypass the wrapper. It uses Claude's normal configuration; if you have set `CLAUDE_CONFIG_DIR` separately, that path applies.

Creating a profile or installing shell integration does not automatically copy your normal `~/.claude` account or sign in. During first-time `init`, choose the existing configuration source and the destination profile when prompted. If you already have profiles, `init` only shows a summary; use explicit migration.

1. Enter `/exit` in every Claude session using the source or destination before copying.
2. At the terminal, run `cpf --list` and choose the destination name. If you need a new profile, run `cpf add work` first. Replace `work` below with your chosen name.
3. From the repository root at the terminal, run the command and confirm the copy:

   ```bash
   node bin/cli.mjs migrate work --from ~/.claude
   ```

4. At the terminal, run `claude`, select `work`, and sign in to the intended account if asked.

For a published version, the equivalent command is `npx ai-profile-switch@latest migrate work --from ~/.claude`. The fixes in this source checkout require installing or running this source until a release includes them.

The default source combines `~/.claude` with the separate `~/.claude.json`. A configured `CLAUDE_CONFIG_DIR` is also detected with its own `.claude.json`. Use `--from` for a custom directory. The source files remain unchanged.

Import preserves settings, commands, projects, plugins, plans, skills, agents, rules, hooks, and `CLAUDE.md`. It also copies keyboard shortcuts, file history, output styles, agent memory, workflows, themes, and tasks. Symlinks retain their original targets. File credentials are copied with restricted permissions into only the chosen profile. macOS Keychain is not migrated, so Claude may require login again. Copying `.claude.json` alone does not establish login status.

Equal or nested source/target paths are rejected. Different existing target or shared data stops import with a conflict path. Invalid JSON is never treated as empty configuration. If destination or shared data changes while preparing the copy, the detected change stops replacement instead of overwriting it. Keep Claude sessions using the source and destination closed until copying finishes.

When existing destination or shared data is replaced, its previous copy remains at the backup path printed after success. This is separate from the untouched source. Keep that backup until you have checked the migrated profile.

## MCP compatibility

Version 2 removes the separate MCP editor. `mcp` and `mcp list` only show legacy server names and file paths, without URLs, tokens or environment values. Former `add/remove/enable/disable` calls fail without modifying files.

Register the servers you need with the official CLI under the selected profile. Old entries are not automatically converted or deleted.

```bash
cpf work
claude mcp add --transport http example --scope user https://example.com/mcp
claude mcp list
```

Do not assume legacy `mcpServers` in shared settings applies across accounts. User/local scope uses Claude's user configuration; project scope uses `.mcp.json`. See the [official MCP guide](https://code.claude.com/docs/en/mcp).

## Update compatibility

`update` and `update --self` install a verified compatible version of this tool into a separate local runtime directory. Existing sessions keep their old files. `--yes` is accepted for compatibility. `--check` never installs and exits 0 when current, 1 for a newer version, or 2 if the check fails.

Legacy `--claude-code` prints [official update guidance](https://code.claude.com/docs/en/setup#update-manually). It does not check Claude's version, so `--claude-code --check` exits 2. Update Claude using `claude update` or your installation's package manager.

Interactive launches automatically check and update this tool once daily in the background. New launches use the verified version; account data, harness hooks and shell profiles remain untouched. Noninteractive launches do not update. Set `CLAUDE_SWITCH_DISABLE_AUTO_UPDATE=1` to disable this. Failed checks retry after an hour; failed downloads retain the installed runtime. Node.js and npm are required, and packages with incompatible runtime protocols or Node requirements are rejected.

Users of 1.x run `npx ai-profile-switch@latest install-shell` once and open a new terminal to enable this runtime. Daily shell usage does not need a global installation. An independently installed global command is not automatically updated.
