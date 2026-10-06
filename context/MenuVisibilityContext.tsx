"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import { supabase } from "@/lib/supabase";
import {
  MENU_VISIBILITY_SETTING_KEY,
  parseHiddenMenuLinks,
} from "@/lib/menu-visibility";

/*
  Which menu links are hidden (Admin > Menu Links).

  The server sends the list with the page, so a hidden link is never drawn,
  not even for a moment. The page itself is cached for up to a minute, so
  the list is also re-read once in the browser to pick up a change at once.
*/

const MenuVisibilityContext = createContext<ReadonlySet<string>>(
  new Set<string>()
);

export function MenuVisibilityProvider({
  initialHidden,
  children,
}: {
  initialHidden: string[];
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState<string[]>(initialHidden);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", MENU_VISIBILITY_SETTING_KEY)
          .maybeSingle();

        // No row (or not readable) = keep what the server sent.
        if (cancelled || error || !data) {
          return;
        }

        const latest = parseHiddenMenuLinks(data.value);

        setHidden((current) =>
          current.join("|") === latest.join("|") ? current : latest
        );
      } catch {
        // Keep what the server sent.
      }
    }

    void refresh();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => new Set(hidden), [hidden]);

  return (
    <MenuVisibilityContext.Provider value={value}>
      {children}
    </MenuVisibilityContext.Provider>
  );
}

/** The links hidden from the menus, e.g. has("/brands"). */
export function useHiddenMenuLinks() {
  return useContext(MenuVisibilityContext);
}
