    "use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void;
      setAttributes?: (
        attributes: Record<string, string>,
        callback?: (error: unknown) => void
      ) => void;
    };
  }
}

type KabUser = {
  full_name?: string;
  phone?: string;
};

export default function TawkUserSync() {
  useEffect(() => {
    function syncUserWithTawk() {
      const savedUser = localStorage.getItem("kab_user");

      if (!savedUser) {
        return;
      }

      let user: KabUser;

      try {
        user = JSON.parse(savedUser) as KabUser;
      } catch {
        console.error("Invalid kab_user data in localStorage");
        return;
      }

      if (!user.full_name || !window.Tawk_API?.setAttributes) {
        return;
      }

      window.Tawk_API.setAttributes(
        {
          name: user.full_name,
          phone: user.phone ?? "",
        },
        (error) => {
          if (error) {
            console.error("Could not sync user with Tawk:", error);
          }
        }
      );
    }

    if (window.Tawk_API?.setAttributes) {
      syncUserWithTawk();
      return;
    }

    window.Tawk_API = window.Tawk_API || {};

    const previousOnLoad = window.Tawk_API.onLoad;

    window.Tawk_API.onLoad = () => {
      previousOnLoad?.();
      syncUserWithTawk();
    };
  }, []);

  return null;
}