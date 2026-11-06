export type GameSlug = "rov" | "mlbb" | "freefire";

export type GameConfig = {
  slug: GameSlug;
  /** ชื่อเกม (ชื่อเฉพาะ ไม่ต้องแปล) */
  name: string;
  shortName: string;
  /** library = เลือกสกินจากคลัง, upload = อัปโหลดรูปเอง */
  mode: "library" | "upload";
  /** สีไล่ระดับของ placeholder การ์ดเกม */
  gradient: string;
  /** ไอคอนเกมทางการ (จาก App Store — `npm run import:icons`) */
  icon: string;
};

export const GAMES: GameConfig[] = [
  {
    slug: "rov",
    icon: "/games/rov.webp",
    name: "Arena of Valor (ROV)",
    shortName: "ROV",
    mode: "library",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
  },
  {
    slug: "mlbb",
    icon: "/games/mlbb.webp",
    name: "Mobile Legends",
    shortName: "MLBB",
    mode: "library",
    gradient: "from-sky-400 via-indigo-500 to-violet-600",
  },
  {
    slug: "freefire",
    icon: "/games/freefire.webp",
    name: "Free Fire",
    shortName: "Free Fire",
    mode: "upload",
    gradient: "from-yellow-400 via-orange-500 to-red-600",
  },
];

export const GAME_SLUGS = GAMES.map((g) => g.slug);

export function getGame(slug: string): GameConfig | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export const EDITOR_STEPS = ["grid", "template", "decorate", "checkout"] as const;
export type EditorStep = (typeof EDITOR_STEPS)[number];

export function parseStep(value: string | null | undefined): EditorStep {
  return (EDITOR_STEPS as readonly string[]).includes(value ?? "")
    ? (value as EditorStep)
    : "grid";
}
