import { FormSubmitButton } from "@/components/form-submit-button";
import {
  markNotificationRead,
  restoreNotification,
  snoozeNotification,
} from "@/app/app/action-centre/actions";

export function NotificationControls({
  notificationKey,
  read,
  snoozed = false,
}: {
  notificationKey: string;
  read: boolean;
  snoozed?: boolean;
}) {
  if (snoozed) {
    return (
      <form action={restoreNotification}>
        <input type="hidden" name="notification_key" value={notificationKey} />
        <FormSubmitButton pendingLabel="Restoring..." className="min-h-9 rounded-lg bg-white px-3 text-xs font-semibold text-[var(--color-primary)]">Restore</FormSubmitButton>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!read && (
        <form action={markNotificationRead}>
          <input type="hidden" name="notification_key" value={notificationKey} />
          <FormSubmitButton pendingLabel="Saving..." className="min-h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs font-semibold text-[var(--color-text-secondary)]">Mark seen</FormSubmitButton>
        </form>
      )}
      {read && <span className="text-xs font-semibold text-[#56806a]">Seen</span>}
      <form action={snoozeNotification}>
        <input type="hidden" name="notification_key" value={notificationKey} />
        <FormSubmitButton pendingLabel="Snoozing..." className="min-h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs font-semibold text-[var(--color-text-secondary)]">Snooze 24h</FormSubmitButton>
      </form>
    </div>
  );
}
