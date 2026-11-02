---
title: 명령어·이관 — ai-profile-switch
description: 프로필 관리, 충돌 없는 이관과 2 버전 호환 안내.
---

# 명령어·이관

## cpf로 프로필 관리하기

`cpf`는 **터미널의 셸 프롬프트**(`%` 또는 `$`)에서 실행합니다. Claude 채팅창이 열려 있으면 먼저 **Claude 안에서** `/exit`를 입력하고 터미널 프롬프트가 나올 때까지 기다립니다. Claude 채팅창에 `cpf`를 입력하면 셸 명령 대신 대화 내용으로 전달됩니다.

관리 메뉴에서 조회·전환·추가·이름 변경·삭제·종료를 ↑/↓와 Enter로 선택합니다. 작업 후에도 메뉴는 유지되며, 끝나면 Exit를 선택합니다. 프로필 관리만으로 Claude가 실행되지는 않습니다. 세션을 시작하려면 터미널에서 `claude`를 실행합니다.

| 바로 쓸 수 있는 명령 | 동작 |
| --- | --- |
| `cpf` | 관리 메뉴 열기 |
| `cpf work` | Claude 실행 없이 `work`를 활성 프로필로 지정 |
| `cpf --list` | 프로필과 활성 상태 조회 |
| `cpf add work2` | `work2` 추가; 다음 `claude`에서 고른 뒤 로그인 |
| `cpf rename wrok2 work2` | `wrok2`를 `work2`로 이름 변경 |
| `cpf remove work2` | 확인 후 `work2` 삭제 |
| `cpf login work2` | `claude auth login` 으로 `work2` 만 다른 Claude 계정에 다시 로그인 |
| `cpf language ko` | 화면을 한국어로; `en` 은 영어, `auto` 는 시스템 설정을 따름 |
| `cpf --help` | 명령어 사용법 확인 |

예시의 이름은 본인의 프로필 이름으로 바꿉니다. 인자가 하나이면 항상 프로필 이름으로 해석합니다. `cpf add`, `cpf rename`, `cpf remove`, `cpf list`는 각각 그 이름의 프로필로 전환합니다. `list`라는 프로필과 충돌하지 않도록 목록 조회는 `cpf --list`를 사용합니다. 메뉴는 대화형 터미널이 필요하므로 스크립트에서는 동작을 지정한 명령을 사용합니다.

프로필 생성만으로 로그인되거나 활성 프로필이 바뀌지는 않습니다. 계정을 추가하려면:

```bash
cpf add work2
claude
```

`work2`를 고르고 Claude가 로그인을 요청하면 사용할 계정으로 로그인합니다. 프로필 전환은 이후 실행에 적용되며, 이미 실행 중인 Claude 세션은 기존 프로필을 유지합니다.

## 프로필 이름 바꾸기

해당 프로필을 사용하는 Claude 세션을 모두 종료한 뒤 오타를 고칩니다.

```bash
cpf rename wrok2 work2
```

대화 기록·설정·목록 순서·활성 상태를 보존합니다. 바꿀 이름이 이미 있으면 중단합니다. 설정 경로가 바뀌므로 macOS에서는 다시 로그인해야 할 수 있습니다. 이름을 바꾼 뒤 새 세션을 실행하세요.

이름은 소문자·숫자·하이픈, 최대 30자이며 시작과 끝은 문자·숫자여야 합니다. `_shared`, `default`는 예약 이름입니다.

## 전체 CLI

아래 예시는 저장소 루트에서 소스를 직접 실행합니다. 배포 버전은 `node bin/cli.mjs`를 `npx ai-profile-switch@latest`로 바꿉니다. 글로벌 설치를 했다면 `ai-profile-switch`를 사용할 수 있습니다.

| 바로 쓸 수 있는 명령 | 동작 |
| --- | --- |
| `node bin/cli.mjs manage` | `cpf`와 같은 관리 메뉴 열기 |
| `node bin/cli.mjs manage --list` | 관리 명령으로 프로필 조회 |
| `node bin/cli.mjs init` | 첫 설정 마법사; 이미 프로필이 있으면 요약 |
| `node bin/cli.mjs add work2` | 프로필 추가 |
| `node bin/cli.mjs rename wrok2 work2` | 프로필 이름 변경 |
| `node bin/cli.mjs remove work2` | 확인 후 프로필 삭제 |
| `node bin/cli.mjs list` | 프로필과 활성 상태 조회 |
| `node bin/cli.mjs use work` | 활성 프로필 변경 |
| `node bin/cli.mjs migrate work --from ~/.claude` | 기존 프로필로 설정 복사 |
| `node bin/cli.mjs install-shell` | 셸 명령어·로컬 실행 파일 설치·복구·갱신 |
| `node bin/cli.mjs update --check` | 배포된 새 버전을 설치 없이 확인 |
| `node bin/cli.mjs update` | 로컬 실행 파일 갱신 |
| `node bin/cli.mjs mcp list` | 과거 MCP 설정 경로·서버 이름 조회 |
| `node bin/cli.mjs rename --help` | 파일 변경 없이 도움말 확인 |

`manage`는 `cpf`와 같은 인자를 받습니다(예: `node bin/cli.mjs manage rename wrok2 work2`). 모든 명령에 `--help`를 붙이면 동작을 실행하지 않고 도움말을 보여줍니다. 지원하지 않는 옵션과 추가 인자는 변경 전에 오류로 종료합니다. `claude --help`는 계속 Claude Code 자체 도움말입니다.

## 기존 설정 가져오기

프로필로 가져오지 않고 원래 Claude CLI를 실행하려면 Bash/zsh 터미널에서 `command claude`로 실행 함수를 우회할 수 있습니다. Claude의 기본 설정을 사용하되, `CLAUDE_CONFIG_DIR`을 따로 설정했다면 해당 경로를 사용합니다.

