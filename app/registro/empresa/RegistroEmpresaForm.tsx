'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Phone, Store, FileText, Clock, Eye, EyeOff, Loader2, CheckCircle, MapPin, Building2, CreditCard, BadgePercent, X, Upload } from 'lucide-react';
import { Footer } from '@/components/footer';
import toast from 'react-hot-toast';

interface Categoria {
  id: string;
  name: string;
}

const PLANES = [
  {
    id: 'FREE',
    name: 'Plan Gratuito',
    productos: 10,
    precio: 0,
    color: 'green',
    allowCsv: false,
    mpLink: '',
  },
];

export default function RegistroEmpresaForm() {
  const planesVisibles = PLANES;
  const planInicial = 'FREE';

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    // Datos personales
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Datos empresa
    razonSocial: '',
    businessName: '',
    description: '',
    categoriaId: '',
    horarios: '',
    direccionComercial: '',
    zona: '',
    // Plan
    plan: planInicial,
    // Medios de pago
    acceptsCash: true,
    bankAlias: '',
    bankCbu: '',
    mercadoPagoLink: '',
    // Archivos
    logoUrl: '',
    logoKey: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPublic', 'true');

      const uploadRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Error al subir archivo');
      const { cloud_storage_path, publicUrl } = await uploadRes.json();

      setForm(prev => ({ ...prev, logoUrl: publicUrl, logoKey: cloud_storage_path }));
      toast.success('Logo subido correctamente');
    } catch (error) {
      toast.error('Error al subir logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    fetch('/api/categorias')
      .then(res => res.json())
      .then(c => setCategorias(c ?? []))
      .catch(() => setCategorias([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const planData = PLANES.find(p => p.id === form.plan);
      
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userType: 'EMPRESA',
          tipo: 'EMPRESA',
          limiteProductos: planData?.productos || 50,
          monthlyFee: planData?.precio || 55000,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error ?? 'Error al registrar');
        return;
      }

      setSuccess(true);
    } catch (error) {
      toast.error('Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = PLANES.find(p => p.id === form.plan) || PLANES[1];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
        <nav className="p-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Image src="/logo-pedite-oficial.png" alt="Pedite" width={140} height={40} className="h-10 w-auto object-contain" />
          </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Registro exitoso</h1>
            <p className="text-gray-600 mb-4">Tu cuenta de empresa está pendiente de aprobación.</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-green-800 font-medium">Plan gratuito activado</p>
              <p className="text-sm text-green-700">Hasta {selectedPlan.productos} productos</p>
            </div>
            <Link href="/login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Ir a Login
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <nav className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image src="/logo-pedite-oficial.png" alt="Pedite" width={140} height={40} className="h-10 w-auto object-contain" unoptimized />
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Registro de Empresa</h1>
            </div>
            <p className="text-gray-500 text-center mb-2">Sumá tu comercio a la comunidad</p>

            {/* Banner de registro gratis */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 mb-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <BadgePercent className="w-5 h-5 text-white" />
                <p className="text-white font-semibold">GRATIS PARA EMPRESAS</p>
              </div>
            </div>

            {/* Progress steps */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    step >= s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  {/* Selección de plan */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Elegí tu plan *</label>
                    {planesVisibles.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setForm({ ...form, plan: plan.id })}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                          form.plan === plan.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{plan.name}</p>
                            <p className="text-sm text-gray-500">Hasta {plan.productos} productos</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">GRATIS</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Continuar
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del responsable *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!form.fullName || !form.email || !form.phone) {
                          toast.error('Completá todos los campos obligatorios');
                          return;
                        }
                        if (!form.password || form.password.length < 6) {
                          toast.error('La contraseña debe tener al menos 6 caracteres');
                          return;
                        }
                        if (form.password !== form.confirmPassword) {
                          toast.error('Las contraseñas no coinciden');
                          return;
                        }
                        setStep(3);
                      }}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre comercial *</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Nombre que verán los clientes"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón social (opcional)</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.razonSocial}
                        onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="S.A., S.R.L., etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px]"
                        placeholder="Contá de qué se trata tu comercio..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select
                        value={form.categoriaId}
                        onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="">Seleccionar</option>
                        {categorias?.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horarios</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={form.horarios}
                          onChange={(e) => setForm({ ...form, horarios: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Lun-Vie 9-18"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección comercial *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.direccionComercial}
                        onChange={(e) => setForm({ ...form, direccionComercial: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Av. Principal 1234"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zona *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.zona}
                        onChange={(e) => setForm({ ...form, zona: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Ej: Pilar Centro, Del Viso, etc."
                        required
                      />
                    </div>
                  </div>

                  {/* Logo upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo de tu empresa (opcional)</label>
                    {form.logoUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <img src={form.logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded" />
                        <span className="text-sm text-blue-700 flex-1">Logo cargado</span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, logoUrl: '', logoKey: '' })}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                        {uploadingLogo ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                          <Upload className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500">
                          {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={loading || uploadingLogo}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        'Completar registro'
                      )}
                    </button>
                  </div>
                </>
              )}

            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                ¿Ya tenés cuenta?{' '}
                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                  Ingresá
                </Link>
              </p>
              <p className="text-gray-500 text-sm mt-2">
                ¿Sos emprendedor del barrio?{' '}
                <Link href="/registro/emprendedor" className="text-teal-600 font-medium hover:underline">
                  Registrate acá
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
