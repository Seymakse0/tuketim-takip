/** Ortam: APP_AUTH_USERS="user:şifre|user2:şifre2" (şifrede `:` kullanmayın veya JSON kullanın) */
export function parseAuthUsers(): Map<string, string> {
  const jsonRaw = process.env.APP_AUTH_USERS_JSON?.trim();
  if (jsonRaw) {
    try {
      const arr = JSON.parse(jsonRaw) as unknown;
      const m = new Map<string, string>();
      if (!Array.isArray(arr)) return m;
      for (const row of arr) {
        if (!row || typeof row !== "object") continue;
        const u = (row as { username?: string }).username?.trim();
        const p = (row as { password?: string }).password;
        if (u && typeof p === "string") m.set(u, p);
      }
      return m;
    } catch {
      return new Map();
    }
  }

  const pipeRaw = process.env.APP_AUTH_USERS?.trim() ?? "";
  const m = new Map<string, string>();
  if (!pipeRaw) return m;
  for (const part of pipeRaw.split("|")) {
    const line = part.trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const u = line.slice(0, idx).trim();
    const p = line.slice(idx + 1);
    if (u) m.set(u, p);
  }
  return m;
}
