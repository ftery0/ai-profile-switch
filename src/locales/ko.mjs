// 한국어 문구. en.mjs 와 키가 같아야 한다.
export default {
  'time.justNow': '방금',

  'prompt.keys': '{arrows} 이동 · Enter 선택 · Esc 취소',
  'prompt.keysNumbered': '{arrows} 이동 · 1-{max} 바로 선택 · Enter 선택 · Esc 취소',
  'prompt.keysBack': '{arrows} 이동 · Enter 선택 · Esc 뒤로',
  'prompt.keysNumberedBack': '{arrows} 이동 · 1-{max} 바로 선택 · Enter 선택 · Esc 뒤로',
  'prompt.moreAbove': '위에 {count}개 더',
  'prompt.moreBelow': '아래에 {count}개 더',
  'prompt.cancelled': '취소했어요',
  'prompt.yes': '예',
  'prompt.no': '아니요',
  'common.cancelled': '취소했어요.',
  'common.none': '없음',

  'picker.question': '어떤 프로필로 시작할까요?',
  'picker.inUse': '사용 중',
  'picker.starting': '{profile} 프로필로 시작해요',
  'picker.switched': '이제 {profile} 프로필을 써요',
  'launch.opening': 'Claude Code 를 여는 중…',
  'launch.notFound': '이 컴퓨터에서 Claude Code 를 찾지 못했어요.',
  'launch.install': '설치 안내:',
  'launch.startFailed': 'Claude Code 를 시작하지 못했어요: {message}',
  'launch.sharedFailed': '같이 쓰는 설정을 연결하지 못했어요: {message}',

  'account.fiveHour': '5시간',
  'account.weekly': '주간',
  'account.noUsage': '아직 저장된 사용량 없음',
  'account.savedAt': '{time} 기준',
  'account.notSignedIn': '아직 로그인하지 않았어요',

  'profile.empty': '프로필 이름을 적어 주세요',
  'profile.tooLong': '프로필 이름은 {max}자 이하로 적어 주세요',
  'profile.reserved': '"{name}" 은(는) 쓸 수 없는 이름이에요',
  'profile.reservedWindows': '"{name}" 은(는) Windows 에서 쓸 수 없는 이름이에요',
  'profile.invalidName': '프로필 이름은 영어 소문자·숫자·하이픈(-)만 쓸 수 있고, 처음과 끝은 글자나 숫자여야 해요',
  'profile.notFound': '"{name}" 프로필이 없어요',
  'profile.exists': '"{name}" 프로필이 이미 있어요',
  'profile.missingDir': '"{name}" 프로필 폴더가 없어요',
  'profile.notDirectory': '"{name}" 프로필은 링크나 파일이 아니라 폴더여야 해요',
  'profile.copiedInstead': '여기서는 링크를 만들 수 없어 같이 쓰는 파일을 복사했어요 ({link}).',
  'profile.devMode': '같이 쓰는 설정을 계속 맞추려면 Windows 개발자 모드를 켜 주세요.',
  'profiles.none': '아직 프로필이 없어요.',
  'hint.profiles': '있는 프로필:',
  'hint.create': '새로 만들려면:',
  'hint.add': '프로필 추가:',
  'hint.setup': '처음 설정:',
  'hint.try': '이렇게 써 보세요:',

  'use.switched': '{profile} 프로필로 바꿨어요',
  'use.already': '이미 {profile} 프로필을 쓰고 있어요',
  'use.note': '새로 여는 Claude 부터 적용돼요. 열려 있는 창은 원래 프로필을 그대로 써요.',

  'add.created': '{name} 프로필을 만들었어요',
  'add.next': '다음 단계',
  'add.step1': '{command} 를 실행해요',
  'add.step2': '목록에서 {name} 프로필을 골라요',
  'add.step3': 'Claude 가 물으면 쓰려는 Claude 계정으로 로그인해요',

  'remove.activeWarn': '{name} 프로필은 지금 쓰는 중이에요',
  'remove.confirm': '"{name}" 프로필을 지울까요? 로그인·기록이 모두 지워지고 되돌릴 수 없어요',
  'remove.done': '{name} 프로필을 지웠어요',
  'remove.newActive': '이제 {name} 프로필을 써요',
  'remove.none': '남은 프로필이 없어요.',

  'rename.closeSessions': '{name} 프로필로 열려 있는 Claude 창은 먼저 닫아 주세요. 열린 창은 예전 폴더를 계속 써요.',
  'rename.macSignIn': 'macOS 에서는 처음 한 번 다시 로그인하라고 할 수 있어요.',
  'rename.done': '프로필 이름을 바꿨어요: {old} → {new}',
  'rename.same': '"{name}" 은(는) 이미 그 이름이에요',

  'share.keptOwn': '{name}: {entry} 가 같이 쓰는 것과 달라서 따로 두었어요. 옮기거나 지운 뒤 cpf share sync 를 실행하세요.',
  'share.missing': '{name}: 같이 쓰는 {entry} 가 _shared 에 없어요.',
  'share.title': '모든 프로필이 같이 쓰는 것:',
  'share.canAlso': '더 나눌 수 있는 것: {list}',
  'share.nothingLeft': '없음',
  'share.own': '{entry} 따로 있음',
  'share.notLinked': '{entry} 아직 연결 안 됨',
  'share.missingShort': '{entry} 없음',
  'share.inSync': '맞춰져 있어요',
  'share.nothingExtra': '아직 더 나눈 것이 없어요. 예: cpf share add CLAUDE.md',
  'share.usage': '사용법: cpf share [list | add <항목> | remove <항목> | sync]',
  'share.linked': '{count}개를 연결했어요.',
  'share.added': '이제 모든 프로필이 {entry} 를 같이 써요 (~/.claude-profiles/_shared/{entry})',
  'share.removed': '{entry} 나누기를 그만했어요. 프로필마다 복사본이 남아 있어요.',
  'share.cannot': '"{entry}" 은(는) 나눌 수 없어요. 나눌 수 있는 것: {list}',
  'share.needsSettings': '이 설정은 프로필마다 따로 쓰도록 되어 있어 나눌 수 없어요.',
  'share.already': '"{entry}" 은(는) 이미 같이 쓰고 있어요',
  'share.notShared': '"{entry}" 은(는) 같이 쓰고 있지 않아요',

  'list.title': '프로필 목록',
  'list.active': '지금 프로필: {name}',

  'install.done': 'claude·cpf 명령을 설치했어요.',
  'install.shells': '{shells} 에서 쓸 수 있어요',
  'install.next': '새 터미널을 열고 claude 로 시작하거나 cpf 로 프로필을 관리하세요.',
  'shell.refreshed': '셸 명령을 새로 고쳤어요.',

  'update.claudeManaged': 'Claude Code 는 스스로 업데이트해요. claude update (또는 설치한 패키지 관리자)를 쓰세요.',
  'update.seeSetup': '안내: https://code.claude.com/docs/en/setup',
  'update.notChecked': 'Claude Code 업데이트는 확인하지 않았어요.',
  'update.package': '패키지',
  'update.installed': '설치됨',
  'update.latest': '최신',
  'update.upToDate': '최신 버전이에요.',
  'update.runToInstall': '설치하려면 npx ai-profile-switch@latest update 를 실행하세요.',
  'update.updated': '{version} 으로 업데이트했어요. 새로 여는 Claude 부터 적용되고, 열린 창은 그대로예요.',
  'update.notInstalled': '셸 명령이 설치돼 있지 않아 아무것도 설치하지 않았어요. 실행: npx ai-profile-switch@latest install-shell',
  'update.busy': '이미 업데이트하는 중이에요.',
  'update.failed': '업데이트에 실패해 지금 버전을 그대로 써요: {error}',

  'migrate.noProfiles': '아직 프로필이 없어요. 먼저 npx ai-profile-switch@latest init 을 실행하세요.',
  'migrate.target': '어느 프로필로 가져올까요?',
  'migrate.which': '어느 Claude 설정을 가져올까요?',
  'migrate.customPath': '경로 직접 적기',
  'migrate.enterPath': '폴더 전체 경로를 적어 주세요:',
  'migrate.emptySource': '가져올 폴더 경로를 적어 주세요.',
  'migrate.source': '가져올 곳:',
  'migrate.profile': '넣을 프로필:',
  'migrate.conflictNote': '프로필에 겹치는 데이터가 있으면 아무것도 복사하지 않아요. 원래 폴더는 그대로 남아요.',
  'migrate.closeSessions': '가져오는 동안 두 곳을 쓰는 Claude 창은 닫아 두세요.',
  'migrate.confirm': '"{name}" 프로필로 설정을 가져올까요?',
  'migrate.copied': '{source} 를 {name} 프로필로 가져왔어요',
  'migrate.backup': '원래 있던 데이터 백업: {path}',
  'migrate.preserved': '원래 폴더는 그대로예요. macOS 키체인의 로그인 정보는 복사되지 않아요.',
  'migrate.signIn': '이 프로필로 시작하면 Claude 가 로그인을 확인해요.',

  'init.already': 'ai-profile-switch 는 이미 설정돼 있어요.',
  'init.profiles': '프로필:',
  'init.active': '지금 프로필:',
  'init.addHint': '프로필 추가:',
  'init.repairHint': '셸 명령 고치기:',
  'init.title': 'ai-profile-switch 시작하기',
  'init.tagline': '한 컴퓨터에서 여러 Claude 계정을 프로필로 나눠 골라 쓰게 해 줘요',
  'init.closeSessions': '지금 설정을 가져오는 동안 열린 Claude 창은 닫아 두세요.',
  'init.names': '만들 프로필 이름을 적어 주세요 (쉼표로 구분)',
  'init.duplicate': '같은 이름을 두 번 적었어요: {name}',
  'init.used': '이미 있는 이름이에요: {name}',
  'init.activeQuestion': '처음에 어느 프로필을 쓸까요?',
  'init.shareQuestion': '모든 프로필이 settings.json 과 commands 를 같이 쓸까요?',
  'init.copyQuestion': '지금 쓰는 Claude 설정을 가져올까요?',
  'init.skip': '가져오지 않기',
  'init.dirExists': '"{name}" 폴더가 이미 있어요. 다른 이름을 쓰세요.',
  'init.ready': '{name} 프로필 준비됨',
  'init.shells': '셸 명령 설치됨 ({shells})',
  'init.activeDone': '지금 프로필: {name}',
  'init.openTerminal': '새 터미널을 열고 {command} 를 실행하세요. 필요하면 Claude 가 로그인을 물어봐요.',
  'init.otherProfile': '다른 프로필로 하려면:',

  'menu.question': '무엇을 할까요?',
  'menu.current': '지금 프로필: {name}',
  'menu.use': '프로필 바꾸기',
  'menu.add': '프로필 추가하기',
  'menu.removeHint': '확인 후 지워요',
  'menu.share': '같이 쓰는 설정 보기',
  'menu.language': '화면 언어',
  'menu.exit': '나가기',
  'menu.manage': '프로필 관리하기',
  'menu.manageHint': '이름·로그인 계정·지우기',
  'menu.usePick': '어느 프로필로 바꿀까요?',
  'menu.managePick': '어느 프로필을 관리할까요?',
  'detail.title': '{name} 프로필',
  'detail.account': '로그인 계정',
  'detail.usage': '사용량',
  'detail.lastUsed': '마지막 사용',
  'detail.folder': '폴더',
  'detail.never': '아직 안 씀',
  'detail.noUsage': '아직 저장된 값 없음',
  'detail.use': '이 프로필로 바꾸기',
  'detail.rename': '이름 바꾸기',
  'detail.login': '로그인 계정 바꾸기',
  'detail.loginHint': '다른 Claude 계정으로 다시 로그인',
  'detail.remove': '지우기',
  'detail.back': '뒤로',
  'rename.newName': '새 이름을 적어 주세요',
  'rename.newNameHint': '지금: {name} · 비우면 취소',
  'rename.confirm': '{old} → {new} 로 바꿀까요?',
  'rename.kept': '로그인·기록·설정은 그대로예요.',
  'rename.next': '다음부터 {command} 목록에서 {name} 프로필을 고르세요.',
  'hint.otherName': '다른 이름으로:',
  'login.current': '지금 로그인 계정:',
  'login.onlyThis': '이 프로필만 바뀌고 다른 프로필의 로그인은 그대로예요.',
  'login.browser': '브라우저가 열리면 쓰려는 Claude 계정으로 로그인하세요.',
  'login.closeSessions': '{name} 프로필로 열린 Claude 창이 있으면 먼저 닫아 주세요.',
  'login.confirm': '{name} 프로필의 로그인을 바꿀까요?',
  'login.opening': 'Claude Code 로그인을 여는 중… (claude auth login)',
  'login.done': '{name} 프로필이 이제 {account} 로 로그인돼 있어요',
  'login.same': '{name} 프로필은 그대로 {account} 로 로그인돼 있어요',
  'login.notSaved': '새 로그인 정보를 읽지 못했어요. claude 로 {name} 프로필을 열어 확인해 보세요.',
  'login.failed': '로그인을 마치지 못했어요 (종료 코드 {code}).',
  'login.usageLater': '사용량은 이 프로필로 Claude 를 한 번 쓰면 다시 보여요.',
  'login.usage': '사용법: cpf login <이름>',
  'index.helpLogin': '그 프로필만 claude auth login 으로 다시 로그인해요. 다른 프로필은 그대로예요.',
  'menu.addName': '새 프로필 이름 (비우면 취소):',
  'manage.invalid': '명령을 알아듣지 못했어요. cpf --help 로 사용법을 보세요.',
  'manage.help': `사용법:
  cpf                         메뉴 열기
  cpf <이름>                  그 프로필로 바꾸기
  cpf --list                  프로필 목록과 지금 프로필
  cpf add <이름>              프로필 만들기
  cpf rename <예전> <새>      프로필 이름 바꾸기 (데이터는 그대로)
  cpf remove <이름>           확인 후 프로필 지우기
  cpf login <이름>            그 프로필의 로그인 계정 바꾸기
  cpf share                   모든 프로필이 같이 쓰는 것 보기
  cpf share add <항목>        CLAUDE.md·skills·agents 등을 같이 쓰기
  cpf share remove <항목>     같이 쓰기 그만 (프로필마다 복사본이 남음)
  cpf language [auto|en|ko]   화면 언어 고르기
  cpf --help                  이 도움말

Claude 채팅 안이 아니라 터미널 프롬프트에서 실행하세요. 채팅에서 나오려면 /exit 를 쓰세요.
claude 를 실행하면 프로필을 골라 Claude Code 를 시작해요.
이름을 바꾸기 전에 그 프로필을 쓰는 창을 닫으세요. macOS 에서는 다시 로그인하라고 할 수 있어요.
셸 명령이 없을 때는: npx ai-profile-switch@latest manage [인자]`,

  'language.title': '화면 언어',
  'language.auto': '자동',
  'language.autoHint': '시스템 설정을 따라요 (지금: {name})',
  'language.saved': '화면 언어를 바꿨어요: {name}',
  'language.savedAuto': '화면 언어가 시스템 설정을 따라요 ({name})',
  'language.current': '화면 언어: {name}',
  'language.sourceSaved': 'cpf language 로 정함',
  'language.sourceAuto': '자동',
  'language.usage': '사용법: cpf language [auto | en | ko]',

  'mcp.noWrites': '여기서는 MCP 를 더 이상 바꾸지 않아요. claude mcp add/remove 와 /mcp 를 쓰세요.',
  'mcp.preserved': '예전 MCP 데이터는 그대로 있어요. 쓰는 프로필에서 claude mcp 로 서버를 추가하세요.',
  'mcp.noServers': '(서버 없음)',
  'mcp.disabled': '예전에 끈 서버: {list}',
  'mcp.where': '사용자 서버는 프로필의 .claude.json, 프로젝트 서버는 .mcp.json 에 둬요.',
  'mcp.see': '안내: https://code.claude.com/docs/en/mcp',

  'index.unknown': '없는 명령이에요: {command}',
  'index.usage': '사용법: npx ai-profile-switch@latest {usage}',
  'index.helpRename': '그 프로필을 쓰는 창을 먼저 닫으세요. 기록과 설정은 그대로이고, macOS 에서는 다시 로그인하라고 할 수 있어요.',
  'index.helpRemove': '확인 후 프로필을 지워요. 되돌릴 수 없어요.',
  'index.helpAdd': '프로필을 만들어요. claude 를 실행해 골라서 쓰려는 프로필로 로그인하세요.',
  'index.helpUse': '다음에 여는 Claude 의 프로필을 바꿔요. 열린 창은 원래 프로필을 그대로 써요.',
  'index.help': `
  {title} — 한 컴퓨터에서 여러 Claude Code 계정을 프로필로 나눠 쓰기

  평소에 쓰는 명령 (설정 후 터미널에서):
    claude                     프로필을 골라 Claude Code 시작
    cpf                        메뉴 열기
    cpf work                   있는 프로필로 바꾸기
    cpf --help                 짧은 명령 보기

  사용법: npx ai-profile-switch@latest <명령> [옵션]

  명령:
    init                       처음 설정 (이미 했으면 지금 설정을 보여 줌)
    add <이름>                 프로필 만들기
    remove <이름>              확인 후 프로필 지우기
    rename <예전> <새>         프로필 이름 바꾸기 (데이터는 그대로)
    login <이름>               그 프로필의 로그인 계정 바꾸기
    list                       프로필 목록
    use <이름>                 지금 프로필 바꾸기
    manage                     cpf 와 같은 메뉴 열기
    language [auto|en|ko]      화면 언어 고르기
    install-shell              claude·cpf 명령 설치·고치기
    migrate [이름]             지금 Claude 설정 가져오기 (--from <경로>)
    update [--check]           이 도구 업데이트 (--check 는 확인만)
    share [add|remove]         CLAUDE.md·skills·agents 등을 같이 쓰기
    mcp [list]                 예전 MCP 설정이 어디로 갔는지 보기

  명령 뒤에 --help 를 붙이면 사용법이 나와요.
`,
};
