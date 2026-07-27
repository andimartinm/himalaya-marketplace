'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Building2, MapPin, Clock, ChevronRight, Search, Loader2, Store, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createProductSlug } from '@/lib/utils/slugify';

interface Producto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface Empresa {
  id: string;
  businessName: string;
  description: string | null;
  logoUrl: string | null;
  direccionComercial: string | null;
  zona: string | null;
  horarios: string | null;
  categoria: {
    id: string;
    name: string;
  } | null;
  productos: Producto[];
  _count: {
    productos: number;
  };
}

export default function ComerciosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/comercios')
      .then(res => res.json())
      .then(data => {
        // Shuffle para mostrar en orden aleatorio
        const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
        setEmpresas(shuffled);
      })
      .catch(() => setEmpresas([]))
      .finally(() => setLoading(false));
  }, []);

  const searchLower = searchTerm.toLowerCase();
  
  // Filtrar empresas por nombre, zona, categoría o productos
  const filteredEmpresas = empresas.filter(e =>
    e.businessName.toLowerCase().includes(searchLower) ||
    e.zona?.toLowerCase().includes(searchLower) ||
    e.categoria?.name.toLowerCase().includes(searchLower) ||
    e.productos.some(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    )
  );

  // Obtener productos que coinciden con la búsqueda (con info del comercio)
  const productosQueCoinciden = searchTerm.length >= 2
    ? empresas.flatMap(e => 
        e.productos
          .filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower)
          )
          .map(p => ({ ...p, empresa: e }))
      ).slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Comercios</h1>
          </div>
          <p className="text-gray-500">Empresas de la zona con catálogos completos</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar comercio, zona o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          />
        </div>

        {/* Productos que coinciden con la búsqueda */}
        {productosQueCoinciden.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Productos y servicios</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {productosQueCoinciden.map((producto) => (
                <Link
                  key={producto.id}
                  href={`/producto/${createProductSlug(producto.empresa.businessName, producto.name, producto.id)}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {producto.imageUrl ? (
                      <Image
                        src={producto.imageUrl}
                        alt={producto.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-1">{producto.name}</h3>
                    {producto.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{producto.description}</p>
                    )}
                    <p className="text-blue-600 font-bold text-sm mt-1">
                      ${producto.price.toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {producto.empresa.businessName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredEmpresas.length === 0 && productosQueCoinciden.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron comercios' : 'Aún no hay comercios registrados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmpresas.map((empresa) => (
              <Link
                key={empresa.id}
                href={`/comercio/${empresa.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all group"
              >
                {/* Logo / Header */}
                <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative">
                  {empresa.logoUrl ? (
                    <Image
                      src={empresa.logoUrl}
                      alt={empresa.businessName}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <Store className="w-16 h-16 text-blue-300" />
                  )}
                  {/* Badge */}
                  <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Empresa
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                    {empresa.businessName}
                  </h3>
                  
                  {empresa.categoria && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mb-2">
                      {empresa.categoria.name}
                    </span>
                  )}

                  {empresa.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {empresa.description}
                    </p>
                  )}

                  <div className="space-y-1 text-sm text-gray-500">
                    {empresa.zona && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{empresa.zona}</span>
                      </div>
                    )}
                    {empresa.horarios && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{empresa.horarios}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {empresa._count.productos} productos
                    </span>
                    <span className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ver catálogo
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer variant="light" />
    </div>
  );
}
