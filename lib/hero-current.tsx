import { connection } from "next/server";
import type { BootLine } from "@/components/heroes/boot-sequence";
import { BootHeroClient } from "./hero-current-client";
import { buildFakeFs } from "@/lib/fake-fs";
import { formatLastLogin, getLastLogin } from "@/lib/last-login";

/** Homepage hero, server half: loads the data for the boot animation
 *  and terminal in `hero-current-client.tsx`. */

const bootLines: BootLine[] = [
  { kind: "kernel", text: "[    0.000000] Linux version 6.12.31-arch1-1 (linux@archlinux)" },
  { kind: "kernel", text: "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-linux root=UUID=a1b2c3d4-e5f6-7890-1234-567890abcdef ro quiet" },
  { kind: "kernel", text: "[    0.000000] BIOS-provided physical RAM map:" },
  { kind: "kernel", text: "[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable" },
  { kind: "kernel", text: "[    0.000000] BIOS-e820: [mem 0x0000000000100000-0x000000007fffefff] usable" },
  { kind: "kernel", text: "[    0.002104] smpboot: Total of 1 processors activated (3892.20 BogoMIPS)" },
  { kind: "kernel", text: "[    0.118003] raid6: sse2x1   gen()  2912 MiB/s" },
  { kind: "kernel", text: "[    0.244003] SCSI subsystem initialized" },
  { kind: "kernel", text: "[    0.311109] usbcore: registered new interface driver usbfs" },
  { kind: "kernel", text: "[    0.602119] systemd[1]: systemd 258 (258-2-arch) running in system mode" },
  { kind: "service", text: "[  OK  ] Started systemd-journald.service." },
  { kind: "service", text: "[  OK  ] Finished systemd-remount-fs.service." },
  { kind: "service", text: "[  OK  ] Reached target local-fs.target." },
  { kind: "service", text: "[  OK  ] Finished systemd-sysctl.service." },
  { kind: "service", text: "[  OK  ] Started sshd.service - OpenSSH server daemon." },
  { kind: "service", text: "[  OK  ] Started nginx.service - A high performance web server and a reverse proxy server." },
  { kind: "service", text: "[  OK  ] Reached target multi-user.target." },
];

export async function CurrentHero() {
  // Per request: the last-login line and the shell's listing are live.
  await connection();
  const fs = await buildFakeFs();
  return (
    <BootHeroClient
      bootLines={bootLines}
      fs={fs}
      lastLoginText={formatLastLogin(getLastLogin())}
    />
  );
}
