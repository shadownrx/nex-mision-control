"use client";

import { useEffect, useState } from "react";

function utcNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(
    d.getUTCSeconds()
  )} UTC`;
}

export default function ConsoleClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(utcNow());
    const t = setInterval(() => setTime(utcNow()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="font-mono text-xs tracking-wider text-fog tnum">
      {time ?? "--:--:-- UTC"}
    </span>
  );
}
