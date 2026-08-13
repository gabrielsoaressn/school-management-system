import DemoShell from "@demo/components/DemoShell";

export default function TeacherDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DemoShell role="TEACHER">{children}</DemoShell>;
}
