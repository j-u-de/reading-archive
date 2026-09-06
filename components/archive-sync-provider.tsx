"use client";

import { useEffect, useRef } from "react";
import { pullArchiveFromSyncSource, readArchive, writeArchive, writeArchiveLocally } from "../lib/archive";

export default function ArchiveSyncProvider() {
  const syncing = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (syncing.current) return;
      syncing.current = true;
      try {
        const local = readArchive();
        const remote = await pullArchiveFromSyncSource(local);
        if (cancelled) return;
        const localEmpty = !local.books.length && !local.sessions.length && !local.progressLogs.length && !local.notes.length && !local.topics.length && !local.posters.length;
        const remoteEmpty = !remote.archive.books.length && !remote.archive.sessions.length && !remote.archive.progressLogs.length && !remote.archive.notes.length && !remote.archive.topics.length && !remote.archive.posters.length;
        if (!remote.synced) {
          if (!localEmpty) {
            writeArchiveLocally(local);
          }
          return;
        }
        if (!remote.sourceHasEmbeddedAssets && !localEmpty) {
          writeArchive(local);
          return;
        }
        if (localEmpty && !remoteEmpty) {
          writeArchive(remote.archive);
          return;
        }
        if (!localEmpty && remoteEmpty) {
          writeArchive(local);
          return;
        }
        if (JSON.stringify(remote.archive) !== JSON.stringify(local)) {
          writeArchiveLocally(remote.archive);
        }
      } finally {
        syncing.current = false;
      }
    };

    void sync();
    const timer = window.setInterval(sync, 60000);
    window.addEventListener("focus", sync);
    window.addEventListener("online", sync);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener("online", sync);
    };
  }, []);

  return null;
}
