---
title: 셸 통합 — ai-profile-switch
description: 로컬 실행 파일, 프로필 선택과 기존 실행 훅.
---

# 셸 통합

`init` 첫 설정 또는 `install-shell` 후 새 터미널을 엽니다. 이 문서는 저장소 소스 기준이며, 새 관리 명령은 이 소스 또는 해당 기능이 포함된 배포 버전이 필요합니다.

## 어디에 입력하나요?

1. Claude 채팅창이 열려 있으면 **Claude 안에서** `/exit`를 입력해 터미널로 돌아옵니다.
2. **터미널의 셸 프롬프트**(`%` 또는 `$`)에서 `cpf`를 실행해 원하는 작업을 고르고, 끝나면 Exit를 선택합니다.
3. 터미널에서 `claude`를 실행해 새 세션을 시작합니다.

`cpf`는 셸 명령입니다. Claude 채팅창에 입력하면 프로필 전환 대신 대화 내용으로 전달됩니다. 셸 통합을 설치해도 기본 `~/.claude` 계정이 자동 이관되거나 로그인되지는 않습니다. [기본 계정 가져오기](/ko/guide/commands#기존-설정-가져오기)를 참고하세요.

| 명령 | 동작 |
| --- | --- |
| `claude [인자]` | 선택한 프로필로 Claude 실행 |
| `cpf` | 조회·전환·추가·이름 변경·삭제 메뉴 열기 |
| `cpf work` | Claude 실행 없이 `work`를 활성 프로필로 지정 |
| `cpf --list` | 프로필 목록 조회 |
| `cpf add work2` | 프로필 추가 |
| `cpf rename wrok2 work2` | 해당 Claude 세션을 종료한 뒤 프로필 이름 변경 |
| `cpf remove work2` | 확인 후 프로필 삭제 |
| `cpf --help` | 관리 명령어 사용법 확인 |

`cpf` 메뉴는 대화형 터미널이 필요합니다. 인자가 하나이면 항상 프로필 이름으로 해석하며 `add`, `rename`, `remove`, `list`도 이름으로 사용할 수 있습니다. 목록은 `cpf --list`로 조회합니다. 기존 `claude-pick`도 Claude 실행 없이 활성 프로필을 고르는 명령으로 계속 지원합니다. 계정 추가와 이름 변경은 [프로필 관리](/ko/guide/commands)를 참고하세요.

여러 프로필이면 대화형 `claude`에서 선택기를 보여주며 활성 프로필을 기본 선택합니다. 단일 프로필 또는 비대화형 실행에서는 활성 프로필로 바로 실행합니다. 선택기와 프로필 안내는 stderr로, Claude 출력은 그대로 전달합니다. Ctrl-C는 실행을 취소합니다.

`--help`, `--version`, 공백을 포함한 인자와 종료 코드를 전달합니다. 환경의 `CLAUDE_CONFIG_DIR`은 Claude 자식 프로세스에만 설정됩니다.

IDE 확장(VS Code, JetBrains)과 데스크톱 앱은 셸의 `claude` 명령을 거치지 않고 Claude 를 직접 실행합니다. 그래서 기본 `~/.claude`(또는 편집기가 시작될 때의 `CLAUDE_CONFIG_DIR`)를 계속 쓰므로, 그쪽 로그인은 따로 합니다. 원래 `~/.claude` 는 옮기지 않으므로 지금처럼 그대로 동작합니다.

## 설치·복구

npm 배포 버전을 사용하려면:

```bash
npx ai-profile-switch@latest install-shell
```

이 저장소의 변경을 설치하려면 저장소 루트에서 대신 실행합니다.

```bash
node bin/cli.mjs install-shell
```

실행 후 새 터미널을 열어 갱신된 `cpf` 관리 명령을 불러옵니다. 실행한 버전의 셸 통합이 설치되며, `@latest`로는 미배포 소스 변경이 설치되지 않습니다.

`~/.claude-profiles/_runtime`에 실행 파일을 복사하고 셸 설정에 source 한 줄을 추가합니다. 활성 source 줄은 반복 추가하지 않습니다. 통합 줄이 주석이나 출력 문구에만 남아 있다면 `install-shell`을 다시 실행해 연결을 복구합니다. 활성 source 줄 뒤에 둔 기존 커스텀 런처는 보존합니다. 일반 조회·전환 명령은 셸 파일을 변경하지 않습니다.

| 셸 | 설정 파일 |
| --- | --- |
| zsh | `ZDOTDIR`이 있으면 `$ZDOTDIR/.zshrc`, 없으면 `~/.zshrc` |
| bash | `~/.bashrc` |
| fish | `XDG_CONFIG_HOME`이 있으면 `$XDG_CONFIG_HOME/fish/config.fish`, 없으면 `~/.config/fish/config.fish` |
| PowerShell | `~/Documents/PowerShell/Microsoft.PowerShell_profile.ps1` 또는 기존 WindowsPowerShell 프로필 |

현재 셸과 기존 설정 파일로 감지합니다. 새 셸을 설치했다면 `install-shell`을 다시 실행하세요. WSL은 WSL 안에서 따로 설정합니다. Node.js가 없거나 로컬 실행 파일이 사라지면 복구 명령을 안내하고 종료합니다.

## 프로필 실행 훅

프로필 폴더의 `pre-launch.sh`, `pre-launch.fish`, `pre-launch.ps1` 중 현재 셸에 맞는 파일을 실행합니다. 훅의 환경변수는 Claude 실행에 적용되고 호출한 셸에는 남지 않습니다. 훅이 실패하면 Claude를 실행하지 않습니다.

bash/zsh의 기존 `__claude_switch_launch(profile, args...)` 재정의 호출 위치도 유지합니다. 기존 커스텀 런처는 셸 통합을 source한 줄 뒤에 둡니다.

프로필 전환은 이미 실행 중인 Claude 세션에는 적용되지 않습니다. [업데이트 알림](/ko/guide/commands#업데이트-호환)은 선택적으로 켤 수 있습니다.
