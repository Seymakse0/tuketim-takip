import { VoyageShell } from "@/components/VoyageShell";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <VoyageShell>{children}</VoyageShell>;
}
