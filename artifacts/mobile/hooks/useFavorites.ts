import { useState, useEffect, useCallback } from "react";
import { storageGet, storageSet } from "../utils/storage";

const KEY = "favorites_v1";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageGet<string[]>(KEY).then((saved) => {
      if (saved) setFavorites(new Set(saved));
      setLoaded(true);
    });
  }, []);

  const toggle = useCallback(
    async (symbol: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(symbol)) {
          next.delete(symbol);
        } else {
          next.add(symbol);
        }
        storageSet(KEY, Array.from(next));
        return next;
      });
    },
    [],
  );

  const isFavorite = useCallback(
    (symbol: string) => favorites.has(symbol),
    [favorites],
  );

  return { favorites, toggle, isFavorite, loaded };
}
