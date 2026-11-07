import { toBlob } from "html-to-image";

let fontCSS: Promise<string> | null = null;

const toDataUrl = async (url: string) => {
  const blob = await (await fetch(url)).blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

/**
 * ฟอนต์ของเว็บเราเองสำหรับฝังลงภาพ — อ่านเฉพาะ stylesheet ที่มาจากโดเมนเดียวกัน
 * (html-to-image ปกติจะไล่อ่านทุก stylesheet รวมของ browser extension ซึ่ง browser ไม่อนุญาต → SecurityError ใน console)
 */
function getFontEmbedCSS() {
  fontCSS ??= (async () => {
    const rules: CSSFontFaceRule[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      if (sheet.href && new URL(sheet.href, location.href).origin !== location.origin) continue;
      let list: CSSRuleList;
      try { list = sheet.cssRules; } catch { continue; }
      // ข้ามฟอนต์ของ Next dev overlay (__nextjs-*) ที่ไม่ได้ใช้บนป้าย
      for (const rule of Array.from(list)) if (rule instanceof CSSFontFaceRule && !rule.style.getPropertyValue("font-family").includes("__nextjs")) rules.push(rule);
    }
    const parts = await Promise.all(rules.map(async (rule) => {
      const base = rule.parentStyleSheet?.href ?? location.href;
      let css = rule.cssText;
      const urls = Array.from(new Set(Array.from(css.matchAll(/url\(["']?([^"')]+)["']?\)/g), (m) => m[1]).filter((u) => !u.startsWith("data:"))));
      for (const u of urls) {
        try { css = css.split(u).join(await toDataUrl(new URL(u, base).href)); } catch { return ""; }
      }
      return css;
    }));
    return parts.filter(Boolean).join("\n");
  })().catch((error) => { fontCSS = null; throw error; });
  return fontCSS;
}

export async function renderPoster(node: HTMLElement, watermark: boolean): Promise<Blob> {
  if (node.querySelector("[data-image-error]")) throw new Error("โหลดภาพสกินไม่สำเร็จ กรุณาลองใหม่");
  await document.fonts.ready;
  await Promise.all(Array.from(node.querySelectorAll("img")).map(async (img) => {
    await img.decode();
    if (!img.naturalWidth) throw new Error("โหลดภาพสกินไม่สำเร็จ กรุณาลองใหม่");
  }));
  const blob = await toBlob(node, {
    pixelRatio: 1,
    fontEmbedCSS: await getFontEmbedCSS(),
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
