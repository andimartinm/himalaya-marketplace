import { Metadata } from 'next';
import { prisma } from '@/lib/db';

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Support both old URLs (/producto/abc123) and new SEO URLs (/producto/mi-comercio-producto-abc123)
    const slugParts = params.id.split('-');
    const actualId = slugParts[slugParts.length - 1];

    const producto = await prisma.producto.findUnique({
      where: { id: actualId },
      select: {
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        emprendedor: {
          select: { businessName: true },
        },
      },
    });

    if (!producto) {
      return {
        title: 'Producto no encontrado - Pedite',
      };
    }

    const title = `${producto.name} - Pedite`;
    const description = producto.description || `${producto.name} de ${producto.emprendedor?.businessName || 'Pedite'}`;
    const price = producto.price?.toLocaleString('es-AR') || '';

    return {
      title,
      description: `${description} - $${price}`,
      openGraph: {
        title: `${producto.name} - $${price}`,
        description: description,
        images: producto.imageUrl ? [{ url: producto.imageUrl, width: 800, height: 800 }] : ['/og-image.jpg'],
        type: 'website',
        siteName: 'Pedite',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${producto.name} - $${price}`,
        description: description,
        images: producto.imageUrl ? [producto.imageUrl] : ['/og-image.jpg'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Pedite - Marketplace de barrio',
    };
  }
}

export default function ProductoLayout({ children }: Props) {
  return <>{children}</>;
}
