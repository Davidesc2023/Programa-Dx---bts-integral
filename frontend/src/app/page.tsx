import { redirect } from 'next/navigation';

/**
 * La raíz del app redirige al dashboard.
 * El layout protegido se encargará de redirigir a /login si no hay sesión.
 */
export default function RootPage() {
  redirect('/dashboard');
}
