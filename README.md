# Sevilla respira

Widget de calidad del aire en Sevilla, en español, sin frameworks, dependencias de producción, claves ni backend. Incluye índice europeo, cuatro contaminantes, evolución reciente y previsión horaria, actualización manual y automática cada 30 minutos mientras la página está visible, estados de error y modo compacto.

## Publicar en GitHub Pages

1. Sube `index.html`, `styles.css` y `app.js` a la raíz de la rama `main` de `osrever/aire`, junto con este README.
2. En GitHub abre **Settings → Pages → Build and deployment**.
3. Selecciona **Deploy from a branch**, rama **main**, carpeta **/ (root)** y guarda.
4. Cuando termine el despliegue, abre `https://osrever.github.io/aire/`.

No hay paso de compilación. Las rutas de CSS y JavaScript son relativas y funcionan bajo la subruta `/aire/`. La URL no estará publicada hasta subir los archivos y activar Pages. La API debe ser accesible desde el navegador de cada visitante.

## Insertar en un medio o CMS

Modo compacto, recomendado para noticias y columnas:

```html
<iframe
  src="https://osrever.github.io/aire/?compact=1"
  title="Calidad del aire en Sevilla"
  width="100%"
  height="780"
  loading="lazy"
  style="display:block; width:100%; border:0; border-radius:22px;"
></iframe>
```

Modo completo con gráfico:

```html
<iframe
  src="https://osrever.github.io/aire/"
  title="Calidad del aire en Sevilla: evolución y previsión"
  width="100%"
  height="1240"
  loading="lazy"
  style="display:block; width:100%; border:0; border-radius:22px;"
></iframe>
```

Las alturas son conservadoras para móviles. Ajusta `height` según el ancho del espacio editorial; en escritorio se puede reducir. No se oculta el scroll vertical: permite consultar explicaciones desplegadas sin recortar contenido. Un iframe entre dominios no puede ajustar su altura al contenido automáticamente sin colaboración de la página anfitriona. No necesita permisos especiales ni acceso a cookies. Si tu CMS aplica `sandbox`, debe permitir scripts; si aplica CSP, permite el iframe de `https://osrever.github.io` y, dentro del documento del widget, `connect-src https://air-quality-api.open-meteo.com`. No incluye analítica, fuentes remotas ni bibliotecas externas.

## Datos y metodología

- API: `https://air-quality-api.open-meteo.com/v1/air-quality`.
- Centro aproximado de Sevilla: 37.3891, −5.9845. Presentación en `Europe/Madrid`.
- Variables actuales: `european_aqi`, `pm2_5`, `pm10`, `nitrogen_dioxide`, `ozone`. Serie horaria: `european_aqi`, dos días previos y dos días de previsión.
- Se solicitan timestamps Unix para evitar ambigüedades durante cambios de hora. La fecha de los datos y la de consulta se presentan por separado.
- La evolución muestra las 24 horas hasta la fecha del dato actual, incluida esa hora; la previsión, las 24 horas siguientes. Se representan huecos sin interpolar datos ausentes. El control de hora se puede manejar con teclado.
- Escala numérica European AQI de Open-Meteo: 0–20 buena; >20–40 razonablemente buena; >40–60 moderada; >60–80 mala; >80–100 muy mala; >100 extremadamente mala. Se clasifica el valor original, sin redondearlo antes. El arco se satura a 120 para fines visuales; el número siempre conserva el valor recibido. No representa un porcentaje.
- Datos modelizados de Open-Meteo / CAMS, **no mediciones directas de una estación**. La evolución reciente tampoco equivale a observaciones históricas de una estación.
- Referencias: [documentación Open-Meteo](https://open-meteo.com/en/docs/air-quality-api), [índice europeo de la AEMA](https://airindex.eea.europa.eu/), [licencia y atribución](https://open-meteo.com/en/terms), [condiciones comerciales](https://open-meteo.com/en/pricing).

**Uso en medios:** la disponibilidad pública sin clave no implica autorización comercial ilimitada. Revisa las condiciones vigentes de Open-Meteo antes de publicar en un periódico. El servicio gratuito está destinado a uso no comercial; un uso comercial puede requerir un plan y otra solución de acceso. Nunca introduzcas una clave privada en este frontend. Conserva la atribución visible y la licencia CC BY 4.0 de los datos.

No se incluyen cifras simuladas ni datos de demostración en la aplicación. Cuando falla la primera consulta se muestra indisponibilidad. Si falla una actualización posterior, se conservan los últimos datos y su fecha con un aviso. Se advierte cuando la fecha de los datos supera tres horas de antigüedad. Los valores ausentes se muestran como «—».

## Desarrollo en el entorno en la nube

Usa el checkout existente de `/workspace/aire`: cada tarea ya tiene un entorno aislado; no crees worktrees salvo petición explícita. Python 3 y un navegador moderno bastan. No hay instalación de paquetes, generación de código ni build.

```sh
cd /workspace/aire
python3 -m http.server 8000 --bind 127.0.0.1
```

Para comprobar específicamente el alojamiento bajo subruta, sirve el directorio padre:

```sh
cd /workspace
python3 -m http.server 8000 --bind 127.0.0.1
```

Comprueba internamente `/aire/`, `/aire/?compact=1` y la respuesta HTTP de ambos recursos locales. Reinicia el servidor en cada nueva tarea si hace falta; los procesos no se conservan al publicar un entorno. Evita duplicarlo si el puerto está ocupado por un servidor válido. No hace falta ningún secreto ni variable. Para las peticiones reales, el entorno necesita permitir `air-quality-api.open-meteo.com`; para consultar documentación, `open-meteo.com`.

## Validación realizada

Se ha ejecutado `node --check app.js` y un recorrido automatizado en Chromium con Playwright y respuestas sintéticas interceptadas **solo en el proceso de pruebas**, sin modificar la aplicación. Se verificaron los doce casos de clasificación, datos nulos, gráfico y selector horario, cambio de periodo, explicaciones, fallo HTTP inicial y posterior, conservación de datos, modo compacto, carga de recursos desde `/aire/` y ausencia de desbordamiento horizontal a 320, 375 y 768 px. No hubo errores de JavaScript. Se revisó una captura de la vista de escritorio.

**Limitación de esta sesión:** la política de red rechazó Open-Meteo con HTTP 403 del proxy. Por ello no se ha validado una respuesta real ni se han podido consultar las referencias vigentes. Los valores de las pruebas no son resultados reales de Sevilla. Quedan pendientes la comprobación de la API en vivo, Safari/Firefox y la publicación efectiva en GitHub Pages. El guardado del borrador de configuración del entorno tampoco pudo confirmarse; estas instrucciones locales permiten reproducir el arranque.
