"""Answers `ai-profile-switch init` in a real terminal (pty) the way a person would."""
import os
import pty
import select
import sys
import time

# (text to wait for, keys to send)
STEPS = [
    ("Profile names", b"me\r"),
    ("Share settings.json", b"\r"),
    ("Copy an existing Claude configuration", b"\r"),  # first choice is ~/.claude
]


def main():
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp("ai-profile-switch", ["ai-profile-switch", "init"])
    seen = ""
    step = 0
    deadline = time.time() + 60
    while time.time() < deadline:
        ready, _, _ = select.select([fd], [], [], 0.5)
        if ready:
            try:
                chunk = os.read(fd, 4096).decode("utf-8", "replace")
            except OSError:
                break
            if not chunk:
                break
            sys.stdout.write(chunk)
            seen += chunk
        if step < len(STEPS) and STEPS[step][0] in seen:
            time.sleep(0.3)  # let the prompt switch the terminal to raw mode
            os.write(fd, STEPS[step][1])
            seen = ""
            step += 1
    _, status = os.waitpid(pid, 0)
    code = os.waitstatus_to_exitcode(status)
    if step < len(STEPS):
        print(f"\n[drive] stopped before answering: {STEPS[step][0]}", file=sys.stderr)
        sys.exit(1)
    sys.exit(code)


main()
