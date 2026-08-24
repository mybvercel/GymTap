/**
 * El build de navegador de qrcode no publica tipos propios.
 *
 * Se importa ese y no el entry por defecto porque el principal arrastra el
 * renderer de Node (fs y pngjs) al bundle del cliente, y eso rompe el render
 * del servidor.
 */
declare module "qrcode/lib/browser" {
  import type { QRCodeToDataURLOptions } from "qrcode";
  export function toDataURL(texto: string, opciones?: QRCodeToDataURLOptions): Promise<string>;
  const porDefecto: { toDataURL: typeof toDataURL };
  export default porDefecto;
}
