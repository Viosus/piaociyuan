// app/admin/homepage-sections/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HomepageSectionsClient from "./ui/HomepageSectionsClient";

export default function HomepageSectionsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  return <HomepageSectionsClient />;
}
