/**
 * Real CV content, ported from the Next.js portfolio repo
 * (`my-portfolio`: `data/projects.ts`, `data/contact.ts`, and the
 * `EXPERIENCE`/`SOCIALS` arrays that were inlined in its section
 * components).
 *
 * Pulled out into plain data here rather than hardcoded into the panel's
 * JSX for the same reason the scene objects live in a data file: none of
 * it changes at runtime, so it isn't state and it shouldn't be tangled up
 * in markup. SidePanel becomes a renderer for these shapes.
 *
 * Note this is a *copy*, not a shared package — the two repos are
 * separate projects. If a role or project changes, both need updating.
 */

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

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  tags: string[];
  liveUrl?: string;
  githubUrl?: string;
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    company: "Chicmic Studios",
    role: "Software Developer",
    location: "Mohali, India",
    period: "July 2023 – Present",
    current: true,
    highlights: [
      "Engineered and deployed high-performance interactive 3D web applications using React.js and React Three Fiber.",
      "Developed reusable UI components and implemented scalable state management using Redux Toolkit, reducing code duplication by 30%.",
      "Improved website performance by optimizing core web metrics, increasing Google PageSpeed Insights scores from 1 to 70.",
    ],
    tags: ["React.js", "R3F", "Redux Toolkit", "Performance"],
  },
  {
    company: "NIELIT Haridwar",
    role: "Web Developer Intern",
    location: "Haridwar, India",
    period: "Summer Training",
    current: false,
    highlights: [
      "Completed Web Development Summer Training program at the National Institute of Electronics and Information Technology.",
      "Developed a School Management System as part of the training project.",
    ],
    tags: ["Web Development", "Full Stack"],
  },
];

export const PROJECTS: ProjectEntry[] = [
  {
    id: "sixthhive",
    title: "SixthHive",
    description:
      "A professional networking platform enabling users to post content, chat in real-time, and build meaningful connections.",
    highlights: [
      "Built a professional networking platform using React.js, enabling users to post content, chat in real-time, and build connections.",
      "Developed company and event management modules, allowing users to create and manage organizations.",
      "Created an admin panel for managing users, posts, companies, and events, improving platform moderation and control.",
      "Optimized performance using lazy loading and efficient state management for a smooth and scalable user experience.",
    ],
    tags: ["React.js", "Real-time Chat", "Admin Panel", "State Management"],
    liveUrl: "https://sixthhive.com/",
  },
  {
    id: "flavilla",
    title: "Flavilla",
    description:
      "An interactive 3D world map showcasing the history of Black women in tech, built with Three.js and immersive storytelling.",
    highlights: [
      "Built an interactive 3D world map using Three.js, with clickable character models that display history content and animated air balloons linking to external brand sites.",
      "Optimized 3D performance by applying LOD, model preloading, asset compression, and scene optimization, resulting in smoother rendering and faster load times.",
      "Improved user experience with intuitive navigation, responsive design, and cross-browser compatibility for seamless interaction across devices.",
    ],
    tags: ["Three.js", "3D Web", "WebGL", "Performance Optimization"],
    liveUrl:
      "https://theblackwomenintech.com/interactive-history-map-of-black-women-in-history/",
  },
  {
    // Not in the portfolio repo's data — this is the scene you're standing
    // in, and it was already listed in this panel before the port.
    id: "focus-desk",
    title: "Focus Desk",
    description:
      "This scene — an interactive 3D portfolio you can physically take apart, then put back together.",
    highlights: [
      "Built with React 19, TypeScript, React Three Fiber and Rapier physics: clicking a letter hands it from the rendered title to the physics simulation mid-flight, preserving its exact world transform.",
      "Redux Toolkit for app-level state, refs for per-frame values — the camera shake never triggers a React render.",
    ],
    tags: ["React Three Fiber", "Rapier", "Redux Toolkit", "TypeScript"],
    liveUrl: "https://jasmeetdesk.netlify.app/",
  },
];

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
