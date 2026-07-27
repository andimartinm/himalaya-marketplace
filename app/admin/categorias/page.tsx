'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { 
  Tag, Plus, Edit2, Trash2, X, Loader2, Check, 
  Utensils, Package, Wrench, ShoppingBag, Cake, Coffee, 
  Leaf, Shirt, Scissors, Heart, Baby, Dog, 
  Car, Home, Hammer, Paintbrush, Camera, Music,
  BookOpen, Gift, Flower2, Wine, Pizza, IceCream,
  Sparkles, Dumbbell, Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Categoria {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

const iconOptions = [
  { value: 'utensils', label: 'Comidas', icon: Utensils },
  { value: 'pizza', label: 'Pizza/Fast Food', icon: Pizza },
  { value: 'cake', label: 'Pastelería', icon: Cake },
  { value: 'coffee', label: 'Café/Bebidas', icon: Coffee },
  { value: 'icecream', label: 'Helados/Postres', icon: IceCream },
  { value: 'wine', label: 'Bebidas/Vinos', icon: Wine },
  { value: 'package', label: 'Productos', icon: Package },
  { value: 'shoppingbag', label: 'Tienda', icon: ShoppingBag },
  { value: 'leaf', label: 'Natural/Orgánico', icon: Leaf },
  { value: 'flower', label: 'Flores/Plantas', icon: Flower2 },
  { value: 'gift', label: 'Regalos', icon: Gift },
  { value: 'shirt', label: 'Ropa/Indumentaria', icon: Shirt },
  { value: 'scissors', label: 'Costura/Manualidades', icon: Scissors },
  { value: 'sparkles', label: 'Belleza/Estética', icon: Sparkles },
  { value: 'heart', label: 'Bienestar', icon: Heart },
  { value: 'baby', label: 'Bebés/Niños', icon: Baby },
  { value: 'dog', label: 'Mascotas', icon: Dog },
  { value: 'wrench', label: 'Servicios', icon: Wrench },
  { value: 'hammer', label: 'Construcción', icon: Hammer },
  { value: 'paintbrush', label: 'Pintura/Arte', icon: Paintbrush },
  { value: 'home', label: 'Hogar', icon: Home },
  { value: 'car', label: 'Automotor', icon: Car },
  { value: 'camera', label: 'Fotografía', icon: Camera },
  { value: 'music', label: 'Música/Eventos', icon: Music },
  { value: 'bookopen', label: 'Educación', icon: BookOpen },
  { value: 'dumbbell', label: 'Fitness/Deportes', icon: Dumbbell },
  { value: 'stethoscope', label: 'Salud', icon: Stethoscope },
];

export default function AdminCategoriasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: 'package' });

  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [status, user, router]);

  const fetchCategorias = () => {
    fetch('/api/categorias')
      .then(res => res.json())
      .then(data => setCategorias(data ?? []))
      .catch(() => setCategorias([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchCategorias();
    }
  }, [user]);

  const openModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setForm({ name: categoria.name, description: categoria.description ?? '', icon: categoria.icon ?? 'package' });
    } else {
      setEditingCategoria(null);
      setForm({ name: '', description: '', icon: 'package' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const url = editingCategoria ? `/api/categorias/${editingCategoria.id}` : '/api/categorias';
      const method = editingCategoria ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast.success(editingCategoria ? 'Categoría actualizada' : 'Categoría creada');
      setShowModal(false);
      fetchCategorias();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;

    try {
      const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Categoría eliminada');
      fetchCategorias();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const getIcon = (iconName?: string) => {
    const opt = iconOptions.find(o => o.value === iconName);
    if (opt) {
      const Icon = opt.icon;
      return <Icon className="w-5 h-5" />;
    }
    return <Package className="w-5 h-5" />;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Categorías</h1>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar
          </button>
        </div>

        {categorias?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay categorías</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((categoria, index) => (
              <motion.div
                key={categoria.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
                    {getIcon(categoria.icon)}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(categoria)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(categoria.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800">{categoria.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{categoria.description}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      {editingCategoria ? 'Editar categoría' : 'Nueva categoría'}
                    </h2>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none min-h-[80px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
                      <p className="text-xs text-gray-400 mb-2">Deslizá para ver más opciones →</p>
                      <div className="relative">
                        {/* Máscara izquierda */}
                        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        {/* Máscara derecha */}
                        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                        
                        <div 
                          className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {iconOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setForm({ ...form, icon: opt.value })}
                              className={`flex-shrink-0 w-16 p-2 rounded-xl border transition-colors flex flex-col items-center gap-1 ${
                                form.icon === opt.value
                                  ? 'border-teal-600 bg-teal-50 text-teal-600'
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                              }`}
                            >
                              <opt.icon className="w-5 h-5" />
                              <span className="text-[10px] text-center leading-tight">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
