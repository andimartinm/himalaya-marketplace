'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ProductImageSlider } from '@/components/product-image-slider';
import { Footer } from '@/components/footer';
import { ArrowLeft, ShoppingCart, MapPin, Clock, Phone, Mail, Banknote, CreditCard, Link2, Truck, Minus, Plus, Package, MessageCircle, Copy, Check, Share2 } from 'lucide-react';
import { createWhatsAppLink } from '@/lib/phone-utils';
import { useCart } from '@/hooks/use-cart';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { createProductSlug } from '@/lib/utils/slugify';

interface Producto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  imageUrl2?: string | null;
  imageUrl3?: string | null;
  images?: string[] | null;
  emprendedor: {
    id: string;
    businessName: string;
    description: string;
    horarios: string;
    address: string;
    acceptsCash: boolean;
    bankAlias: string;
    bankCbu: string;
    mercadoPagoLink: string;
    deliveryMethod: string;
    deliveryMethods?: string | null;
    user: { fullName: string; phone: string; email: string; lotNumber?: string; barrio?: { name: string } };
    barrios: { barrio: { name: string } }[];
  };
  categoria: { name: string } | null;
  relatedProducts?: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string | null;
    categoria: { name: string } | null;
  }[];
}

export default function ProductoDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const { addItem } = useCart();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const user = session?.user as any;

  useEffect(() => {
    if (params?.slug) {
      // The slug format is [...names]-[id] (e.g. mi-comercio-pizza-ricas-clyu2r...). 
      // So we extract everything after the last hyphen as the ID.
      const slugParts = (params.slug as string).split('-');
      const actualId = slugParts[slugParts.length - 1];

      fetch(`/api/productos/${actualId}`)
        .then(res => res.json())
        .then(data => setProducto(data))
        .catch(() => setProducto(null))
        .finally(() => setLoading(false));
    }
  }, [params?.slug]);

  const handleAddToCart = () => {
    if (!producto) return;

    if (status === 'unauthenticated') {
      toast.error('Tenés que iniciar sesión para comprar');
      router.push('/login');
      return;
    }

    const success = addItem({
      productoId: producto.id,
      name: producto.name,
      price: producto.price,
      quantity,
      emprendedorId: producto.emprendedor?.id ?? '',
      emprendedorName: producto.emprendedor?.businessName ?? '',
      imageUrl: producto.imageUrl || '',
    });

    if (success) {
      toast.success(`${quantity} x ${producto.name} agregado al carrito`);
    } else {
      toast.error('Solo podés agregar productos del mismo emprendedor. Vacía el carrito primero.');
    }
  };

  const getDeliveryMethodLabel = (method?: string) => {
    switch (method) {
      case 'ENTREGA_PROPIA': return 'A domicilio';
      case 'RETIRO_DOMICILIO': return 'En el domicilio/local del emprendedor';
      case 'PUNTO_ENCUENTRO': return 'A coordinar';
      default: return 'Consultar';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl text-gray-600 mb-4">Producto no encontrado</h1>
          <Link href="/catalogo" className="text-teal-600 hover:underline">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 pb-20 w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
            >
              {(() => {
                const p = producto as any;
                const allImages = [
                  producto.imageUrl,
                  p.imageUrl2,
                  p.imageUrl3,
                  ...(Array.isArray(producto.images) ? producto.images : [])
                ].filter(Boolean) as string[];

                return allImages.length > 1 ? (
                  <ProductImageSlider images={allImages} alt={producto.name ?? ''} />
                ) : (
                  <div className="relative aspect-square bg-gray-100">
                    {allImages.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                    src={allImages[0]}
                    alt={producto.name ?? ''}
                    className="absolute inset-0 w-full h-full object-cover"
                    />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-20 h-20 text-gray-300" />
                    </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>

            {/* Related Desktop */}
            <div className="hidden md:block">
              {producto.relatedProducts && producto.relatedProducts.length > 0 && (
                <RelatedProducts products={producto.relatedProducts} emprendedorName={producto.emprendedor?.businessName || ''} />
              )}
            </div>
          </div>

          {/* Category + Share row (mobile only) */}
          <div className="flex items-center justify-between md:hidden">
            {producto.categoria ? (
              <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium">
                {producto.categoria.name}
              </span>
            ) : <div />}
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `¡Mirá este producto! ${producto.name} - $${producto.price?.toLocaleString('es-AR')}`;
                if (navigator.share) {
                  navigator.share({ title: producto.name, text, url });
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success('Link copiado al portapapeles');
                }
              }}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-teal-600 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">Compartir</span>
            </button>
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Category + Share row (desktop) */}
            <div className="hidden md:flex items-center justify-between">
              {producto.categoria ? (
                <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium">
                  {producto.categoria.name}
                </span>
              ) : <div />}
              <button
                onClick={() => {
                  const url = window.location.href;
                  const text = `¡Mirá este producto! ${producto.name} - $${producto.price?.toLocaleString('es-AR')}`;
                  if (navigator.share) {
                    navigator.share({ title: producto.name, text, url });
                  } else {
                    navigator.clipboard.writeText(url);
                    toast.success('Link copiado al portapapeles');
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-teal-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Compartir</span>
              </button>
            </div>

            <h1 className="text-3xl font-bold text-gray-800">{producto.name}</h1>

            <p className="text-gray-600 text-lg">{producto.description}</p>

            <div className="text-3xl font-bold text-teal-600">
              ${producto.price?.toLocaleString('es-AR')}
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Cantidad:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-teal-600 text-white rounded-xl font-semibold text-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Agregar al carrito
            </button>

            {/* Emprendedor info */}
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-lg text-gray-800">{producto.emprendedor?.businessName}</h2>
              <p className="text-gray-600 text-sm">{producto.emprendedor?.description}</p>

              <div className="space-y-2 text-sm">
                {producto.emprendedor?.horarios && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-teal-600" />
                    {producto.emprendedor.horarios}
                  </div>
                )}
                {/* Address del emprendedor */}
                {producto.emprendedor?.address ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    {producto.emprendedor.address}
                  </div>
                ) : producto.emprendedor?.user?.barrio?.name ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    {producto.emprendedor.user.barrio.name}
                    {producto.emprendedor.user.lotNumber && `, Lote ${producto.emprendedor.user.lotNumber}`}
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="w-4 h-4 text-teal-600" />
                  {(() => {
                    let methods: string[] = [];
                    if (producto.emprendedor?.deliveryMethods) {
                    try {
                    methods = JSON.parse(producto.emprendedor.deliveryMethods);
                    } catch (e) {
                    methods = [producto.emprendedor.deliveryMethod];
                    }
                    } else if (producto.emprendedor?.deliveryMethod) {
                    methods = [producto.emprendedor.deliveryMethod];
                    }
                    if (methods.length === 0) return 'Consultar';
                    return methods.map(getDeliveryMethodLabel).join(', ');
                  })()}
                </div>
                {producto.emprendedor?.user?.phone && (
                  <a
                    href={createWhatsAppLink(producto.emprendedor.user.phone, `Hola! Vi tu producto "${producto.name}" en Pedite y quería consultarte`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-700"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp: {producto.emprendedor.user.phone}
                  </a>
                )}
              </div>

              {/* Barrios */}
              {producto.emprendedor?.barrios && producto.emprendedor.barrios.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Opera en:</p>
                  <div className="flex flex-wrap gap-2">
                    {producto.emprendedor.barrios.map((b, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {b.barrio?.name}
                    </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment methods */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-base font-semibold text-gray-800 mb-4">💳 Medios de pago</p>
                <div className="flex flex-col gap-3">
                  {producto.emprendedor?.acceptsCash && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-green-800">Efectivo</span>
                    </div>
                  )}
                  {(producto.emprendedor?.bankAlias || producto.emprendedor?.bankCbu) && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-blue-800">Transferencia</span>
                    </div>
                  )}
                  {producto.emprendedor?.mercadoPagoLink && (
                    <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-5 h-5 text-cyan-600" />
                    </div>
                    <span className="font-medium text-cyan-800">Mercado Pago</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Related Mobile */}
            <div className="md:hidden mt-8 pb-4">
              {producto.relatedProducts && producto.relatedProducts.length > 0 && (
                <RelatedProducts products={producto.relatedProducts} emprendedorName={producto.emprendedor?.businessName || ''} />
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  );
}

function RelatedProducts({ products, emprendedorName }: { products: NonNullable<Producto['relatedProducts']>, emprendedorName: string }) {
  if (products.length === 0) return null;
  return (
    <div className="pt-6 border-t border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Productos relacionados</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(p => (
          <Link
            key={p.id}
            href={`/producto/${createProductSlug(emprendedorName, p.name, p.id)}`}
            className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100"
          >
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-300" />
                </div>
              )}
              {p.categoria && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 rounded text-[10px] font-medium text-gray-700 shadow-sm">
                  {p.categoria.name}
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-tight mb-1 group-hover:text-teal-600 transition-colors">{p.name}</h3>
              <p className="font-bold text-teal-600 text-sm">${p.price.toLocaleString('es-AR')}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
