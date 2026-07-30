"use client";
export function ColorField({ label, value, onChange }: any) {
  return (
    <div className="min-w-0 flex flex-col group">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-slate-900">
        {label}
      </label>
      <div className="flex gap-2 min-w-0 relative items-center">
        <div className="relative w-11 h-11 shrink-0 group-hover:scale-105 transition-transform duration-300">
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            className="absolute inset-0 rounded-xl border border-slate-200 shadow-sm"
            style={{ backgroundColor: value || "#000000" }}
          />
        </div>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-4 py-3 text-[15px] shadow-sm transition-all duration-300 ease-out focus:outline-none focus:ring-[3px] focus:ring-slate-900/10 focus:border-slate-900 hover:border-slate-300 font-mono tracking-wider text-slate-900 uppercase"
        />
      </div>
    </div>
  );
}
