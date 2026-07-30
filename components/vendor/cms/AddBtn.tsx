"use client";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export function AddBtn({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-black px-4 py-2 text-[13px] font-semibold rounded-xl border border-slate-900 transition-colors shadow-sm"
    >
      <Plus size={14} className="text-slate-300" /> {label}
    </motion.button>
  );
}
