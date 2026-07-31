"use client";
export function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="min-w-0 flex flex-col group">
      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-stone-900">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[15px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 ease-out focus:outline-none focus:ring-[3px] focus:ring-amber-800/15 focus:border-amber-800/40 hover:border-stone-300 font-medium text-stone-900 appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2378716c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 0.75rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.25em 1.25em",
          paddingRight: "2.5rem",
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
