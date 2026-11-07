"use client";

import { createContext, useContext, useMemo } from "react";
import { getBaseCatalog, getCatalog, mergeCatalog, setClientCatalog, type Catalog, type CatalogChanges } from "@/lib/catalog";
import type { GameSlug } from "@/lib/games";

const CatalogContext = createContext<Catalog | null>(null);
export function CatalogProvider({ changes, children }: { changes: CatalogChanges; children: React.ReactNode }) {
  const catalog = useMemo(() => mergeCatalog(getBaseCatalog("mlbb"), changes), [changes]);
  setClientCatalog(catalog);
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}
export function useCatalog(game: GameSlug): Catalog {
  return useContext(CatalogContext) ?? getCatalog(game);
}
