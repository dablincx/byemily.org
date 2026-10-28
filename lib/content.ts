/**
 * The /about copy, in one place. Also rendered as `about.md` in the
 * homepage terminal, so the two can't drift apart.
 */

export type StackGroup = { title: string; items: string[] };

export type AboutContent = {
  intro: string;
  bio: string[];
  stack: StackGroup[];
  socialsNote: string;
};

export function about(): AboutContent {
  return {
    intro: "emily (she/her)",
    bio: [
      "hi. i'm emily. i'm a {age} year old software developer and pseudo sysadmin living in germany.",
      'i write software. mostly backend stuff, sometimes fullstack when the project needs it. i also selfhost a bunch of services for fun and for "the experience" (my server is probably suffering immensely).',
      "when i'm not doing that i mess with electronics and computers in ways im probably not supposed to, play video games, or read. i also like to write sometimes (see my wonderful /blog). most of the time im not actually doing anything and just wasting time watching youtube yay.",
    ],
    stack: [
      {
        title: "languages",
        items: [
          "python",
          "javascript / typescript",
          "java",
          "kotlin",
          "c / c++",
          "c#",
          "pascal",
          "bash",
        ],
      },
      {
        title: "web & data",
        items: ["vanilla web (html, css, dom)", "next.js & react", "sql (mariadb, sqlite)"],
      },
      {
        title: "systems & ops",
        items: ["linux (daily driver + admin)", "selfhosting", "docker", "nginx", "git / github"],
      },
      {
        title: "other",
        items: [
          "android development (java + kotlin)",
          "minecraft modding (java)",
          "unity / c#",
          "electronics & computer repair",
        ],
      },
    ],
    socialsNote: "have something to say? /contact.",
  };
}

/** The about copy as markdown, for the terminal's `about.md`. */
export function aboutAsMarkdown(age: number): string {
  const c = about();
  const lines: string[] = [];
  lines.push(`# ${c.intro}`);
  lines.push("");
  for (const para of c.bio) {
    lines.push(para.replace("{age}", String(age)));
    lines.push("");
  }
  lines.push("## stack");
  lines.push("");
  for (const g of c.stack) {
    lines.push(`### ${g.title}`);
    lines.push("");
    for (const it of g.items) {
      lines.push(`- ${it}`);
    }
    lines.push("");
  }
  lines.push("## socials");
  lines.push("");
  lines.push(c.socialsNote);
  lines.push("");
  return lines.join("\n");
}

const BIRTH_DATE = new Date(2007, 0, 1);

/** Emily's age today, for the `{age}` token in the bio. */
export function currentAge(now = new Date()): number {
  let years = now.getFullYear() - BIRTH_DATE.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > BIRTH_DATE.getMonth() ||
    (now.getMonth() === BIRTH_DATE.getMonth() && now.getDate() >= BIRTH_DATE.getDate());
  if (!hadBirthdayThisYear) years -= 1;
  return years;
}
