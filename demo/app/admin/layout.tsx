import DemoShell from "@demo/components/DemoShell";

export default function AdminDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DemoShell role="ADMIN">{children}</DemoShell>;
}
