import { notFound } from "next/navigation";
import { ESTACIONES, resolverEstacion } from "@/lib/catalogo";
import { PantallaEstacion } from "@/components/PantallaEstacion";

/**
 * Destino de la etiqueta NFC y del QR: /e/<estacion>.
 *
 * La URL es corta a propósito. Se escribe en un chip NFC de 137 bytes y se
 * imprime en un QR que tiene que leerse rápido, torcido y con poca luz.
 */
export function generateStaticParams() {
  return ESTACIONES.map((e) => ({ estacion: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ estacion: string }> }) {
  const { estacion } = await params;
  const resuelto = resolverEstacion(estacion);
  return { title: resuelto ? `${resuelto.ejercicio.nombre} · GymTap` : "Estación desconocida · GymTap" };
}

export default async function PaginaEstacion({ params }: { params: Promise<{ estacion: string }> }) {
  const { estacion } = await params;
  const resuelto = resolverEstacion(estacion);
  if (!resuelto || !resuelto.estacion.activa) notFound();

  return <PantallaEstacion estacion={resuelto.estacion} ejercicio={resuelto.ejercicio} />;
}
