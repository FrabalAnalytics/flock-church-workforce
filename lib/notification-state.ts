export type NotificationState = {
  notification_key: string;
  read_at: string | null;
  snoozed_until: string | null;
};

export function validNotificationKey(value: string) {
  const key = value.trim();
  return /^[a-z_]+:[0-9a-f:-]{8,180}$/i.test(key) ? key : null;
}

export function isNotificationSnoozed(state: NotificationState | undefined, now: Date) {
  if (!state?.snoozed_until) return false;
  const timestamp = Date.parse(state.snoozed_until);
  return Number.isFinite(timestamp) && timestamp > now.getTime();
}
