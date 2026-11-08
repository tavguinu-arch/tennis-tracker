import './globals.css';

export const metadata = {
  title: 'Tennis Tracker',
  description: 'Gestão Profissional de Encordoamentos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
