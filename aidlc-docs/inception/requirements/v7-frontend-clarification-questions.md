# Preguntas de Clarificación — Increment v7: Frontend & UX

Por favor responde cada pregunta colocando la letra elegida después del tag `[Answer]:`.

---

## Question 1
¿Con qué deseas iniciar la fase Frontend & UX?

A) UX Flows completos del sistema (mapeo de flujos antes de codificar)
B) Wireframes de todas las pantallas (diseño low-fidelity en texto)
C) Setup técnico del frontend primero (Next.js + estructura + Tailwind configurado)
D) Primera pantalla funcional ya conectada al backend (Login + Dashboard con logo)
E) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 2
¿Dónde vivirá el proyecto frontend?

A) Dentro del mismo repositorio (carpeta `frontend/` en la raíz del workspace — monorepo)
B) Como proyecto separado (repositorio independiente)
C) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 3
¿Cuál es la estrategia de diseño responsivo?

A) Desktop-first — prioridad web de escritorio (pantallas >= 1280px)
B) Mobile-first — prioridad móvil, se adapta a escritorio
C) Ambos con igual prioridad (diseño adaptativo desde xs hasta xl)
D) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 4
¿Cómo se almacenará el token JWT en el frontend?

A) httpOnly cookies — más seguro, protege contra XSS, backend debe emitir cookie
B) localStorage — más simple, el frontend lo gestiona directamente
C) sessionStorage — por pestaña de navegador, se pierde al cerrar
D) Other (please describe after [Answer]: tag below)

[B]: 

---

## Question 5
¿En qué idioma debe estar la interfaz de usuario?

A) Solo español
B) Inglés únicamente
C) Bilingüe español / inglés con soporte i18n
D) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 6
¿Cómo se gestionan las vistas según el rol del usuario (Admin / Operador / Laboratorio)?

A) Dashboard común con elementos visibles/ocultos según rol (misma URL, permisos granulares)
B) Dashboards y rutas completamente separadas por rol (ej: /admin/*, /operator/*, /lab/*)
C) Dashboard común con secciones de menú distintas por rol (layout compartido, menú dinámico)
D) Other (please describe after [Answer]: tag below)

[C]: 

---

## Question 7
¿Qué estrategia de renderizado usará Next.js?

A) CSR (Client-Side Rendering) — SPA pura, sin SSR, todo en el cliente
B) SSR (Server-Side Rendering) — páginas renderizadas en servidor en cada petición
C) Híbrido — login/dashboard en CSR + páginas de consulta en SSR para SEO si aplica
D) Other (please describe after [Answer]: tag below)

[A]: 

---

## Question 8
¿Cuál es la paleta de colores principal del sistema UI?
[Nota: Logo BTS Integral detectado con teal `#1B7A6B`, amarillo `#F5C518`, azul `#4490D9`]

A) Derivada del logo — teal oscuro como color primario, amarillo como acento, azul como secundario
B) Azul médico / institucional clásico (tonos azul marino / blanco / gris claro)
C) Verde salud (tonos verde / blanco / gris)
D) Other (please describe after [Answer]: tag below)

[A]: 
