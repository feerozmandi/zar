"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@xennic/ui";

export function WikiSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();

  return (
    <form
      className="mt-8 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (q.trim().length > 0) router.push(`/wiki?${new URLSearchParams({ q }).toString()}`);
      }}
    >
      <Input
        aria-label="جستجو در دانشنامه"
        onChange={(event) => setQ(event.target.value)}
        placeholder="مثلاً: جریمه ضریب قدرت"
        value={q}
      />
      <Button type="submit">
        <Search className="size-4" />
        جستجو
      </Button>
    </form>
  );
}
