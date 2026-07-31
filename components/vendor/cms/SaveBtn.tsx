import { Save } from "lucide-react";
import { CMS_SAVE_BTN_TEXT } from "@/constants/vendorText";

export function SaveBtn({
  onClick,
  saving,
  label = CMS_SAVE_BTN_TEXT.SAVE,
}: {
  onClick: () => void;
  saving: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all duration-200 ease-out shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-amber-800/30"
    >
      <Save className={`w-3.5 h-3.5 ${saving ? "animate-pulse" : ""}`} />
      {saving ? CMS_SAVE_BTN_TEXT.SAVING : label}
    </button>
  );
}
