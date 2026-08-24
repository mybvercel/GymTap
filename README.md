# GymTap

Pasás el teléfono por el chip NFC y queda registrada una serie.

Sin cuentas, sin formularios y sin depender de la señal del gimnasio.

## Cómo funciona

Hay **un solo chip y un solo link**. Cada vez que el teléfono lo lee, se
registra una serie y el contador avanza:

```
SERIE REGISTRADA        SERIE REGISTRADA
     1 de 4        →         2 de 4
```

Después de cada serie arranca el descanso. Nada que tocar, nada que confirmar.

El peso y las repeticiones vienen de la serie anterior. Corregirlos es
opcional, con botones grandes.

Cuando terminás la tanda, tocás **Terminar** y queda guardada en el historial.
El próximo pase empieza de cero.

## Qué poner en el chip

La dirección de la app, sin nada más:

```
https://gym-tap.vercel.app
```

## Por qué no hay backend

Un gimnasio es un sótano con paredes de hormigón y sin señal. Una app que
necesita la red para registrar una serie no sirve justo cuando hace falta.

Todo vive en el teléfono, en IndexedDB: registrar es instantáneo y no hay
cuenta que crear antes de entrenar. El costo es que el historial es de ese
dispositivo.

## Decisiones que no son obvias

**Ventana anti rebote de 4 segundos.** El NFC dispara la lectura apenas el
teléfono se acerca, y es facilísimo que lea dos veces en el mismo gesto. Sin
esa ventana, apoyar el celular registraría dos series. Cuatro segundos filtra
el rebote sin molestar: nadie hace dos series en cuatro segundos.

**El descanso se mide, no se pide.** Cada serie guarda cuánto se descansó
realmente antes de ella, calculado entre marcas de tiempo. Sale gratis y nadie
lo cargaría a mano.

**El temporizador cuenta contra una marca de tiempo futura**, no restando de a
un segundo. Cuando el teléfono se bloquea el navegador frena los intervalos y
un contador se atrasaría. Comparar contra el reloj hace que al volver a mirar,
el número sea el correcto.

**El contador no se corta en el objetivo.** Si hacés 6 series de 4, muestra
6 de 4. El objetivo orienta, no manda.

## Arquitectura

```
src/
  lib/
    dominio.ts   Tipos y cálculos. Sin dependencias.
    sesion.ts    Las reglas. Funciones puras.
    almacen.ts   IndexedDB. Lo único que toca el disco.
  components/
    Contador.tsx      La pantalla única: registra y muestra.
    Descanso.tsx      Temporizador.
    ListaHistorial.tsx
  app/
    page.tsx     La raíz es el destino del chip.
    historial/
```

## Correr el proyecto

```bash
npm install
npm run dev     # http://localhost:3010
npm test        # 9 pruebas, sin navegador
```

Para simular un pase del NFC, recargá la raíz: cada carga de la página es
exactamente lo que hace el chip.

## Falta

Service worker para que abra sin red. Hoy registrar funciona offline, pero
abrir la app no.
