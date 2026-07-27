'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Plus, Edit2, Trash2, Package, Loader2, X, Upload, Check, FileSpreadsheet, Building2, Store, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Producto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageUrl2?: string;
  imageUrl3?: string;
  available: boolean;
  categoriaId: string;
  categoria: { name: string } | null;
}

interface Categoria {
  id: string;
  name: string;
}

interface EmprendedorInfo {
  businessName: string;
  tipo: 'VECINO' | 'EMPRESA';
  plan: string | null;
  limiteProductos: number | null;
}

const PLAN_LABELS: Record<string, string> = {
  EMPRENDEDOR_EXTERNO: 'Emprendedor Externo',
  PROFESIONAL: 'Profesional',
  PREMIUM: 'Premium',
};

export default function EmprendedorProductosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [emprendedorInfo, setEmprendedorInfo] = useState<EmprendedorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    categoriaId: '',
    imageUrl: '',
    imageKey: '',
    imageUrl2: '',
    imageKey2: '',
    imageUrl3: '',
    imageKey3: '',
  });
  const [imagePreviews, setImagePreviews] = useState<{ [key: number]: string }>({});
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'EMPRENDEDOR') {
      router.replace('/');
    }
  }, [status, user, router]);

  const fetchData = async () => {
    try {
      const [prodsRes, catsRes, profileRes] = await Promise.all([
        fetch(`/api/productos?emprendedorId=${user?.emprendedorId}`),
        fetch('/api/categorias'),
        fetch('/api/emprendedor/profile'),
      ]);
      const [prods, cats, profile] = await Promise.all([prodsRes.json(), catsRes.json(), profileRes.json()]);
      setProductos(prods ?? []);
      setCategorias(cats ?? []);
      if (profile && !profile.error) {
        setEmprendedorInfo({
          businessName: profile.businessName,
          tipo: profile.tipo || 'VECINO',
          plan: profile.plan,
          limiteProductos: profile.limiteProductos,
        });
      }
    } catch {
      setProductos([]);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.emprendedorId) {
      fetchData();
    }
  }, [user?.emprendedorId]);

  const compressImage = async (file: File, maxWidth = 800, quality = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error al comprimir imagen'));
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (file: File, slot: number = 1) => {
    // Mostrar preview local inmediatamente
    const localPreview = URL.createObjectURL(file);
    setImagePreviews(prev => ({ ...prev, [slot]: localPreview }));
    setUploadingSlot(slot);
    
    try {
      let fileToUpload: File;

      try {
        const compressedBlob = await compressImage(file);
        fileToUpload = new File([compressedBlob], `${Date.now()}-${slot}-${file.name.replace(/\.[^/.]+$/, '.jpg')}`, {
          type: 'image/jpeg',
        });
      } catch (compressionError) {
        console.log('Compression failed, uploading original file:', compressionError);
        fileToUpload = file;
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('isPublic', 'true');

      const uploadRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Error al subir archivo');
      const { cloud_storage_path, publicUrl } = await uploadRes.json();

      // Update form based on slot
      if (slot === 1) {
        setForm(prev => ({ ...prev, imageUrl: publicUrl, imageKey: cloud_storage_path }));
      } else if (slot === 2) {
        setForm(prev => ({ ...prev, imageUrl2: publicUrl, imageKey2: cloud_storage_path }));
      } else if (slot === 3) {
        setForm(prev => ({ ...prev, imageUrl3: publicUrl, imageKey3: cloud_storage_path }));
      }
      toast.success(`Imagen ${slot} subida`);
    } catch (error) {
      console.error('Error uploading image:', error);
      setImagePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[slot];
        return newPreviews;
      });
      toast.error('Error al subir imagen');
    } finally {
      setUploadingSlot(null);
    }
  };

  const clearImage = (slot: number) => {
    setImagePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[slot];
      return newPreviews;
    });
    if (slot === 1) {
      setForm(prev => ({ ...prev, imageUrl: '', imageKey: '' }));
    } else if (slot === 2) {
      setForm(prev => ({ ...prev, imageUrl2: '', imageKey2: '' }));
    } else if (slot === 3) {
      setForm(prev => ({ ...prev, imageUrl3: '', imageKey3: '' }));
    }
  };

  const swapImages = (fromSlot: number, toSlot: number) => {
    if (fromSlot === toSlot) return;
    
    // Swap previews
    setImagePreviews(prev => {
      const newPreviews = { ...prev };
      const temp = newPreviews[fromSlot];
      newPreviews[fromSlot] = newPreviews[toSlot];
      newPreviews[toSlot] = temp;
      // Clean up undefined entries
      if (!newPreviews[fromSlot]) delete newPreviews[fromSlot];
      if (!newPreviews[toSlot]) delete newPreviews[toSlot];
      return newPreviews;
    });

    // Swap form values
    setForm(prev => {
      const getUrlKey = (slot: number) => {
        if (slot === 1) return { url: prev.imageUrl, key: prev.imageKey };
        if (slot === 2) return { url: prev.imageUrl2, key: prev.imageKey2 };
        return { url: prev.imageUrl3, key: prev.imageKey3 };
      };

      const fromData = getUrlKey(fromSlot);
      const toData = getUrlKey(toSlot);

      const newForm = { ...prev };
      
      // Set "from" slot with "to" data
      if (fromSlot === 1) {
        newForm.imageUrl = toData.url;
        newForm.imageKey = toData.key;
      } else if (fromSlot === 2) {
        newForm.imageUrl2 = toData.url;
        newForm.imageKey2 = toData.key;
      } else {
        newForm.imageUrl3 = toData.url;
        newForm.imageKey3 = toData.key;
      }

      // Set "to" slot with "from" data
      if (toSlot === 1) {
        newForm.imageUrl = fromData.url;
        newForm.imageKey = fromData.key;
      } else if (toSlot === 2) {
        newForm.imageUrl2 = fromData.url;
        newForm.imageKey2 = fromData.key;
      } else {
        newForm.imageUrl3 = fromData.url;
        newForm.imageKey3 = fromData.key;
      }

      return newForm;
    });
  };

  const handleDragStart = (slot: number) => {
    setDraggedSlot(slot);
  };

  const handleDragOver = (e: React.DragEvent, slot: number) => {
    e.preventDefault();
    if (draggedSlot !== null && draggedSlot !== slot) {
      setDragOverSlot(slot);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (slot: number) => {
    if (draggedSlot !== null && draggedSlot !== slot) {
      swapImages(draggedSlot, slot);
    }
    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  const handleDragEnd = () => {
    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  const openModal = (producto?: Producto) => {
    if (producto) {
      setEditingProduct(producto);
      const p = producto as any;
      setForm({
        name: producto.name,
        description: producto.description ?? '',
        price: producto.price?.toString() ?? '',
        categoriaId: producto.categoriaId ?? '',
        imageUrl: producto.imageUrl ?? '',
        imageKey: p.imageKey ?? '',
        imageUrl2: p.imageUrl2 ?? '',
        imageKey2: p.imageKey2 ?? '',
        imageUrl3: p.imageUrl3 ?? '',
        imageKey3: p.imageKey3 ?? '',
      });
      // Load previews from existing images
      const previews: { [key: number]: string } = {};
      if (producto.imageUrl) previews[1] = producto.imageUrl;
      if (p.imageUrl2) previews[2] = p.imageUrl2;
      if (p.imageUrl3) previews[3] = p.imageUrl3;
      setImagePreviews(previews);
    } else {
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', categoriaId: '', imageUrl: '', imageKey: '', imageUrl2: '', imageKey2: '', imageUrl3: '', imageKey3: '' });
      setImagePreviews({});
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Nombre y precio son requeridos');
      return;
    }

    setSaving(true);
    try {
      const url = editingProduct ? `/api/productos/${editingProduct.id}` : '/api/productos';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          isPublicImage: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? 'Error');
      }

      toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
      const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Producto eliminado');
      fetchData();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // Función para parsear CSV correctamente (maneja comillas y detecta delimitador)
  const parseCSVLine = (line: string, delimiter: string = ','): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Detectar delimitador (coma o punto y coma)
  const detectDelimiter = (headerLine: string): string => {
    const semicolonCount = (headerLine.match(/;/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    
    try {
      let text = await file.text();
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('El archivo CSV está vacío o no tiene datos');
        setImportingCsv(false);
        return;
      }

      // Detectar delimitador y parsear header
      const delimiter = detectDelimiter(lines[0]);
      const headerCols = parseCSVLine(lines[0], delimiter);
      const header = headerCols.map(h => h.toLowerCase().replace(/^"|"$/g, '').trim());
      
      const nombreIdx = header.findIndex(h => h === 'nombre');
      const descripcionIdx = header.findIndex(h => h === 'descripcion' || h === 'descripción');
      const precioIdx = header.findIndex(h => h === 'precio');
      const categoriaIdx = header.findIndex(h => h === 'categoria' || h === 'categoría');

      if (nombreIdx === -1 || precioIdx === -1) {
        toast.error(`El CSV debe tener columnas "nombre" y "precio". Columnas encontradas: ${header.join(', ')}`);
        setImportingCsv(false);
        return;
      }

      // Calcular límite disponible
      const disponibles = emprendedorInfo?.limiteProductos 
        ? emprendedorInfo.limiteProductos - productos.length 
        : Infinity;

      const dataLines = lines.slice(1);
      const productosToAdd = Math.min(dataLines.length, disponibles);
      
      let added = 0;
      let errors = 0;

      for (let i = 0; i < productosToAdd; i++) {
        const cols = parseCSVLine(dataLines[i], delimiter);
        
        const nombre = cols[nombreIdx];
        const descripcion = descripcionIdx !== -1 ? cols[descripcionIdx] : '';
        const precio = parseFloat(cols[precioIdx]?.replace(/[^0-9.]/g, '') || '0');
        const categoriaName = categoriaIdx !== -1 ? cols[categoriaIdx] : '';

        if (!nombre || !precio) {
          errors++;
          continue;
        }

        // Buscar categoría
        const categoria = categorias.find(c => 
          c.name.toLowerCase() === categoriaName?.toLowerCase()
        );

        try {
          const res = await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nombre,
              description: descripcion,
              price: precio,
              categoriaId: categoria?.id || '',
              imageUrl: '',
              imageKey: '',
              isPublicImage: true,
            }),
          });

          if (res.ok) {
            added++;
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
      }

      if (added > 0) {
        toast.success(`${added} productos importados correctamente`);
      }
      if (errors > 0) {
        toast.error(`${errors} productos no pudieron ser importados`);
      }
      if (dataLines.length > productosToAdd) {
        toast.error(`${dataLines.length - productosToAdd} productos omitidos por límite del plan`);
      }

      setShowCsvModal(false);
      fetchData();
    } catch (error) {
      toast.error('Error al procesar el archivo CSV');
    } finally {
      setImportingCsv(false);
      // Reset file input
      e.target.value = '';
    }
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
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header con info de empresa */}
        {emprendedorInfo?.tipo === 'EMPRESA' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">{emprendedorInfo.businessName}</h2>
                <p className="text-sm text-gray-500">
                  Plan {emprendedorInfo.plan ? (PLAN_LABELS[emprendedorInfo.plan] ?? emprendedorInfo.plan) : 'Básico'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`px-3 py-1 rounded-full font-medium ${
                emprendedorInfo.limiteProductos && productos.length >= emprendedorInfo.limiteProductos
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {productos.length} / {emprendedorInfo.limiteProductos || '∞'} productos
              </span>
              {emprendedorInfo.limiteProductos && productos.length >= emprendedorInfo.limiteProductos && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  Límite alcanzado
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mis Productos</h1>
          <div className="flex gap-2">
            {emprendedorInfo?.tipo === 'EMPRESA' && emprendedorInfo?.plan !== 'EMPRENDEDOR_EXTERNO' && (
              <button
                onClick={() => setShowCsvModal(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Importar CSV
              </button>
            )}
            <button
              onClick={() => openModal()}
              disabled={emprendedorInfo?.tipo === 'EMPRESA' && emprendedorInfo.limiteProductos !== null && productos.length >= emprendedorInfo.limiteProductos}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          </div>
        </div>

        {productos?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aún no tenés productos</p>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Crear mi primer producto
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((producto, index) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="relative aspect-video bg-gray-100">
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
                  {!producto.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">No disponible</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{producto.name}</h3>
                      {producto.categoria && (
                        <span className="text-xs text-gray-500">{producto.categoria.name}</span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-teal-600">
                      ${producto.price?.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{producto.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(producto)}
                      className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
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
                className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      {editingProduct ? 'Editar producto' : 'Nuevo producto'}
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={form.price ? Number(form.price).toLocaleString('es-AR') : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              setForm({ ...form, price: raw });
                            }}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select
                          value={form.categoriaId}
                          onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
                        >
                          <option value="">Seleccionar</option>
                          {categorias?.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Imágenes (hasta 3) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes (hasta 3)</label>
                      <p className="text-xs text-gray-500 mb-3">Subí hasta 3 imágenes. Arrastrá para cambiar el orden.</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((slot) => {
                          const preview = imagePreviews[slot];
                          const isUploading = uploadingSlot === slot;
                          const isDragging = draggedSlot === slot;
                          const isDragOver = dragOverSlot === slot;
                          return (
                            <div 
                              key={slot} 
                              className={`relative transition-transform ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver ? 'scale-105' : ''}`}
                              onDragOver={(e) => preview && handleDragOver(e, slot)}
                              onDragLeave={handleDragLeave}
                              onDrop={() => handleDrop(slot)}
                            >
                              {preview ? (
                                <div 
                                  className={`relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing ${isDragOver ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}
                                  draggable
                                  onDragStart={() => handleDragStart(slot)}
                                  onDragEnd={handleDragEnd}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={preview} alt={`Imagen ${slot}`} className="w-full h-full object-cover pointer-events-none" />
                                  {isUploading && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => clearImage(slot)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                    {slot}
                                  </span>
                                </div>
                              ) : (
                                <label 
                                  className={`block aspect-square bg-gray-50 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isDragOver ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}
                                  onDragOver={(e) => handleDragOver(e, slot)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={() => handleDrop(slot)}
                                >
                                  <div className="h-full flex flex-col items-center justify-center p-2">
                                    {isUploading ? (
                                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                    ) : (
                                      <>
                                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500 text-center">Imagen {slot}</span>
                                      </>
                                    )}
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], slot)}
                                    className="hidden"
                                    disabled={uploadingSlot !== null}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
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

        {/* Modal importar CSV */}
        <AnimatePresence>
          {showCsvModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCsvModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Importar productos desde CSV</h2>
                    <button onClick={() => setShowCsvModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-medium text-blue-800 mb-2">Formato del archivo CSV</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        El archivo debe tener las siguientes columnas:
                      </p>
                      <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto">
                        nombre,descripcion,precio,categoria
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        * La categoría debe coincidir exactamente con una categoría existente
                      </p>
                    </div>

                    {emprendedorInfo?.limiteProductos && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Límite de productos:</strong> {emprendedorInfo.limiteProductos - productos.length} productos disponibles para agregar
                        </p>
                      </div>
                    )}

                    <label className="block w-full p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors text-center">
                      {importingCsv ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-2" />
                          <span className="text-sm text-gray-600">Importando productos...</span>
                        </div>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-600 block">Seleccionar archivo CSV</span>
                          <span className="text-xs text-gray-400 mt-1 block">.csv</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvImport}
                        className="hidden"
                        disabled={importingCsv}
                      />
                    </label>

                    <a
                      href="/plantilla-productos.csv"
                      download
                      className="block text-center text-sm text-teal-600 hover:text-teal-700 underline"
                    >
                      Descargar plantilla de ejemplo
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <Footer variant="light" />
    </div>
  );
}
