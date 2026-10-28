"use client";

import { useEffect } from "react";

/** Records this visit as the site-wide "last login" shown in the
 *  homepage boot log (so visitors see when the previous one came by).
 *  Fire and forget; renders nothing. */
export function RecordLastLogin() {
  useEffect(() => {
    void fetch("/api/last-login", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
