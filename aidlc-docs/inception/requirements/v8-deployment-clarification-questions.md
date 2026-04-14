# Increment v8: Deployment — Requirement Verification Questions

Por favor responde todas las preguntas colocando tu respuesta en el tag `[Answer]:` correspondiente.

---

## Q1: Entorno objetivo de deployment

¿Dónde se va a desplegar APP-DX?

A) VPS/Servidor propio con Docker (DigitalOcean, Hetzner, Linode, etc.)
B) AWS (EC2 + RDS, o ECS/Fargate, o Elastic Beanstalk)
C) Railway / Render / Fly.io (plataforma gestionada)
D) Azure (App Service, AKS, Container Apps)
E) Solo quiero correrlo en local con Docker Compose (sin cloud por ahora)
X) Otro (describe después del tag)

[C]: 

---

## Q2: Estrategia de deployment del Frontend

¿Cómo se desplegará el frontend Next.js?

A) En el mismo servidor/contenedor que el backend (con Nginx como reverse proxy)
B) En un servicio separado (Vercel, Netlify, Cloudflare Pages, S3+CloudFront)
C) Contenedor Docker propio en el mismo host que el backend
D) No me importa, decídelo según el entorno elegido en Q1
X) Otro (describe después del tag)

[B]: 

---

## Q3: Reverse proxy / SSL

¿Cómo se manejará el tráfico HTTPS y el certificado SSL?

A) Nginx + Let's Encrypt (Certbot) en el mismo host
B) Traefik con certificados automáticos
C) El proveedor cloud gestiona SSL (ej: Railway, Render, Vercel)
D) No es necesario SSL por ahora (solo HTTP en red interna)
X) Otro (describe después del tag)

[C]: 

---

## Q4: CI/CD Pipeline

¿Se necesita un pipeline de CI/CD automatizado?

A) Sí — GitHub Actions (build, test, deploy en cada push a main)
B) Sí — pero solo manual / semi-automático (script de deploy)
C) No por ahora — solo instrucciones de deploy manual con Docker Compose
X) Otro (describe después del tag)

[A]: 

---

## Q5: Base de datos en producción

¿Cómo se maneja PostgreSQL en el entorno de destino?

A) Docker Compose en el mismo host (como está ahora)
B) Servicio gestionado (RDS, Supabase, Neon, Railway Postgres, etc.)
C) PostgreSQL instalado directamente en el servidor (sin Docker)
X) Otro (describe después del tag)

[A]: 

---

## Q6: Persistencia de archivos adjuntos

Los adjuntos (resultados de laboratorio) se guardan actualmente en `/app/uploads` (volumen Docker local).

A) Mantener en volumen Docker local (adecuado para un solo servidor)
B) Migrar a almacenamiento externo (S3, Cloudflare R2, Backblaze B2)
C) No me preocupa ahora, mantener como está
X) Otro (describe después del tag)

[A]: 

---

## Q7: Variables de entorno y secretos

¿Cómo se gestionarán los secretos en producción (JWT_SECRET, DATABASE_URL, etc.)?

A) Archivo `.env` en el servidor (sin gestión formal de secretos)
B) Variables de entorno del proveedor cloud (Railway, Render envs, etc.)
C) Gestor de secretos (AWS Secrets Manager, HashiCorp Vault, Doppler)
X) Otro (describe después del tag)

[B]: 
