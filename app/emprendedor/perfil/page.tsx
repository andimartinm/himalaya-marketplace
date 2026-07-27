'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Store, Clock, MapPin, Phone, Banknote, CreditCard, Link2, Truck, Loader2, Check, Lock, Eye, EyeOff, Building2, Upload, X, User, Mail, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Barrio {
  id: string;
  name: string;
}

interface Categoria {
  id: string;
  name: string;
}

export default function EmprendedorPerfilPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [emprendedorTipo, setEmprendedorTipo] = useState<'VECINO' | 'EMPRESA'>('VECINO');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    description: '',
    categoriaId: '',
    horarios: '',
    address: '',
    acceptsCash: true,
    bankAlias: '',
    bankCbu: '',
    mercadoPagoLink: '',
    deliveryMethods: ['ENTREGA_PROPIA'] as string[],
    barrioIds: [] as string[],
    logoUrl: '',
    logoKey: '',
    bannerUrl: '',
    bannerKey: '',
    direccionComercial: '',
    zona: '',
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'EMPRENDEDOR') {
      router.replace('/');
    }
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === 'EMPRENDEDOR') {
      Promise.all([
        fetch('/api/emprendedor/profile').then(res => res.json()),
        fetch('/api/barrios').then(res => res.json()),
        fetch('/api/categorias').then(res => res.json()),
      ]).then(([profile, bars, cats]) => {
        if (profile) {
          setEmprendedorTipo(profile.tipo || 'VECINO');
          setForm({
            fullName: profile.user?.fullName ?? '',
            email: profile.user?.email ?? '',
            phone: profile.user?.phone ?? '',
            businessName: profile.businessName ?? '',
            description: profile.description ?? '',
            categoriaId: profile.categoriaId ?? '',
            horarios: profile.horarios ?? '',
            address: profile.address ?? '',
            acceptsCash: profile.acceptsCash ?? true,
            bankAlias: profile.bankAlias ?? '',
            bankCbu: profile.bankCbu ?? '',
            mercadoPagoLink: profile.mercadoPagoLink ?? '',
            deliveryMethods: profile.deliveryMethods?.length ? profile.deliveryMethods : (profile.deliveryMethod ? [profile.deliveryMethod] : ['ENTREGA_PROPIA']),
            barrioIds: profile.barrios?.map((b: any) => b.barrioId) ?? [],
            logoUrl: profile.logoUrl ?? '',
            logoKey: profile.logoKey ?? '',
            bannerUrl: profile.bannerUrl ?? '',
            bannerKey: profile.bannerKey ?? '',
            direccionComercial: profile.direccionComercial ?? '',
            zona: profile.zona ?? '',
          });
        }
        setBarrios(bars ?? []);
        setCategorias(cats ?? []);
      }).catch(() => {
        setBarrios([]);
        setCategorias([]);
      }).finally(() => setLoading(false));
    }
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 5MB');
      return;
    }

    setUploadingLogo(true);
    
    try {
      // Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: true,
        }),
      });

      if (!presignedRes.ok) throw new Error('Error al obtener URL de carga');

      const { uploadUrl, cloud_storage_path, publicUrl } = await presignedRes.json();

      // Check if content-disposition is in signed headers
      const urlParams = new URLSearchParams(uploadUrl.split('?')[1]);
      const signedHeaders = urlParams.get('X-Amz-SignedHeaders') || '';
      const headers: Record<string, string> = { 'Content-Type': file.type };
      if (signedHeaders.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Error al subir archivo');

      setForm(prev => ({ ...prev, logoUrl: publicUrl, logoKey: cloud_storage_path }));
      toast.success('Logo subido correctamente');
    } catch (error) {
      toast.error('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setForm(prev => ({ ...prev, logoUrl: '', logoKey: '' }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 5MB');
      return;
    }
    setUploadingBanner(true);
    try {
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
      });
      if (!presignedRes.ok) throw new Error('Error al obtener URL');
      const { uploadUrl, cloud_storage_path, publicUrl } = await presignedRes.json();
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type, 'Content-Disposition': 'attachment' },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Error al subir');
      setForm(prev => ({ ...prev, bannerUrl: publicUrl, bannerKey: cloud_storage_path }));
      toast.success('Banner subido correctamente');
    } catch {
      toast.error('Error al subir el banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemoveBanner = () => {
    setForm(prev => ({ ...prev, bannerUrl: '', bannerKey: '' }));
  };

  const handleBarrioToggle = (barrioId: string) => {
    setForm(prev => ({
      ...prev,
      barrioIds: prev.barrioIds.includes(barrioId)
        ? prev.barrioIds.filter(id => id !== barrioId)
        : [...prev.barrioIds, barrioId],
    }));
  };

  const handleSave = async () => {
    if (!form.deliveryMethods || form.deliveryMethods.length === 0) {
      toast.error('Seleccioná al menos un método de entrega');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/emprendedor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        toast.success('Contraseña actualizada correctamente');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordSection(false);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Error al cambiar contraseña');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setSavingPassword(false);
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
      
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Logo section - only for empresas */}
          {emprendedorTipo === 'EMPRESA' && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Logo de la empresa
              </h2>
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                  {form.logoUrl ? (
                    <>
                      <Image
                        src={form.logoUrl}
                        alt="Logo"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {form.logoUrl ? 'Cambiar logo' : 'Subir logo'}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG hasta 5MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Banner de la página del comercio - solo para empresas */}
          {emprendedorTipo === 'EMPRESA' && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Banner de la página del comercio
              </h2>
              <p className="text-sm text-gray-500 mb-3">Imagen de fondo del encabezado cuando los clientes entren a tu comercio. Si no subís ninguna, se usará el diseño por defecto.</p>
              <div className="flex items-start gap-4">
                <div className="relative w-full max-w-xs aspect-[3/1] bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                  {form.bannerUrl ? (
                    <>
                      <Image
                        src={form.bannerUrl}
                        alt="Banner"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveBanner}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    {uploadingBanner ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {form.bannerUrl ? 'Cambiar banner' : 'Subir banner'}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      disabled={uploadingBanner}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Recomendado: imagen horizontal. PNG, JPG hasta 5MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Datos personales */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Datos personales
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">El email no puede ser modificado</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono personal</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business info */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-teal-600" />
              Información del negocio
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none min-h-[100px]"
                />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horarios</label>
                  <input
                    type="text"
                    value={form.horarios}
                    onChange={(e) => setForm({ ...form, horarios: e.target.value })}
                    placeholder="Lun-Vie 9-18"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Barrios */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              Barrios donde operás
            </h2>
            <div className="flex flex-wrap gap-2">
              {barrios?.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleBarrioToggle(b.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.barrioIds.includes(b.id)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-600" />
              Métodos de entrega
            </h2>
            <p className="text-sm text-gray-500 mb-3">Seleccioná al menos uno</p>
            <div className="space-y-2">
              {[
                { value: 'ENTREGA_PROPIA', label: 'A domicilio', desc: 'Entrego el pedido en la dirección del cliente' },
                { value: 'RETIRO_DOMICILIO', label: 'En el domicilio/local del emprendedor', desc: 'El cliente retira en mi domicilio o local' },
                { value: 'PUNTO_ENCUENTRO', label: 'A coordinar', desc: 'Coordino punto de entrega con el cliente' },
              ].map((method) => (
                <label key={method.value} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.deliveryMethods.includes(method.value)}
                    onChange={(e) => {
                      const newMethods = e.target.checked
                        ? [...form.deliveryMethods, method.value]
                        : form.deliveryMethods.filter((m) => m !== method.value);
                      setForm({ ...form, deliveryMethods: newMethods });
                    }}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 mt-0.5"
                  />
                  <div>
                    <span className="font-medium text-gray-800">{method.label}</span>
                    <p className="text-sm text-gray-500">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment methods */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              Medios de pago
            </h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.acceptsCash}
                  onChange={(e) => setForm({ ...form, acceptsCash: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <Banknote className="w-5 h-5 text-gray-500" />
                <span>Acepto efectivo</span>
              </label>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Alias de transferencia</label>
                <input
                  type="text"
                  value={form.bankAlias}
                  onChange={(e) => setForm({ ...form, bankAlias: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">CBU</label>
                <input
                  type="text"
                  value={form.bankCbu}
                  onChange={(e) => setForm({ ...form, bankCbu: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Link de Mercado Pago</label>
                <input
                  type="url"
                  value={form.mercadoPagoLink}
                  onChange={(e) => setForm({ ...form, mercadoPagoLink: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
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
                Guardar cambios
              </>
            )}
          </button>

          {/* Cambiar contraseña */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
            >
              <Lock className="w-4 h-4" />
              {showPasswordSection ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
            </button>

            {showPasswordSection && (
              <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      placeholder="Tu contraseña actual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                    placeholder="Repetí la nueva contraseña"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Actualizar contraseña
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      
      <Footer variant="light" />
    </div>
  );
}