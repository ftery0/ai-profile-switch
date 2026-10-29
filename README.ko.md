# ai-profile-switch

[![npm version](https://img.shields.io/npm/v/ai-profile-switch)](https://www.npmjs.com/package/ai-profile-switch)
[![license](https://img.shields.io/github/license/ftery0/ai-profile-switch)](./LICENSE)

회사·개인처럼 여러 Claude Code 계정을 한 컴퓨터에 두고, `claude` 를 실행할 때마다 골라 씁니다. 프로필마다 로그인·기록·설정이 따로 있고, 같이 쓸 것만 골라서 나눕니다. 실행에 필요한 외부 패키지는 없습니다.

[English](./README.md) · [전체 가이드](https://ftery0.github.io/ai-profile-switch/ko/guide/)

![claude 로 프로필을 골라 실행하고, cpf 로 바꾸고, cpf share 로 CLAUDE.md 를 나누는 데모](https://raw.githubusercontent.com/ftery0/ai-profile-switch/main/docs/assets/demo.gif)

예전 이름은 `claude-account-switch` 입니다. [기존 사용자](#기존-사용자)를 참고하세요.

## 설치

Node.js 18.19+ 또는 20.10+ 와 [Claude Code](https://code.claude.com/docs/en/setup) 가 필요합니다.

```bash
npx ai-profile-switch@latest init
```

`work, personal` 처럼 프로필 이름을 쉼표로 적고, 새 터미널을 엽니다.

## 평소에 쓰는 명령

터미널 프롬프트에서 실행합니다. Claude 채팅 안이라면 먼저 `/exit` 로 나옵니다.

| 명령 | 하는 일 |
| --- | --- |
| `claude` | 계정을 골라 그 계정으로 Claude Code 실행 |
| `cpf` | 메뉴에서 프로필 바꾸기·추가. **프로필 관리하기**에서 프로필마다 로그인 계정·사용량을 보고 이름 바꾸기·다시 로그인·지우기 |
| `cpf work` | Claude 를 켜지 않고 `work` 로 전환 |
| `cpf --list` | 프로필 목록과 지금 쓰는 프로필 |
| `cpf add work2` | 프로필 만들기. 그다음 `claude` 에서 골라 로그인 |
| `cpf rename wrok2 work2` | 이름 바꾸기. 그 프로필의 Claude 세션을 먼저 닫음 |
| `cpf remove work2` | 확인 후 프로필 삭제 |
| `cpf login work2` | `work2` 만 다른 Claude 계정으로 다시 로그인. 다른 프로필은 그대로 |
| `cpf language ko` | 화면을 한국어로. `en` 은 영어, `auto` 는 시스템 설정을 따름 |

- `claude` 선택 화면에는 프로필마다 이메일·요금제와, Claude Code 가 마지막으로 저장한 5시간·주간 사용량이 나옵니다. 숫자 키로 바로 고르고 Esc 로 취소합니다.
- 화면 언어는 터미널 언어(`LANG`)나 시스템 언어를 따라 한국어·영어 중에서 정해집니다.
- 전환은 다음 실행부터 적용됩니다. 이미 켜진 세션은 원래 계정을 그대로 씁니다.
- 스크립트에서는 `claude` 가 묻지 않고 지금 프로필로 실행합니다.
- Bash·zsh 프롬프트에서 `command claude` 를 치면 프로필 없이 원래 Claude 가 실행됩니다.

## 프로필끼리 설정 나누기

처음에는 `settings.json` 과 `commands` 만 같이 씁니다.

```bash
cpf share                 # 무엇을 나누는지, 프로필마다 맞춰져 있는지
cpf share add CLAUDE.md   # CLAUDE.md 하나를 모든 프로필에서
cpf share add skills      # 개인 스킬 나누기
cpf share remove skills   # 나누기 그만. 프로필마다 복사본이 남음
```

- 나눌 수 있는 것: `CLAUDE.md` `keybindings.json` `skills` `agents` `rules` `hooks` `output-styles` `workflows` `themes`
- 항상 프로필마다 따로: 로그인, `.claude.json`(MCP 서버·프로젝트 신뢰), 기록, `projects`, 플러그인
- 내용이 다른 프로필 파일은 덮어쓰지 않고 경고만 합니다.

## 원래 쓰던 계정 가져오기

처음 `init` 할 때 지금 쓰는 `~/.claude` 를 프로필로 복사할 수 있습니다. 나중에 하려면 Claude 세션을 닫고 실행합니다.

```bash
npx ai-profile-switch@latest migrate work --from ~/.claude
```

원래 폴더는 그대로 남습니다. macOS 키체인의 로그인 정보는 복사되지 않아서, 처음 한 번 다시 로그인하라고 할 수 있습니다.

## 업데이트

셸이 하루에 한 번 업데이트를 확인하고, 다음 실행부터 새 버전을 씁니다. 켜져 있는 세션에는 영향이 없습니다.

```bash
npx ai-profile-switch@latest update          # 바로 업데이트. --check 는 확인만
npx ai-profile-switch@latest install-shell   # 셸 명령 고치기·새로 깔기
```

자동 업데이트를 끄려면 `CLAUDE_SWITCH_DISABLE_AUTO_UPDATE=1` 을 설정합니다.

## 기존 사용자

`claude-account-switch` 나 1.x 를 쓰셨다면 `npx ai-profile-switch@latest install-shell` 을 한 번 실행하고 새 터미널을 엽니다. 프로필과 로그인은 그대로이고, `claude-account-switch` 명령도 별칭으로 남습니다.

## 더 보기

- [명령어 전체와 가져오기 자세히](https://ftery0.github.io/ai-profile-switch/ko/guide/commands)
- 플랫폼별 안내: [macOS](docs/setup-macos.ko.md) · [Linux](docs/setup-linux.ko.md) · [Windows](docs/setup-windows.ko.md)
- 이 소스를 직접 쓰려면 레포 폴더에서 `node bin/cli.mjs install-shell` 을 실행합니다.

## 기여하기

버그 신고, 수정, 문서, 다른 AI 코딩 CLI 지원 모두 환영합니다. [CONTRIBUTING.md](CONTRIBUTING.md)(영어)를 먼저 읽고, [good first issue](https://github.com/ftery0/ai-profile-switch/labels/good%20first%20issue) 나 [new tool](https://github.com/ftery0/ai-profile-switch/labels/new%20tool) 라벨이 붙은 이슈에서 골라 주세요. 이슈와 PR 은 영어로 씁니다. 보안 문제는 공개 이슈 대신 [SECURITY.md](SECURITY.md) 에 적힌 대로 알려 주세요.

[MIT](./LICENSE)
