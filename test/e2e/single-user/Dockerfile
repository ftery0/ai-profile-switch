# A clean Linux machine where one person already uses Claude Code with a single ~/.claude.
FROM node:20-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends zsh fish python3 \
  && rm -rf /var/lib/apt/lists/*

ARG CLAUDE_CODE_VERSION=latest
RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}"

# The package under test, built from this checkout by run.sh.
COPY ai-profile-switch.tgz /tmp/ai-profile-switch.tgz
RUN npm install -g /tmp/ai-profile-switch.tgz

COPY scenario.sh drive.py /e2e/
RUN useradd -m -s /bin/bash solo
USER solo
WORKDIR /home/solo
ENV AI_PROFILE_SWITCH_LANG=en CLAUDE_SWITCH_DISABLE_AUTO_UPDATE=1 DISABLE_AUTOUPDATER=1
CMD ["bash", "/e2e/scenario.sh"]
