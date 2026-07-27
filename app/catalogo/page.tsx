'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { 
  Search, Filter, ShoppingCart, MapPin, Clock, Star,
  Utensils, Package, Wrench, ShoppingBag, Cake, Coffee, 
  Leaf, Shirt, Scissors, Heart, Baby, Dog, 
  Car, Home, Hammer, Paintbrush, Camera, Music,
  BookOpen, Gift, Flower2, Wine, Pizza, IceCream,
  Sparkles, Dumbbell, Stethoscope
} from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { createProductSlug } from '@/lib/utils/slugify';

interface Producto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  emprendedor: {
    id: string;
    businessName: string;
    horarios: string;
    tipo?: 'VECINO' | 'EMPRESA';
    user: { fullName: string };
  };
  categoria: { id: string; name: string } | null;
}

interface Categoria {
  id: string;
  name: string;
  icon?: string;
}

interface Barrio {
  id: string;
  name: string;
}

export default function CatalogoPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { addItem, items } = useCart();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedBarrio, setSelectedBarrio] = useState<string>('');
  const [search, setSearch] = useState('');

  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    Promise.all([
      fetch('/api/categorias').then(res => res.json()),
      fetch('/api/barrios').then(res => res.json()),
    ]).then(([cats, bars]) => {
      setCategorias(cats ?? []);
      setBarrios(bars ?? []);
    }).catch(() => {
      setCategorias([]);
      setBarrios([]);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedBarrio) params.set('barrioId', selectedBarrio);
    if (selectedCategoria) params.set('categoriaId', selectedCategoria);
    if (search) {
      params.set('search', search);
      params.set('includeEmpresas', 'true'); // Incluir empresas en búsqueda
    }

    setLoading(true);
    fetch(`/api/productos?${params.toString()}`)
      .then(res => res.json())
      .then(data => setProductos(data ?? []))
      .catch(() => setProductos([]))
      .finally(() => setLoading(false));
  }, [selectedBarrio, selectedCategoria, search]);

  const handleAddToCart = (producto: Producto) => {
    const success = addItem({
      productoId: producto.id,
      name: producto.name,
      price: producto.price,
      quantity: 1,
      emprendedorId: producto.emprendedor?.id ?? '',
      emprendedorName: producto.emprendedor?.businessName ?? '',
      imageUrl: producto.imageUrl || '',
    });

    if (success) {
      toast.success('Agregado al carrito');
    } else {
      toast.error('Solo podés agregar productos del mismo emprendedor');
    }
  };

  const iconMap: Record<string, any> = {
    utensils: Utensils,
    pizza: Pizza,
    cake: Cake,
    coffee: Coffee,
    icecream: IceCream,
    wine: Wine,
    package: Package,
    shoppingbag: ShoppingBag,
    leaf: Leaf,
    flower: Flower2,
    gift: Gift,
    shirt: Shirt,
    scissors: Scissors,
    sparkles: Sparkles,
    heart: Heart,
    baby: Baby,
    dog: Dog,
    wrench: Wrench,
    hammer: Hammer,
    paintbrush: Paintbrush,
    home: Home,
    car: Car,
    camera: Camera,
    music: Music,
    bookopen: BookOpen,
    dumbbell: Dumbbell,
    stethoscope: Stethoscope,
  };

  const getCategoriaIcon = (iconName?: string) => {
    const IconComponent = iconMap[iconName ?? ''] || Package;
    return <IconComponent className="w-5 h-5" />;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (user?.role !== 'VECINO' && user?.role !== 'EMPRENDEDOR') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No tenés acceso a esta página</p>
          <button onClick={() => router.replace('/')} className="text-teal-600 hover:underline">Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Descubrí lo mejor de tu barrio</h1>
          <p className="text-gray-600">Productos y servicios de emprendedores locales</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos o servicios..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Barrio selector */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-teal-600" />
            <select
              value={selectedBarrio}
              onChange={(e) => setSelectedBarrio(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">Todos los barrios</option>
              {barrios?.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Category filters */}
          <div className="relative">
            {/* Máscara derecha con degradado */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none md:hidden" />
            
            <div 
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:flex-wrap"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setSelectedCategoria('')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                  !selectedCategoria
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {categorias?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoria(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                    selectedCategoria === cat.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getCategoriaIcon(cat.icon)}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
          </div>
        ) : productos?.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {productos?.map((producto, index) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link href={`/producto/${createProductSlug(producto.emprendedor?.businessName || '', producto.name, producto.id)}`}>
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {producto.imageUrl ? (
                      <Image
                        src={producto.imageUrl}
                        alt={producto.name ?? ''}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {producto.categoria && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 rounded-lg text-xs font-medium text-gray-700">
                        {producto.categoria.name}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-2 sm:p-4">
                  <Link href={`/producto/${createProductSlug(producto.emprendedor?.businessName || '', producto.name, producto.id)}`}>
                    <h3 className="font-semibold text-gray-800 mb-1 hover:text-teal-600 transition-colors text-sm sm:text-base line-clamp-2">
                      {producto.name}
                    </h3>
                  </Link>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-2">{producto.description}</p>
                  <p className="text-xs text-teal-600 font-medium mb-2 line-clamp-1">{producto.emprendedor?.businessName}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base sm:text-xl font-bold text-gray-800">
                      ${producto.price?.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => handleAddToCart(producto)}
                      className="p-1.5 sm:p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <Link
                    href={`/producto/${createProductSlug(producto.emprendedor?.businessName || '', producto.name, producto.id)}`}
                    className="block w-full py-1.5 text-center text-teal-600 border border-teal-600 rounded-lg text-xs sm:text-sm font-medium hover:bg-teal-50 transition-colors"
                  >
                    Ver más
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      
      <Footer variant="light" />
    </div>
  );
}
