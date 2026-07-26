/**
 * The CV. Single source of truth for every word of real content in the app.
 *
 * Static data, kept out of component JSX for the same reason the scene
 * objects and mood tiers are: none of it changes at runtime, so it isn't
 * state, and pages should be renderers over it rather than documents that
 * happen to contain it.
 *
 * Supersedes an earlier port from the `my-portfolio` repo, which had a
 * smaller and partly inaccurate version of the same content (wrong intern
 * period, an oversold Sixthhive entry, only 3 projects). If the two repos
 * disagree, this file is the newer one.
 */

export const PROFILE = {
  name: "Jasmeet Sidhu",
  title: "Frontend Developer & Game Developer",
  location: "Nangal, Punjab, India",
  bio: "Frontend and Game Developer with 3+ years of experience building production React.js applications, interactive 3D web experiences, and 2D games in Cocos Creator — shipping client-facing products used in gaming, Web3, and e-commerce.",
};

export interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  period: string;
  /** Drives the "now" dot — the current role is called out visually. */
  current: boolean;
  highlights: string[];
  tags: string[];
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    company: "Chicmic Studios",
    role: "Software Developer (Frontend & Game Developer)",
    location: "Mohali, India",
    period: "July 2023 – Present",
    current: true,
    highlights: [
      "Engineered and deployed high-performance interactive 3D web applications using React.js, TypeScript, and React Three Fiber.",
      "Built and shipped multiple 2D games in Cocos Creator for client projects, including full game logic, level systems, and custom level editors.",
      "Developed reusable UI components and scalable state management using Redux Toolkit, reducing code duplication by 30%.",
      "Improved website/app performance by optimizing Core Web Vitals, raising PageSpeed Insights scores from ~1 to 70.",
      "Integrated REST APIs and WebSocket-based real-time features across client platforms, and contributed to CI/CD pipelines.",
    ],
    tags: ["React.js", "TypeScript", "R3F", "Cocos Creator", "Redux Toolkit"],
  },
  {
    company: "National Institute of Electronics and Information Technology",
    role: "Web Development Intern",
    location: "Haridwar, India",
    period: "Summer 2022",
    current: false,
    highlights: [
      "Completed an intensive Web Development training program, building foundational projects in HTML, CSS, and JavaScript.",
    ],
    tags: ["HTML", "CSS", "JavaScript"],
  },
];

export interface ProjectEntry {
  /** Also the URL slug: /projects/<id>. Must stay stable — these end up */
  /** in links people have already shared. */
  id: string;
  title: string;
  /** Short qualifier after the title, e.g. "Web3 Gaming Platform". */
  kind?: string;
  /** Rendered as a badge. Only set where the work isn't shipped yet. */
  status?: "In progress";
  description: string;
  highlights: string[];
  tags: string[];
  liveUrl?: string;
  /** Overrides the default "Visit site" call to action. */
  linkLabel?: string;
}

/**
 * Ordered strongest-first rather than chronologically — this is the order
 * they were handed over in, and the first three carry the most weight.
 */
