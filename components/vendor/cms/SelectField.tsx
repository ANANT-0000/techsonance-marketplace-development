"use client";
export function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="min-w-0 flex flex-col group">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-slate-900">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[15px] shadow-sm transition-all duration-300 ease-out focus:outline-none focus:ring-[3px] focus:ring-slate-900/10 focus:border-slate-900 hover:border-slate-300 font-medium text-slate-900 appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 0.75rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.25em 1.25em",
          paddingRight: "2.5rem"
        }}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
