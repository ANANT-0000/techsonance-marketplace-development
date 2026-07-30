"use client";

export function InputField({
  label,
  value,
  onChange,
  textarea,
  mono,
  type,
  placeholder,
}: any) {
  const cls = `w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[15px] shadow-sm transition-all duration-300 ease-out focus:outline-none focus:ring-[3px] focus:ring-slate-900/10 focus:border-slate-900 hover:border-slate-300 placeholder:text-slate-400 text-slate-900 ${
    mono ? "font-mono text-sm break-all tracking-tight" : ""
  }`;
  
  return (
    <div className="min-w-0 flex flex-col group">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-slate-900">
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={3}
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      ) : (
        <input
          type={type || "text"}
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  );
}
