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

### Datos migrados (inicial desde pedite_backup.json)
- 49 usuarios, 12 barrios, 5 categorías, 4 emprendedores

### Migración completa desde CSVs de Abacus
- Script `scripts/migrate-csv.ts`: parser CSV con soporte de campos entrecomillados con saltos de línea
- Deduplicación por email en users (maneja usuarios repetidos entre backup y CSVs)
- Remapping de userId cuando un email ya existía en DB con ID diferente (`userIdMap`)
- Validación FK en cascade: emprendedores → productos → pedidos → pedido items → payment records
- Dominio `test.pedite.shop` verificado y funcionando

### Datos finales en Neon DB
| Tabla | Registros |
|---|---|
| Vecinos | 126 |
| Emprendedores | 20 |
| Pedidos | 16 |
| Pedidos pendientes | 4 |
| Ventas totales (ENTREGADO) | $72.000 |
| Cuentas (accounts) | 30 |
| Productos | 54 |
| Barrios | 12 |
| Categorías | 10 |
| Coupons | 1 |
| PaymentRecords | 13 |
| SystemSettings | 6 |

### Bugs corregidos
- Parser CSV no soportaba newlines dentro de campos entrecomillados (causaba conteo incorrecto de emprendedores)
- `resolveUserId` faltaba en sección de pedidos (4 pedidos de usuario remapeado no se insertaban)
- 4 pedidos insertados manualmente con `total: 0` — corregidos con valores reales del CSV ($18.000 c/u)
- 3 usuarios del backup anterior que no existían en CSVs de Abacus eliminados (testuser, Martin Baez, Arq. Silvana Martin)

### Pendiente
- Verificar funcionamiento completo en producción (SSO Google, uploads, pedidos)
