export function generarTokenHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(64))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

export function calcularExpiracion(horas = 72): Date {
  return new Date(Date.now() + horas * 60 * 60 * 1000)
}

export function tokenEstaExpirado(expiraAt: Date): boolean {
  return expiraAt < new Date()
}
