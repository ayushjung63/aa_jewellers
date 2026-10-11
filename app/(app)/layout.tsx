import { BottomNav } from "@/components/nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">{children}</main>
      <BottomNav />
    </>
  );
}
