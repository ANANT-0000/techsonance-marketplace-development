export function CmsSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-6 md:p-8 flex flex-col min-w-0 overflow-hidden mb-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex justify-between items-center pb-4 mb-6 relative">
        <h3 className="text-[17px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
        </h3>
        {action}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-slate-100 via-slate-100 to-transparent" />
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