프로필 생성이나 셸 통합 설치만으로 기본 `~/.claude` 계정이 자동 복사되거나 로그인되지는 않습니다. 첫 `init`에서 기존 설정의 원본과 대상 프로필을 고를 수 있습니다. 이미 프로필이 있으면 `init`은 요약만 보여주므로 명시적으로 이관합니다.

1. 복사 전에 원본 또는 대상 프로필을 쓰는 모든 Claude 세션에서 `/exit`를 입력해 종료합니다.
2. 터미널에서 `cpf --list`로 대상 이름을 고릅니다. 새 프로필이 필요하면 먼저 `cpf add work`를 실행합니다. 아래의 `work`는 고른 이름으로 바꿉니다.
3. 터미널의 저장소 루트에서 명령을 실행하고 복사를 확인합니다.

   ```bash
   node bin/cli.mjs migrate work --from ~/.claude
   ```

4. 터미널에서 `claude`를 실행하고 `work`를 선택합니다. 요청하면 사용할 계정으로 로그인합니다.

배포 버전의 같은 명령은 `npx ai-profile-switch@latest migrate work --from ~/.claude`입니다. 이 소스의 수정 사항은 해당 버전이 배포되기 전까지 소스를 설치하거나 직접 실행해야 적용됩니다.

기본 `~/.claude`와 별도의 `~/.claude.json`을 함께 읽습니다. `CLAUDE_CONFIG_DIR`이 있으면 해당 폴더와 그 안의 `.claude.json`도 대상으로 안내합니다. 임의 경로는 `--from`으로 지정합니다. 원본 파일은 그대로 보존합니다.

설정·명령·프로젝트·플러그인·계획·스킬·에이전트·규칙·훅·`CLAUDE.md`를 보존합니다. 단축키·파일 변경 기록·출력 스타일·에이전트 메모리·워크플로·테마·작업 데이터도 함께 복사합니다. 심볼릭 링크는 기존 대상을 유지합니다. 파일 인증은 선택한 프로필 하나에만 제한 권한으로 복사합니다. macOS Keychain은 옮기지 않으므로 다시 로그인해야 할 수 있습니다. `.claude.json`만 복사한다고 로그인되는 것은 아닙니다.

같은 경로·부모/자식 경로는 거부하며 기존 대상 또는 공유 데이터가 다르면 충돌 경로를 표시하고 중단합니다. 손상된 JSON도 빈 설정으로 덮어쓰지 않습니다. 복사 준비 중 대상·공유 데이터의 변경을 감지하면 덮어쓰지 않고 중단합니다. 복사가 끝날 때까지 원본과 대상의 Claude 세션을 실행하지 마세요.

기존 대상·공유 데이터를 교체한 경우에도 이전 데이터는 성공 후 표시되는 백업 경로에 남깁니다. 원본을 그대로 두는 것과 별도의 보존 장치입니다. 이관된 프로필을 확인할 때까지 해당 백업을 보관하세요.

## MCP 호환

2 버전부터 별도 MCP 편집기는 없습니다. `mcp`와 `mcp list`는 예전에 저장한 서버 이름·파일 경로만 보여줍니다. URL·토큰·환경변수 값은 출력하지 않습니다. 과거 `add/remove/enable/disable` 호출은 실패하며 파일을 변경하지 않습니다.

필요한 서버를 선택한 프로필에서 공식 명령으로 다시 등록합니다. 이전 항목은 자동 변환·삭제하지 않습니다.

```bash
cpf work
claude mcp add --transport http example --scope user https://example.com/mcp
claude mcp list
```

공유 파일에 적힌 과거 `mcpServers`가 모든 계정에서 적용된다고 가정하지 마세요. 사용자·로컬 범위는 Claude의 사용자 설정, 프로젝트 범위는 `.mcp.json`을 사용합니다. [공식 MCP 가이드](https://code.claude.com/docs/en/mcp)를 참고하세요.

## 업데이트 호환

`update`와 `update --self`는 검증된 호환 버전을 별도 로컬 실행 폴더에 설치합니다. 실행 중인 세션은 기존 파일을 유지합니다. `--yes`는 호환성을 위해 지원합니다. `--check`는 설치하지 않으며 최신이면 0, 새 버전이 있으면 1, 조회 실패이면 2를 반환합니다.

과거 `--claude-code`는 [공식 업데이트 안내](https://code.claude.com/docs/en/setup#update-manually)를 출력합니다. Claude 버전을 조회하지 않으므로 `--claude-code --check`는 2를 반환합니다. Claude 업데이트는 `claude update` 또는 해당 설치 도구로 진행합니다.

대화형 실행 시 하루 한 번 백그라운드에서 이 도구를 자동 갱신합니다. 다음 실행부터 검증된 버전을 사용하며 계정 데이터·하네스 훅·셸 설정 파일은 수정하지 않습니다. 비대화형 실행에서는 갱신하지 않습니다. `CLAUDE_SWITCH_DISABLE_AUTO_UPDATE=1`로 끌 수 있습니다. 검사 실패 시 한 시간 후 재시도하고, 다운로드 실패 시 기존 실행 파일을 보존합니다. Node.js와 npm이 필요하며 실행 규약이나 Node 요구 사항이 호환되지 않는 패키지는 거부합니다.

1.x 사용자는 `npx ai-profile-switch@latest install-shell`을 최초 한 번 실행하고 새 터미널을 열어 새 실행 구조로 전환합니다. 일상적인 셸 사용에 글로벌 설치는 필요하지 않습니다. 별도로 설치한 글로벌 명령은 자동 갱신하지 않습니다.
