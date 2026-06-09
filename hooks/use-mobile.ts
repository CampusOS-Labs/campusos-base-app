import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    mq.addEventListener("change", onChange);
    setIsMobile(window.innerWidth <= 768);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
