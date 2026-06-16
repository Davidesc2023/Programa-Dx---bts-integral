export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#f2f4f4' }}>
      <header className="bg-white border-b border-[#e0e8e5] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: '#1B7A6B' }}
          >
            BTS Integral
          </span>
          <span className="text-sm" style={{ color: '#6e7976' }}>
            Programa de Diagnóstico Genético
          </span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="text-center py-6 text-xs" style={{ color: '#9eaaa7' }}>
        © {new Date().getFullYear()} BTS Integral · Información confidencial de salud
      </footer>
    </div>
  );
}
