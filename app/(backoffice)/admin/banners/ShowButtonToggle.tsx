"use client";

/*
  "Show the button on this banner" switch for the admin panel.

  Turning it off only hides the button. The banner picture stays clickable
  and still goes to the chosen link, and the button text is kept, so turning
  it back on brings the same button back.
*/
export default function ShowButtonToggle({
  checked,
  onChange,
  className = "",
  label = "Show the button on this banner",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#0a583b]"
      />

      <span>
        <span className="block text-sm font-extrabold text-[#142019]">
          {label}
        </span>

        <span className="mt-0.5 block text-xs leading-5 text-[#647168]">
          {checked
            ? "Visible on the storefront."
            : "Hidden. The banner itself still opens the link when clicked."}
        </span>
      </span>
    </label>
  );
}
