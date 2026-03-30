type ActivityCallback = (active: boolean) => void;

const IDLE_RECENTLY = 2 * 60 * 1000;
const IDLE_OFFLINE = 30 * 60 * 1000;
const HEARTBEAT_INTERVAL = 30 * 1000;

let lastActivity = Date.now();
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let callbacks: ActivityCallback[] = [];

function onActivity() {
  const wasIdle = Date.now() - lastActivity > IDLE_RECENTLY;
  lastActivity = Date.now();
  if (wasIdle) notify(true);
  resetIdleTimer();
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => notify(false), IDLE_RECENTLY);
}

function notify(active: boolean) {
  callbacks.forEach(cb => cb(active));
}

export function startActivityTracking(sendHeartbeat: (active: boolean) => void) {
  callbacks.push(sendHeartbeat);

  const events = ["mousemove", "keydown", "scroll", "click", "touchstart", "pointerdown"];
  events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

  heartbeatTimer = setInterval(() => {
    const active = Date.now() - lastActivity < IDLE_RECENTLY;
    sendHeartbeat(active);
  }, HEARTBEAT_INTERVAL);

  resetIdleTimer();
  sendHeartbeat(true);

  return () => {
    events.forEach(e => window.removeEventListener(e, onActivity));
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (idleTimer) clearTimeout(idleTimer);
    callbacks = callbacks.filter(cb => cb !== sendHeartbeat);
    sendHeartbeat(false);
  };
}

export function getActivityStatus(): "online" | "recently" | "offline" {
  const elapsed = Date.now() - lastActivity;
  if (elapsed < IDLE_RECENTLY) return "online";
  if (elapsed < IDLE_OFFLINE) return "recently";
  return "offline";
}