export const PROJECTS: ProjectEntry[] = [
  {
    id: "shunya-games",
    title: "Shunya Games",
    kind: "Client Arcade Hub Portal",
    description:
      "Independently built and shipped 9 2D puzzle and board games (memory matching, sequence recall, and similar formats) for a client's arcade hub portal, with multi-language support and a cross-game scoring system.",
    highlights: [
      "Built a backend-driven level-preloading system that fetched and cached the next level once the current one reached 40% completion, eliminating load-time stalls.",
      "Built a progress-saving system syncing player state to the backend at set intervals, letting users resume exactly where they left off.",
      "Built an admin panel with a configurable scoring system and a UI-based level editor generating JSON, enabling non-technical staff to add new levels.",
    ],
    tags: ["React.js", "TypeScript", "Redux Toolkit", "REST APIs"],
    liveUrl: "https://shunyagamesj.netlify.app/",
  },
  {
    id: "raypto",
    title: "Raypto",
    kind: "Web3 Gaming Platform",
    description:
      "Built 2D games and platform/admin UI for a Web3 gaming platform, improving gameplay usability and user engagement.",
    highlights: [
      "Created an admin panel for game controls using Next.js and APIs, reducing manual operations.",
      "Improved performance from a PageSpeed score of ~1 to 60+ by applying Next.js optimizations, lazy loading, and code-splitting.",
      "Integrated secure wallet connection (Reown) and multilingual support (i18n) for a global user base.",
    ],
    tags: ["React.js", "Next.js", "Reown / WalletConnect", "i18n"],
    liveUrl: "https://super-figolla-64f21a.netlify.app/",
  },
  {
    id: "saru-kingdom",
    title: "Saru Kingdom",
    kind: "Telegram Game",
    status: "In progress",
    description:
      "A Hamster Kombat-style Telegram game currently in development, built around milestones, achievements, and a card and referral economy.",
    highlights: [
      "Milestone and achievement systems driving player progression.",
      "Real-time gameplay over sockets.",
      "Card system and referral system.",
    ],
    tags: ["React.js", "Sockets", "Telegram"],
    liveUrl: "https://t.me/saru_kingdom_bot",
    linkLabel: "Open @saru_kingdom_bot",
  },
  {
    id: "busybuddy",
    title: "BusyBuddy",
    kind: "Shopify App",
    description:
      "A Shopify app for creating dynamic, custom properties that let merchants change the view of the shopping cart and product pages, with a live preview.",
    highlights: [
      "Built 5 different apps inside the single Shopify app.",
      "Built various form types with live preview of cart and product page changes as merchants edit them.",
    ],
    tags: ["React", "Remix", "Shopify Polaris"],
    liveUrl: "https://apps.shopify.com/busybuddy",
    linkLabel: "View on Shopify App Store",
  },
  {
    id: "flavilla",
    title: "Flavilla",
    kind: "Interactive 3D Brand Experience",
    description:
      "An interactive 3D world map built for a brand experience site.",
    highlights: [
      "Built clickable character models displaying history content, and animated air balloons linking to external brand sites.",
      "Optimized 3D performance using LOD, model preloading, asset compression, and scene optimization for smoother rendering and stable cross-device performance.",
    ],
    tags: ["Three.js", "React Three Fiber", "WebGL"],
  },
  {
    id: "strike-rush",
    title: "Strike Rush",
    kind: "3D Showcase Level",
    description:
      "The original game was built in Unreal Engine; built one level in Three.js as a browser-playable showcase for the company page.",
    highlights: ["Implemented physics — moving balls and hurdles/obstacles."],
    tags: ["Three.js", "Physics"],
    liveUrl: "https://games.chicmicstudios.in/games/StrikeRush/index.html",
    linkLabel: "Play the level",
  },
  {
    id: "optimus-poker",
    title: "Nicole Poker / Optimus Poker",
    description:
      "A browser-based No Limit Texas Hold'em poker game with Watch, Play, and Learn modes.",
    highlights: [
      "Implemented adaptive AI opponents with a client-side server for gameplay.",
      "Integrated GTO (Game Theory Optimal) tools, expert tips, and practical examples to help players improve strategy.",
      "Designed the Learn mode experience to help players study hands through guided examples.",
    ],
    tags: ["Cocos Creator", "Game AI"],
    liveUrl: "https://optimuspoker.net/game/learn/",
    linkLabel: "Play Learn mode",
  },
  {
    id: "bubble-shooter",
    title: "Bubble Shooter",
    kind: "Client Project",
    description: "A bubble-popping puzzle game with ~40 shipped levels.",
    highlights: [
      "Built core game logic, level map system, and a level editor that generates JSON to upload new levels.",
      "Implemented same-color bubble matching/popping logic, bubble animations, and power-ups.",
      "Built a daily reward system.",
    ],
    tags: ["Cocos Creator", "Level Editor"],
  },
  {
    id: "sanctum",
    title: "Sanctum",
    description:
      "A 2D game world where bots roam the map and perform activities.",
    highlights: [
      "Built a player customization/inventory system (skin, shirt, pants, hair).",
      "Implemented path generation and used tilemaps for the game world.",
    ],
    tags: ["Cocos Creator", "Tilemaps", "Pathfinding"],
  },
  {
    id: "sixthhive",
    title: "Sixthhive",
    description:
      "Built forms and a subscription module for a professional networking platform.",
    highlights: [],
    tags: ["React.js"],
  },
];

export interface SkillGroup {
  group: string;
  items: string[];
}

export const SKILLS: SkillGroup[] = [
  {
    group: "Languages",
    items: ["TypeScript", "JavaScript", "C++"],
  },
  {
    group: "Frameworks & Libraries",
    items: [
      "React.js",
      "Next.js",
      "Redux Toolkit",
      "RTK Query",
      "Remix",
      "Three.js",
      "React Three Fiber",
      "Cocos Creator",
    ],
  },
  {
    group: "Integration",
    items: [
      "REST APIs",
      "WebSockets",
      "i18n",
      "Wallet integration (Reown)",
      "Shopify Polaris",
    ],
  },
  {
    group: "Tools & Practices",
    items: [
      "Git",
      "GitHub",
      "CI/CD",
      "Jira",
      "ClickUp",
      "Mantis",
      "Performance optimization",
    ],
  },
];

/**
 * Flattened for the physics pile — one chip per skill, order preserved so
 * the pile spawns grouped rather than shuffled.
 */
export const ALL_SKILLS: string[] = SKILLS.flatMap((group) => group.items);

export const CONTACT = {
  blurb:
    "Currently available for interesting projects and full-time opportunities. Feel free to reach out for a chat or just to say hi!",
  email: "jasmeetdev02@gmail.com",
  phone: {
    display: "+91 8146780735",
    link: "tel:+918146780735",
  },
  socials: [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/jasmeet-sidhu-558b20201/",
    },
    {
      name: "GitHub",
      href: "https://github.com/jasmeetsidhu02",
    },
  ],
};
