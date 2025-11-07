// app/admin/banners/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BannersClient from "./ui/BannersClient";

export default function BannersManagementPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

  return <BannersClient />;
}
