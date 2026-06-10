"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Dashboard /pos → full POS lives at /pos-terminal */
export default function PosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pos-terminal");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2 text-muted-foreground">
      <p className="text-sm font-medium">Opening POS Terminal…</p>
      <p className="text-xs">If you are not redirected, go to <strong>/pos-terminal</strong></p>
    </div>
  );
}
