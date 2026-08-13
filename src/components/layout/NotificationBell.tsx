"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { formatDateTime } from "@/lib/datetime";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

/**
 * Notification centre.
 *
 * The Notification model was written to by announcements and occurrences from
 * the start and had no interface at all, so nothing the school sent ever reached
 * anyone in the app.
 */
export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const response = await fetch("/api/notifications?limit=10");
      const data = await response.json();

      if (data.success) {
        setItems(data.data.notifications);
        setUnread(data.data.unread);
      }
    } catch {
      // A failed poll is not worth interrupting the page for.
    }
  };

  useEffect(() => {
    load();
    // Cheap polling: the alternative is a websocket for a bell.
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={
          unread > 0 ? `${unread} notificações não lidas` : "Notificações"
        }
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-semibold text-foreground">
                Notificações
              </span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Check className="h-3 w-3" />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhuma notificação.
              </p>
            ) : (
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {items.map((item) => {
                  const body = (
                    <div
                      className={`px-4 py-3 ${
                        item.isRead ? "" : "bg-primary/5"
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  );

                  return (
                    <li key={item.id}>
                      {item.actionUrl ? (
                        <Link
                          href={item.actionUrl}
                          onClick={() => {
                            markRead(item.id);
                            setOpen(false);
                          }}
                          className="block hover:bg-muted"
                        >
                          {body}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markRead(item.id)}
                          className="block w-full text-left hover:bg-muted"
                        >
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
