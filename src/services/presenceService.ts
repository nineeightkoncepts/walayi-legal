// A user counts as "online" while their last presence heartbeat is recent.
// There's no server-pushed disconnect signal (Firestore has no onDisconnect
// hook like Realtime Database does), so presence is approximated by a
// heartbeat the client keeps refreshing while the tab is open/visible —
// staleness beyond this window means the tab closed, crashed, or lost
// connectivity without a chance to say so.
export const ONLINE_THRESHOLD_MS = 90 * 1000;

// How often each signed-in client refreshes its own presence heartbeat.
export const PRESENCE_HEARTBEAT_INTERVAL_MS = 30 * 1000;

export const isUserOnline = (lastActiveAt?: string | null): boolean => {
  if (!lastActiveAt) return false;
  const last = new Date(lastActiveAt).getTime();
  if (Number.isNaN(last)) return false;
  return Date.now() - last < ONLINE_THRESHOLD_MS;
};

export const formatLastSeen = (lastActiveAt?: string | null): string => {
  if (!lastActiveAt) return 'Never active';
  const last = new Date(lastActiveAt).getTime();
  if (Number.isNaN(last)) return 'Never active';

  const diffMs = Date.now() - last;
  if (diffMs < ONLINE_THRESHOLD_MS) return 'Online now';

  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `Active ${diffMin}m ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `Active ${diffHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  return `Active ${diffDay}d ago`;
};
