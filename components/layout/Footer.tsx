// Footer jest komponentem serwerowym (renderowany na backendzie, statyczny HTML).
// Nie potrzebuje "use client", bo nie ma stanu ani efektów.

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="brand-mini">Big Blog</div>
      <div>
        © {year} • Stworzony z <span style={{ color: "var(--color-danger)" }}>♥</span> na Next.js + Supabase + Vercel
      </div>
    </footer>
  );
}
