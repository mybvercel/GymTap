import Link from "next/link";
import { headers } from "next/headers";
import { PanelEstaciones } from "@/components/PanelEstaciones";

export const metadata = { title: "Panel del gimnasio · GymTap" };

/**
 * El origen sale de la petición y no del navegador: es el que se imprime en el
 * QR, así que tiene que ser el público y no depender de dónde se abra el panel.
 */
export default async function PaginaPanel() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = `${protocolo}://${host}`;

  return (
    <main className="marco">
      <header style={{ marginBottom: "1rem" }}>
        <p className="eyebrow">GymTap</p>
        <h1 className="titulo">Panel del gimnasio</h1>
        <p className="suave" style={{ margin: "0.5rem 0 0" }}>
          Las etiquetas de cada máquina: el QR para imprimir y el chip NFC para escribir.
        </p>
      </header>

      <PanelEstaciones base={base} />

      <Link href="/" className="secundaria" style={{ marginTop: "1rem", display: "grid", placeContent: "center", textDecoration: "none" }}>
        Volver
      </Link>
    </main>
  );
}
