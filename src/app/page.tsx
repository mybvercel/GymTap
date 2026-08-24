import { Contador } from "@/components/Contador";

/**
 * La raíz es el destino del chip NFC. Abrirla ya cuenta como pasar el
 * teléfono, así que registra una serie.
 */
export const dynamic = "force-static";

export default function Inicio() {
  return <Contador />;
}
