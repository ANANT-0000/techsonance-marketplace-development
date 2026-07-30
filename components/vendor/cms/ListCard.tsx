import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export function ListCard({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 relative shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 min-w-0 flex flex-col group"
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-4 top-4 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all duration-200"
      >
        <Trash2 size={16} />
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-6 pr-8">
        {children}
      </div>
    </motion.div>
  );
}
