import { libraryImage } from "@/lib/server/catalog";

/** Same-origin images keep PNG export independent of third-party CORS settings. */
export async function GET(_: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const url = await libraryImage(kind, id);
  if (!url) return new Response("Not found", { status: 404 });
  const image = await fetch(url, { cache: "force-cache" });
  if (!image.ok || !image.headers.get("content-type")?.startsWith("image/")) return new Response("Image unavailable", { status: 502 });
  return new Response(image.body, { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" } });
}
