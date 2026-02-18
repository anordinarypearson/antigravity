"use client";

import { SharedHeader } from "./shared-header";
import { BackButton } from "./back-button";
import { Library } from "lucide-react";

export function MaterialsContent() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <SharedHeader
        title="Saved Materials"
        leftElement={<BackButton />}
      />
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <Library className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-semibold">Saved Materials Disabled</h2>
          <p className="mt-2 text-muted-foreground">User accounts are no longer required, so saving materials is disabled.</p>
        </div>
      </main>
    </div>
  );
}
