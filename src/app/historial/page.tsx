import Link from "next/link";
import { ListaHistorial } from "@/components/ListaHistorial";

export const metadata = { title: "Historial · GymTap" };

export default function PaginaHistorial() {
  return (
    <main className="marco">
      <header style={{ marginBottom: "1rem" }}>
        <p className="eyebrow">GymTap</p>
        <h1 className="titulo">Historial</h1>
      </header>

      <ListaHistorial />

      <Link
        href="/"
        className="secundaria"
        style={{ marginTop: "1rem", display: "grid", placeContent: "center", textDecoration: "none" }}
      >
        Volver
      </Link>
    </main>
  );
}
