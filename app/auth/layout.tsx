import "./index.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-background selection:bg-blue-100 selection:text-blue-900">
      {children}
    </div>
  );
}
