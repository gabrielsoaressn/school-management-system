import DemoShell from "@demo/components/DemoShell";

export default function StudentDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DemoShell role="STUDENT">{children}</DemoShell>;
}
