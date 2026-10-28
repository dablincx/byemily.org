"use client";

import { useState } from "react";

/** Current year, read in the browser. The layout is prerendered at
 *  build time, so a server-side year would go stale on Jan 1. */
function getYear(): number {
  return new Date().getFullYear();
}

export function Year() {
  const [year] = useState(getYear);
  return <span suppressHydrationWarning>{year}</span>;
}