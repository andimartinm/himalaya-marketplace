import type { Metadata } from 'next';
import RegistroEmpresaForm from './RegistroEmpresaForm';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const showEmprendedor =
    params.showEmprendedor === '1' ||
    params.showemprendedor === '1' ||
    params.plan === 'emprendedor';

  if (showEmprendedor) {
    return {
      title: 'Sumá tu Emprendimiento | Pedite',
      description: 'Registrá tu emprendimiento en Pedite y llegá a más clientes. Plan desde $15.000/mes.',
      openGraph: {
        title: 'Sumá tu Emprendimiento | Pedite',
        description: 'Registrá tu emprendimiento en Pedite y llegá a más clientes. Plan desde $15.000/mes.',
        images: [
          {
            url: '/og-image-emprendedores.jpg',
            width: 1200,
            height: 630,
            alt: 'Pedite - Sumá tu Emprendimiento',
          },
        ],
        type: 'website',
        siteName: 'Pedite',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Sumá tu Emprendimiento | Pedite',
        description: 'Registrá tu emprendimiento en Pedite y llegá a más clientes.',
        images: ['/og-image-emprendedores.jpg'],
      },
    };
  }

  return {
    title: 'Sumá tu Empresa | Pedite',
    description: 'Registrá tu comercio en Pedite y llegá a más clientes en Pilar del Este. Planes desde $15.000/mes.',
    openGraph: {
      title: 'Sumá tu Empresa | Pedite',
      description: 'Registrá tu comercio en Pedite y llegá a más clientes en Pilar del Este. Planes desde $15.000/mes.',
      images: [
        {
          url: '/og-image-empresa.jpg',
          width: 1200,
          height: 630,
          alt: 'Pedite - Sumá tu Empresa',
        },
      ],
      type: 'website',
      siteName: 'Pedite',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sumá tu Empresa | Pedite',
      description: 'Registrá tu comercio en Pedite y llegá a más clientes en Pilar del Este.',
      images: ['/og-image-empresa.jpg'],
    },
  };
}

export default function RegistroEmpresaPage() {
  return <RegistroEmpresaForm />;
}
