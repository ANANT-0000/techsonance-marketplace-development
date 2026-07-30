"use client";

import Link from "next/link";
import { Store, ShieldHalf } from "lucide-react";
import { AUTH_CENTER_TEXT } from "@/constants/authText";
import { VEDNOR_LOGIN_PATH, VEDNOR_REGISTER_PATH } from "@/constants";
import { motion } from "framer-motion";

export default function AuthCenter() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-10 text-center flex flex-col items-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground bg-muted/50 border border-border rounded-full px-4 py-1.5 mb-5 shadow-sm backdrop-blur-md"
          >
            <ShieldHalf size={14} className="text-blue-600" />
            {AUTH_CENTER_TEXT.BADGE}
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-2xl md:text-3xl font-semibold text-foreground mb-3 tracking-tight"
          >
            {AUTH_CENTER_TEXT.TITLE}
          </motion.h1>
        </div>

        {/* Vendor */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="group relative bg-card border border-border/80 hover:border-border rounded-3xl p-8 flex flex-col transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
        >
          {/* Subtle gradient background effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-6 text-green-600 shadow-sm transition-transform duration-300 group-hover:scale-110">
            <Store size={22} strokeWidth={2.5} />
          </div>
          
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {AUTH_CENTER_TEXT.ROLE_SELLER}
            </p>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              {AUTH_CENTER_TEXT.PORTAL_VENDOR}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {AUTH_CENTER_TEXT.PORTAL_VENDOR_DESC}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={VEDNOR_LOGIN_PATH}
                className="relative overflow-hidden w-full py-3 px-4 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium text-center rounded-xl transition-all duration-200 shadow-md active:scale-[0.98]"
              >
                {AUTH_CENTER_TEXT.BTN_VENDOR_LOGIN}
              </Link>
              <Link
                href={VEDNOR_REGISTER_PATH}
                className="w-full py-3 px-4 border border-border hover:bg-muted/50 text-foreground text-sm font-medium text-center rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                {AUTH_CENTER_TEXT.BTN_VENDOR_REGISTER}
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
