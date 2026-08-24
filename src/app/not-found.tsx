import Link from "next/link";

export default function NoEncontrada() {
  return (
    <main className="marco" style={{ justifyContent: "center", gap: "1rem" }}>
      <h1 className="titulo">Esta etiqueta no está registrada</h1>
      <p className="suave" style={{ margin: 0 }}>
        Puede que la máquina esté fuera de servicio o que la etiqueta se haya
        escrito con otra dirección. Avisale a alguien del gimnasio.
      </p>
      <Link href="/" className="accion" style={{ display: "grid", placeContent: "center", textDecoration: "none" }}>
        Ir al inicio
      </Link>
    </main>
  );
}
