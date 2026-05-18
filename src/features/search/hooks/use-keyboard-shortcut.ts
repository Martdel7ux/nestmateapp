import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { meta?: boolean; ctrl?: boolean } = {}
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const metaOk  = !options.meta  || e.metaKey;
      const ctrlOk  = !options.ctrl  || e.ctrlKey;
      const eitherMod = (options.meta || options.ctrl)
        ? (e.metaKey || e.ctrlKey)
        : true;

      if (e.key === key && eitherMod) {
        e.preventDefault();
        callback();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [key, callback, options.meta, options.ctrl]);
}
