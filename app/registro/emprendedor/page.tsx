'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Phone, CreditCard, Store, FileText, Clock, MapPin, Truck, Eye, EyeOff, Loader2, CheckCircle, Banknote, Link2, Home, DollarSign, Copy, Upload, X, UserCheck } from 'lucide-react';
import { Footer } from '@/components/footer';
import toast from 'react-hot-toast';

interface Barrio {
  id: string;
  name: string;
}

interface Categoria {
  id: string;
  name: string;
}

interface PaymentSettings {
  payment_alias: string;
  payment_cbu: string;
  payment_titular: string;
  monthly_fee: string;
  mercadopago_link: string;
}

export default function RegistroEmprendedorPage() {
  const { data: session, status } = useSession() || {};
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    payment_alias: 'himalaya.pilar.mp',
    payment_cbu: '0000003100099999999991',
    payment_titular: 'Himalaya Agency SRL',
    monthly_fee: '15000',
    mercadopago_link: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dni: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    description: '',
    categoriaId: '',
    horarios: '',
    acceptsCash: true,
    bankAlias: '',
    bankCbu: '',
    mercadoPagoLink: '',
    deliveryMethods: ['ENTREGA_PROPIA'] as string[],
    address: '',
    residenceBarrioId: '',
    loteNumber: '',
    barrioIds: [] as string[],
    registrationProofUrl: '',
    registrationProofKey: '',
  });

  // Load existing user data if logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      // Fetch full user profile
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(profile => {
          if (profile && !profile.error) {
            setIsExistingUser(true);
            setForm(prev => ({
              ...prev,
              fullName: profile.fullName || user.name || '',
              email: profile.email || user.email || '',
              phone: profile.phone || '',
              residenceBarrioId: profile.barrioId || '',
              loteNumber: profile.lotNumber || '',
            }));
            toast.success('Datos cargados de tu cuenta existente');
          }
        })
        .catch(() => {
          // If fetch fails, still try to use session data
          setForm(prev => ({
            ...prev,
            fullName: user.name || '',
            email: user.email || '',
          }));
        });
    }
  }, [status, session]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: true,
        }),
      });

      if (!res.ok) throw new Error('Error al obtener URL');

      const { uploadUrl, cloud_storage_path, publicUrl } = await res.json();

      // Check if content-disposition is in signed headers
      const urlParams = new URLSearchParams(uploadUrl.split('?')[1]);
      const signedHeaders = urlParams.get('X-Amz-SignedHeaders') || '';
      const headers: Record<string, string> = { 'Content-Type': file.type };
      if (signedHeaders.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Error al subir archivo');
      
      setForm(prev => ({ 
        ...prev, 
        registrationProofUrl: publicUrl, 
        registrationProofKey: cloud_storage_path 
      }));
      toast.success('Comprobante subido correctamente');
    } catch (error) {
      toast.error('Error al subir comprobante');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/barrios').then(res => res.json()),
      fetch('/api/categorias').then(res => res.json()),
      fetch('/api/admin/settings').then(res => res.json()),
    ]).then(([b, c, s]) => {
      setBarrios(b ?? []);
      setCategorias(c ?? []);
      if (s) setPaymentSettings(s);
    }).catch(() => {
      setBarrios([]);
      setCategorias([]);
    });
  }, []);

  const handleBarrioToggle = (barrioId: string) => {
    setForm(prev => ({
      ...prev,
      barrioIds: prev.barrioIds.includes(barrioId)
        ? prev.barrioIds.filter(id => id !== barrioId)
        : [...prev.barrioIds, barrioId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isExistingUser && form.password !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (form.barrioIds.length === 0) {
      toast.error('Seleccioná al menos un barrio');
      return;
    }

    if (form.deliveryMethods.length === 0) {
      toast.error('Seleccioná al menos un método de entrega');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deliveryMethod: form.deliveryMethods[0] || 'ENTREGA_PROPIA',
          userType: 'EMPRENDEDOR',
          isExistingUser,
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

  const monthlyFee = parseInt(paymentSettings.monthly_fee) || 15000;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex flex-col">
        <nav className="p-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Image 
              src="/logo-pedite-oficial.png" 
              alt="Pedite" 
              width={140} 
              height={40} 
              className="h-10 w-auto object-contain"
            />
          </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Registro exitoso</h1>
            <p className="text-gray-600 mb-4">
              Tu cuenta de emprendedor está pendiente de aprobación.
            </p>
            {form.registrationProofUrl ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-green-800 font-medium">✅ Comprobante de pago adjuntado</p>
                <p className="text-sm text-green-700 mt-1">Te validaremos en las próximas 24hs hábiles.</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-yellow-800 font-medium mb-2">📌 Recordá realizar el pago de tu primera cuota:</p>
                <p className="text-sm text-yellow-700">
                  <strong>${monthlyFee.toLocaleString('es-AR')}/mes</strong> al alias: <strong>{paymentSettings.payment_alias}</strong>
                </p>
              </div>
            )}
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Ir a Login
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex flex-col">
      <nav className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image 
            src="/logo-pedite-oficial.png" 
            alt="Pedite" 
            width={140} 
            height={40} 
            className="h-10 w-auto object-contain"
            unoptimized
          />
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Registro de Emprendedor</h1>
            <p className="text-gray-500 text-center mb-2">Sumá tu negocio a Pilar del Este</p>
            
            {/* Monthly fee banner */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-6 text-center">
              <p className="text-sm text-teal-700">
                <DollarSign className="w-4 h-4 inline -mt-1" />
                Cuota mensual: <strong>${monthlyFee.toLocaleString('es-AR')}</strong>
              </p>
            </div>

            {/* Progress steps */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    step >= s ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  {isExistingUser && (
                    <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-200 mb-4">
                      <UserCheck className="w-6 h-6 text-teal-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-teal-800">¡Ya tenés cuenta!</p>
                        <p className="text-sm text-teal-600">Cargamos tus datos automáticamente. Solo completá la info de tu emprendimiento.</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del titular *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none ${isExistingUser ? 'border-teal-200 bg-teal-50/50' : 'border-gray-200'}`}
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
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none ${isExistingUser ? 'border-teal-200 bg-teal-50/50' : 'border-gray-200'}`}
                        required
                        readOnly={isExistingUser}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none ${isExistingUser && form.phone ? 'border-teal-200 bg-teal-50/50' : 'border-gray-200'}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={form.dni}
                          onChange={(e) => setForm({ ...form, dni: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {!isExistingUser && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            required={!isExistingUser}
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
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            required={!isExistingUser}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!form.fullName || !form.email) {
                        toast.error('Completá los campos obligatorios');
                        return;
                      }
                      if (!isExistingUser && (!form.password || !form.confirmPassword)) {
                        toast.error('Completá los campos de contraseña');
                        return;
                      }
                      if (!isExistingUser && form.password !== form.confirmPassword) {
                        toast.error('Las contraseñas no coinciden');
                        return;
                      }
                      setStep(2);
                    }}
                    className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                  >
                    Siguiente
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        required
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
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none min-h-[100px]"
                        placeholder="Contá de qué se trata tu negocio..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horarios</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={form.horarios}
                          onChange={(e) => setForm({ ...form, horarios: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                          placeholder="Lun-Vie 9-18"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Residence info - separated */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Tu ubicación (residencia)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barrio donde vivís *</label>
                        <select
                          value={form.residenceBarrioId}
                          onChange={(e) => setForm({ ...form, residenceBarrioId: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
                        >
                          <option value="">Seleccionar</option>
                          {barrios?.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de lote *</label>
                        <input
                          type="text"
                          value={form.loteNumber}
                          onChange={(e) => setForm({ ...form, loteNumber: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                          placeholder="Ej: 123"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Barrios donde operás (entregas) *</label>
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
                        if (!form.businessName) {
                          toast.error('El nombre del negocio es obligatorio');
                          return;
                        }
                        if (!form.residenceBarrioId) {
                          toast.error('Seleccioná tu barrio de residencia');
                          return;
                        }
                        if (!form.loteNumber) {
                          toast.error('Ingresá tu número de lote');
                          return;
                        }
                        if (form.barrioIds.length === 0) {
                          toast.error('Seleccioná al menos un barrio donde operás');
                          return;
                        }
                        setStep(3);
                      }}
                      className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Métodos de entrega (podés elegir varios)</label>
                    <div className="space-y-2">
                      {[
                        { value: 'ENTREGA_PROPIA', label: 'A domicilio', desc: 'Llevás el pedido al cliente' },
                        { value: 'RETIRO_DOMICILIO', label: 'En el domicilio/local del emprendedor', desc: 'El cliente retira en tu casa/local' },
                        { value: 'PUNTO_ENCUENTRO', label: 'A coordinar', desc: 'Acordás un lugar de entrega' },
                      ].map((method) => (
                        <label 
                          key={method.value}
                          className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                            form.deliveryMethods.includes(method.value) 
                              ? 'bg-teal-50 border-teal-200' 
                              : 'bg-gray-50 border-transparent hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.deliveryMethods.includes(method.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, deliveryMethods: [...form.deliveryMethods, method.value] });
                              } else {
                                setForm({ ...form, deliveryMethods: form.deliveryMethods.filter(m => m !== method.value) });
                              }
                            }}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-800">{method.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Tus medios de pago (para recibir pagos)</label>
                    
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
                        placeholder="mi.alias.mp"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">CBU</label>
                      <input
                        type="text"
                        value={form.bankCbu}
                        onChange={(e) => setForm({ ...form, bankCbu: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                        placeholder="0000003100..."
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
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                          placeholder="https://link.mercadopago.com.ar/..."
                        />
                      </div>
                    </div>
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
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="text-center mb-4">
                    <DollarSign className="w-12 h-12 text-teal-600 mx-auto mb-2" />
                    <h2 className="text-lg font-bold text-gray-800">Datos para el pago</h2>
                    <p className="text-sm text-gray-500">Cuota mensual: <strong>${monthlyFee.toLocaleString('es-AR')}</strong></p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Titular</p>
                      <p className="font-medium text-gray-800">{paymentSettings.payment_titular}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Alias</p>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                        <span className="font-mono font-medium text-teal-600">{paymentSettings.payment_alias}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentSettings.payment_alias, 'Alias')}
                          className="p-1 text-gray-400 hover:text-teal-600"
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
                          className="p-1 text-gray-400 hover:text-teal-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {paymentSettings.mercadopago_link && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">O pagá con Mercado Pago:</p>
                        <a
                          href={paymentSettings.mercadopago_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-[#009ee3] text-white rounded-lg font-semibold hover:bg-[#007eb5] transition-colors"
                        >
                          <Link2 className="w-5 h-5" />
                          Suscribirme con Mercado Pago
                        </a>
                        <p className="text-xs text-gray-400 mt-1 text-center">
                          Pago automático mensual con tarjeta
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Upload proof */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Comprobante de pago (opcional pero recomendado)
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
                      <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                        ) : (
                          <Upload className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500">
                          {uploading ? 'Subiendo...' : 'Subir comprobante de transferencia'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    )}
                    <p className="text-xs text-gray-400">
                      Adjuntá el comprobante para acelerar la aprobación
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                    <p className="font-medium mb-1">📌 Importante</p>
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
                      disabled={loading || uploading}
                      className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                <Link href="/login" className="text-teal-600 font-medium hover:underline">
                  Ingresá
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
