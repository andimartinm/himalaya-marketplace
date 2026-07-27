'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone, Store, FileText, Clock, Eye, EyeOff, Loader2, CheckCircle, Banknote, Link2, DollarSign, Copy, Upload, X, MapPin, Building2, CreditCard, BadgePercent } from 'lucide-react';
import { Footer } from '@/components/footer';
import toast from 'react-hot-toast';

interface Categoria {
  id: string;
  name: string;
}

interface PaymentSettings {
  payment_alias: string;
  payment_cbu: string;
  payment_titular: string;
}

const PLANES = [
  {
    id: 'EMPRENDEDOR_EXTERNO',
    name: 'Emprendedor Externo',
    productos: 5,
    precio: 15000,
    color: 'teal',
    allowCsv: false,
    mpLink: '',
  },
  {
    id: 'PROFESIONAL',
    name: 'Profesional',
    productos: 50,
    precio: 44000,
    color: 'blue',
    popular: true,
    allowCsv: true,
    mpLink: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=02e70473bfaf4b1ea6171ec25525e05c',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    productos: 100,
    precio: 68000,
    color: 'purple',
    allowCsv: true,
    mpLink: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=ce73e445efea4da5832f9a85ea531639',
  },
];

export default function RegistroEmpresaForm() {
  const searchParams = useSearchParams();
  // Soportar tanto showEmprendedor como showemprendedor (case-insensitive)
  const showEmprendedor = searchParams.get('showEmprendedor') === '1' || searchParams.get('showemprendedor') === '1' || searchParams.get('plan') === 'emprendedor';
  const planesVisibles = showEmprendedor ? PLANES : PLANES.filter((p) => p.id !== 'EMPRENDEDOR_EXTERNO');
  const planInicial = showEmprendedor ? 'EMPRENDEDOR_EXTERNO' : 'PROFESIONAL';

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    payment_alias: 'himalaya.pilar.mp',
    payment_cbu: '0000003100099999999991',
    payment_titular: 'Himalaya Agency SRL',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    // Plan (Emprendedor Externo si ?showEmprendedor=1 o ?plan=emprendedor)
    plan: planInicial,
    // Medios de pago
    acceptsCash: true,
    bankAlias: '',
    bankCbu: '',
    mercadoPagoLink: '',
    // Archivos
    logoUrl: '',
    logoKey: '',
    registrationProofUrl: '',
    registrationProofKey: '',
  });

  useEffect(() => {
    const planIds = planesVisibles.map((p) => p.id);
    if (form.plan && !planIds.includes(form.plan)) {
      setForm((prev) => ({ ...prev, plan: planIds[0] || 'PROFESIONAL' }));
    }
  }, [showEmprendedor]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'proof' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploading(true);

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

      if (type === 'logo') {
        setForm(prev => ({ ...prev, logoUrl: publicUrl, logoKey: cloud_storage_path }));
        toast.success('Logo subido correctamente');
      } else {
        setForm(prev => ({ ...prev, registrationProofUrl: publicUrl, registrationProofKey: cloud_storage_path }));
        toast.success('Comprobante subido correctamente');
      }
    } catch (error) {
      toast.error(`Error al subir ${type === 'logo' ? 'logo' : 'comprobante'}`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/categorias').then(res => res.json()),
      fetch('/api/admin/settings').then(res => res.json()),
    ]).then(([c, s]) => {
      setCategorias(c ?? []);
      if (s) setPaymentSettings(s);
    }).catch(() => {
      setCategorias([]);
    });
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
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 font-medium">Plan seleccionado: {selectedPlan.name}</p>
              <p className="text-sm text-blue-700">Hasta {selectedPlan.productos} productos</p>
              <p className="text-sm text-blue-700 mt-1">
                Precio: <strong>${selectedPlan.precio.toLocaleString('es-AR')}</strong>/mes
                {selectedPlan.mpLink && (
                  <span className="text-blue-500 ml-1">(14 días gratis)</span>
                )}
              </p>
            </div>
            {form.registrationProofUrl ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-green-800 font-medium">\u2705 Comprobante de pago adjuntado</p>
                <p className="text-sm text-green-700 mt-1">Te validaremos en las próximas 24hs hábiles.</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-yellow-800 font-medium mb-2">\ud83d\udccc Recordá realizar el pago:</p>
                <p className="text-sm text-yellow-700">
                  <strong>${selectedPlan.precio.toLocaleString('es-AR')}</strong> al alias: <strong>{paymentSettings.payment_alias}</strong>
                </p>
              </div>
            )}
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

            {/* Banner de prueba gratis - oculto para Emprendedor Externo */}
            {form.plan !== 'EMPRENDEDOR_EXTERNO' && (
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-3 mb-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <BadgePercent className="w-5 h-5 text-white" />
                  <p className="text-white font-semibold">14 días GRATIS en tu primer mes</p>
                </div>
              </div>
            )}

            {/* Progress steps */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4].map((s) => (
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
                        {plan.popular && (
                          <span className="absolute -top-2 right-3 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            Más elegido
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{plan.name}</p>
                            <p className="text-sm text-gray-500">Hasta {plan.productos} productos</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-800">${plan.precio.toLocaleString('es-AR')}</p>
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
                          onChange={(e) => handleFileUpload(e, 'logo')}
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
                      type="button"
                      onClick={() => {
                        if (!form.businessName) {
                          toast.error('El nombre comercial es obligatorio');
                          return;
                        }
                        if (!form.direccionComercial || !form.zona) {
                          toast.error('La dirección y zona son obligatorias');
                          return;
                        }
                        setStep(4);
                      }}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="text-center mb-4">
                    <DollarSign className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <h2 className="text-lg font-bold text-gray-800">Datos para el pago</h2>
                    <p className="text-sm text-gray-500">
                      Plan {selectedPlan.name}: <strong>${selectedPlan.precio.toLocaleString('es-AR')}</strong>/mes
                      {selectedPlan.mpLink && (
                        <span className="text-green-600 ml-1">(14 días gratis)</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Titular</p>
                      <p className="font-medium text-gray-800">{paymentSettings.payment_titular}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Alias</p>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono font-medium text-blue-600">{paymentSettings.payment_alias}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentSettings.payment_alias, 'Alias')}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">CBU</p>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono text-sm text-gray-700">{paymentSettings.payment_cbu}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentSettings.payment_cbu, 'CBU')}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Link de suscripción MercadoPago */}
                  {selectedPlan.mpLink && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-sm text-blue-800 font-medium mb-2">O suscribite directamente por Mercado Pago (incluye 14 días gratis):</p>
                      <a
                        href={selectedPlan.mpLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        Suscribirme por Mercado Pago
                      </a>
                    </div>
                  )}

                  {/* Medios de pago propios */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700">Tus medios de pago (para recibir de clientes)</label>

                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.acceptsCash}
                        onChange={(e) => setForm({ ...form, acceptsCash: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="mi.alias.mp"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Link de Mercado Pago</label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          value={form.mercadoPagoLink}
                          onChange={(e) => setForm({ ...form, mercadoPagoLink: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="https://link.mercadopago.com.ar/..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload proof */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Comprobante de pago (recomendado)
                    </label>
                    {form.registrationProofUrl ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-green-700 flex-1">Comprobante cargado</span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, registrationProofUrl: '', registrationProofKey: '' })}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                          <Upload className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500">
                          {uploading ? 'Subiendo...' : 'Subir comprobante de transferencia'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'proof')}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                    <p className="font-medium mb-1">\ud83d\udccc Importante</p>
                    <p>Realizá la transferencia y adjuntá el comprobante. Te validaremos en las próximas 24hs hábiles.</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={loading || uploading || uploadingLogo}
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
