import DemoShell from "@demo/components/DemoShell";

export default function ParentDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DemoShell role="PARENT">{children}</DemoShell>;
}
