"use client";

export function MobileDrawer({
  open,
  onClose,
  widthClassName = "w-[255px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  widthClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex ${widthClassName} shrink-0 flex-col border-r border-black/8 bg-[#fdfdfd] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children}
      </div>
    </>
  );
}
