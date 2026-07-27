'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Building2, MapPin, Clock, Phone, ChevronLeft, Search, Loader2, Store, ShoppingCart, Plus, Minus, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import toast from 'react-hot-toast';
import { normalizePhoneForWhatsApp } from '@/lib/phone-utils';
import { createProductSlug } from '@/lib/utils/slugify';

interface Producto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoria: {
    id: string;
    name: string;
  } | null;
}

interface Empresa {
  id: string;
  businessName: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  direccionComercial: string | null;
  zona: string | null;
  horarios: string | null;
  tipo?: 'VECINO' | 'EMPRESA';
  user: {
    phone: string | null;
  };
  categoria: {
    id: string;
    name: string;
  } | null;
  productos: Producto[];
}

export default function ComercioPage() {
  const params = useParams();
  const { addItem, items, updateQuantity, removeItem } = useCart();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');

  useEffect(() => {
    if (params.id) {
      fetch(`/api/comercios/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setEmpresa(data);
          }
        })
        .catch(() => setEmpresa(null))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.productoId === productId);
    return item?.quantity || 0;
  };

  const handleAddToCart = (producto: Producto) => {
    if (!empresa) return;
    addItem({
      productoId: producto.id,
      name: producto.name,
      price: producto.price,
      quantity: 1,
      emprendedorId: empresa.id,
      emprendedorName: empresa.businessName,
      imageUrl: producto.imageUrl || '',
    });
    toast.success('Agregado al carrito');
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const currentQty = getCartQuantity(productId);
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQty);
    }
  };

  // Get unique categories from productos
  const categorias = empresa?.productos
    ? Array.from(new Set(empresa.productos.filter(p => p.categoria).map(p => JSON.stringify(p.categoria))))
        .map(c => JSON.parse(c))
    : [];

  // Filter productos
  const filteredProductos = empresa?.productos.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !selectedCategoria || p.categoria?.id === selectedCategoria;
    return matchesSearch && matchesCategoria && p.available;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Comercio no encontrado</p>
            <Link href="/comercios" className="text-blue-600 hover:underline mt-2 inline-block">
              Volver a comercios
            </Link>
          </div>
        </main>
        <Footer variant="light" />
      </div>
    );
  }

  const whatsappLink = empresa.user.phone
    ? `https://wa.me/${normalizePhoneForWhatsApp(empresa.user.phone)}?text=${encodeURIComponent(`Hola! Vi tu comercio ${empresa.businessName} en Pedite y quer\u00eda consultarte...`)}`
    : null;

  const isEmpresa = empresa.tipo === 'EMPRESA';
  const accentColor = isEmpresa ? 'blue' : 'teal';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div 
          className={`relative text-white ${!empresa.bannerUrl ? (empresa.tipo === 'EMPRESA' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-teal-600 to-emerald-700') : ''}`}
          style={empresa.bannerUrl ? { backgroundImage: `url(${empresa.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {empresa.bannerUrl && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative max-w-6xl mx-auto px-4 py-6">
            <Link href={empresa.tipo === 'EMPRESA' ? '/comercios' : '/catalogo'} className={`inline-flex items-center gap-1 ${empresa.tipo === 'EMPRESA' ? 'text-blue-200' : 'text-teal-200'} hover:text-white mb-4 text-sm`}>
              <ChevronLeft className="w-4 h-4" />
              {empresa.tipo === 'EMPRESA' ? 'Volver a comercios' : 'Volver al catálogo'}
            </Link>

            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {empresa.logoUrl ? (
                  <Image
                    src={empresa.logoUrl}
                    alt={empresa.businessName}
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                ) : empresa.tipo === 'EMPRESA' ? (
                  <Building2 className="w-10 h-10 text-blue-400" />
                ) : (
                  <Store className="w-10 h-10 text-teal-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-bold truncate">{empresa.businessName}</h1>
                  <span className={`${empresa.tipo === 'EMPRESA' ? 'bg-blue-500' : 'bg-teal-500'} text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0`}>
                    {empresa.tipo === 'EMPRESA' ? 'Empresa' : 'Emprendedor'}
                  </span>
                </div>
                
                {empresa.categoria && (
                  <span className={`inline-block ${empresa.tipo === 'EMPRESA' ? 'bg-blue-500/30 text-blue-100' : 'bg-teal-500/30 text-teal-100'} text-xs px-2 py-1 rounded-full mb-2`}>
                    {empresa.categoria.name}
                  </span>
                )}

                {empresa.description && (
                  <p className={`${empresa.tipo === 'EMPRESA' ? 'text-blue-100' : 'text-teal-100'} text-sm mb-3 line-clamp-2`}>{empresa.description}</p>
                )}

                <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${empresa.tipo === 'EMPRESA' ? 'text-blue-100' : 'text-teal-100'}`}>
                  {empresa.zona && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {empresa.zona}
                    </span>
                  )}
                  {empresa.horarios && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {empresa.horarios}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact button */}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Contactar
              </a>
            )}
          </div>
        </div>

        {/* Products section */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 ${isEmpresa ? 'focus:ring-blue-500' : 'focus:ring-teal-500'} focus:border-transparent outline-none bg-white`}
              />
            </div>

            {categorias.length > 0 && (
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className={`px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 ${isEmpresa ? 'focus:ring-blue-500' : 'focus:ring-teal-500'} focus:border-transparent outline-none bg-white`}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Products count */}
          <p className="text-gray-500 text-sm mb-4">
            {filteredProductos.length} producto{filteredProductos.length !== 1 ? 's' : ''}
          </p>

          {/* Products grid */}
          {filteredProductos.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm || selectedCategoria ? 'No se encontraron productos' : 'Este comercio aún no tiene productos'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProductos.map((producto) => {
                const cartQty = getCartQuantity(producto.id);
                return (
                  <div
                    key={producto.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Image - click to detail */}
                    <Link href={`/producto/${createProductSlug(empresa.businessName, producto.name, producto.id)}`} className="block aspect-square bg-gray-100 relative cursor-pointer">
                      {producto.imageUrl ? (
                        <Image
                          src={producto.imageUrl}
                          alt={producto.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                        {producto.name}
                      </h3>
                      {producto.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {producto.description}
                        </p>
                      )}
                      <p className={`text-lg font-bold ${isEmpresa ? 'text-blue-600' : 'text-teal-600'} mb-2`}>
                        ${producto.price.toLocaleString('es-AR')}
                      </p>

                      {/* Ver más + carrito compacto */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/producto/${createProductSlug(empresa.businessName, producto.name, producto.id)}`}
                          className={`flex-1 py-1.5 text-center ${isEmpresa ? 'text-blue-600 border-blue-600 hover:bg-blue-50' : 'text-teal-600 border-teal-600 hover:bg-teal-50'} border rounded-lg text-xs font-medium transition-colors`}
                        >
                          Ver más
                        </Link>
                        {cartQty === 0 ? (
                          <button
                            onClick={() => handleAddToCart(producto)}
                            className={`p-1.5 ${isEmpresa ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'} text-white rounded-lg transition-colors`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className={`flex items-center ${isEmpresa ? 'bg-blue-50' : 'bg-teal-50'} rounded-lg`}>
                            <button
                              onClick={() => handleUpdateQuantity(producto.id, -1)}
                              className={`p-1 ${isEmpresa ? 'text-blue-600 hover:bg-blue-100' : 'text-teal-600 hover:bg-teal-100'} rounded-l-lg transition-colors`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`px-1.5 text-sm font-semibold ${isEmpresa ? 'text-blue-600' : 'text-teal-600'}`}>{cartQty}</span>
                            <button
                              onClick={() => handleUpdateQuantity(producto.id, 1)}
                              className={`p-1 ${isEmpresa ? 'text-blue-600 hover:bg-blue-100' : 'text-teal-600 hover:bg-teal-100'} rounded-r-lg transition-colors`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer variant="light" />
    </div>
  );
}
