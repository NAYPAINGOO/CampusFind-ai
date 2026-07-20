import { SearchCheck } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-black tracking-tight">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
        <SearchCheck aria-hidden="true" size={23} />
      </span>
      <span>CampusFind <span className="text-blue-600">AI</span></span>
    </div>
  );
}
