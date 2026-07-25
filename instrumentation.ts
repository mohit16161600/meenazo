/**
 * Next.js instrumentation — runs once when the server process boots.
 * ---------------------------------------------------------------------------
 * Starts a background interval that triggers the EasyEcom dispatch route, so
 * the "hold 3h then push to EasyEcom" flow works with zero external cron setup
 * (the app runs as a single pm2 instance).
 *
 * It calls the route over HTTP rather than importing the DB layer directly —
 * that keeps this file free of node-only modules (mysql2) so it compiles for
 * both the Node.js and Edge runtimes. An external cron hitting the same route
 * still works as a belt-and-suspenders trigger.
 *
 * Requires EASYECOM_DISPATCH_SECRET to be set (used to authorize the self-call).
 * Without it, auto-dispatch is skipped — use the panel button or an external
 * cron with a logged-in session / the secret instead.
 */

const DISPATCH_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const secret = (process.env.EASYECOM_DISPATCH_SECRET ?? "").trim();
  if (!secret) {
    console.log("[easyecom] auto-dispatch disabled (set EASYECOM_DISPATCH_SECRET to enable).");
    return;
  }

  const g = globalThis as typeof globalThis & { __easyecomDispatchTimer?: NodeJS.Timeout };
  if (g.__easyecomDispatchTimer) return; // already scheduled

  const port = process.env.PORT || "3000";
  const base = (process.env.EASYECOM_SELF_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
  const endpoint = `${base}/api/easyecom/dispatch`;

  const tick = async () => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "x-dispatch-secret": secret },
        cache: "no-store",
      });
      if (!res.ok) {
        console.error(`[easyecom] scheduled dispatch HTTP ${res.status}`);
      }
    } catch (err) {
      console.error("[easyecom] scheduled dispatch error:", (err as Error)?.message);
    }
  };

  g.__easyecomDispatchTimer = setInterval(tick, DISPATCH_INTERVAL_MS);
  // Don't hold the process open for the timer alone.
  g.__easyecomDispatchTimer.unref?.();
}
