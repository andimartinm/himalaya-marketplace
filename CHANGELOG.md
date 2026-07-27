# Changelog

## Migración Abacus → Vercel (2026-07-27)

### Infraestructura
- Repositorio GitHub: `github.com/andimartinm/himalaya-marketplace`
- Deploy: Vercel (proyecto `himalaya-marketplace`)
- URL: `https://himalaya-marketplace-andimartinms-projects.vercel.app`
- Base de datos: Neon PostgreSQL (integración nativa con Vercel)
- Almacenamiento de archivos: Vercel Blob (reemplaza AWS S3)

### Cambios realizados
- Limpiada configuración de Abacus (paths hardcodeados, .yarnrc.yml, env vars de Abacus)
- Creado .gitignore, .npmrc (legacy-peer-deps)
- Generado package-lock.json
- Agregado script postinstall para `prisma generate`
- Eliminado `@next/swc-wasm-nodejs` (incompatible con Next.js 14)
- Simplificado `next.config.js` para Vercel
- Limpiado `prisma/schema.prisma` (removido output hardcodeado de Abacus)
- Migrados todos los uploads de AWS S3 a Vercel Blob Storage (6 archivos)
- Eliminadas dependencias `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`
- Nuevo NEXTAUTH_SECRET generado
- Agregado NEXTAUTH_URL para producción
- Desactivada SSO Deployment Protection

### Datos migrados
- 49 usuarios, 12 barrios, 5 categorías, 4 emprendedores
- 26 relaciones emprendedor-barrio, 8 productos
- 3 registros de pago, 6 configuraciones del sistema
