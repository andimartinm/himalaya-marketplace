export function createProductSlug(emprendedorName: string, productName: string, id: string): string {
  const combinedName = `${emprendedorName} ${productName}`;
  const slug = combinedName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}-${id}`;
}

export function extractIdFromSlug(slug: string): string | null {
  const parts = slug.split('-');
  return parts.length > 0 ? parts[parts.length - 1] : null;
}
