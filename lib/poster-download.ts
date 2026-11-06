import { toBlob } from "html-to-image";

export async function renderPoster(node: HTMLElement, watermark: boolean): Promise<Blob> {
  if (node.querySelector("[data-image-error]")) throw new Error("โหลดภาพสกินไม่สำเร็จ กรุณาลองใหม่");
  await document.fonts.ready;
  await Promise.all(Array.from(node.querySelectorAll("img")).map(async (img) => {
    await img.decode();
    if (!img.naturalWidth) throw new Error("โหลดภาพสกินไม่สำเร็จ กรุณาลองใหม่");
  }));
  const blob = await toBlob(node, {
    pixelRatio: 1,
    backgroundColor: "#09090b",
    filter: (element) => !(element instanceof HTMLElement && element.hasAttribute("data-export-watermark") && !watermark),
  });
  if (!blob) throw new Error("สร้างภาพไม่สำเร็จ กรุณาลองใหม่");
  return blob;
}

export function savePoster(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
