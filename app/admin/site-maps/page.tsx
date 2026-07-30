"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authToken } from "@/utils/authToken";
import SiteMapsSection from "@/components/admin/SiteMapsSection";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { SITE_MAPS_TEXT } from "@/constants";

export default function SiteMapsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const tokenValue = authToken();
    setToken(tokenValue);
  }, []);

  if (!isMounted) return null;

  // GUARD CONDITION: Token Missing Silent-Failure Feedback
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 text-center"
        >
          <div className="w-16 h-16 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
            {SITE_MAPS_TEXT.SESSION_EXPIRED_TITLE}
          </h2>
          <p className="text-slate-500 mb-8 text-[15px] leading-relaxed">
            {SITE_MAPS_TEXT.SESSION_EXPIRED_DESC}
          </p>
          <button
            onClick={() => router.replace("/auth/adminLogin")}
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-[15px] font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all duration-200 ease-out shadow-sm"
          >
            {SITE_MAPS_TEXT.LOG_IN_AGAIN}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-6 py-10 w-full animate-in fade-in duration-300">
      <SiteMapsSection token={token} />
    </div>
  );
}
