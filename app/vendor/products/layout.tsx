// Reads request headers via getCompanyDomain() — must never be statically prerendered.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { InnerSideBar } from "@/components/vendor/InnerSideBar";
import React from "react";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex w-full max-h-screen overflow-hidden">
      <InnerSideBar selectedMenu="Catalog" />
      <div className="h-full max-h-screen min-h-screen overflow-y-auto w-full">
        {children}
      </div>
    </main>
  );
}
