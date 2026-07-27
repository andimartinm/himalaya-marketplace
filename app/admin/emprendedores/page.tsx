'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Store, Calendar, DollarSign, Plus, FileText, ArrowLeft, Loader2, Upload, X, CheckCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentRecord {
  id: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  proofUrl: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
}

interface Emprendedor {
  id: string;
  businessName: string;
  subscriptionStatus: string;
  monthlyFee: number;
  user: { fullName: string; email: string };
  tipo: 'VECINO' | 'EMPRESA';
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function EmprendedoresContent() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const emprendedorId = searchParams?.get('id');

  const [emprendedores, setEmprendedores] = useState<Emprendedor[]>([]);
  const [selectedEmprendedor, setSelectedEmprendedor] = useState<Emprendedor | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tipoFilter, setTipoFilter] = useState<'' | 'VECINO' | 'EMPRESA'>('');

  const currentDate = new Date();
  const [newPayment, setNewPayment] = useState({
    amount: '15000',
    periodMonth: (currentDate.getMonth() + 1).toString(),
    periodYear: currentDate.getFullYear().toString(),
    proofUrl: '',
    proofKey: '',
    notes: '',
  });

  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      // Fetch emprendedores
      fetch('/api/admin/users?role=EMPRENDEDOR')
        .then(res => res.json())
        .then(data => {
          const emps = data?.filter((u: any) => u.emprendedor)?.map((u: any) => ({
            id: u.emprendedor.id,
            businessName: u.emprendedor.businessName,
            subscriptionStatus: u.emprendedor.subscriptionStatus,
            monthlyFee: u.emprendedor.monthlyFee,
            user: { fullName: u.fullName, email: u.email },
            tipo: u.emprendedor.tipo || 'VECINO',
          })) || [];
          setEmprendedores(emps);

          if (emprendedorId) {
            const found = emps.find((e: Emprendedor) => e.id === emprendedorId);
            if (found) {
              setSelectedEmprendedor(found);
              setNewPayment(prev => ({ ...prev, amount: found.monthlyFee.toString() }));
            }
          }
        })
        .catch(() => setEmprendedores([]))
        .finally(() => setLoading(false));
    }
  }, [user, emprendedorId]);

  useEffect(() => {
    if (selectedEmprendedor) {
      fetch(`/api/admin/payments?emprendedorId=${selectedEmprendedor.id}`)
        .then(res => res.json())
        .then(data => setPayments(data || []))
        .catch(() => setPayments([]));
    }
  }, [selectedEmprendedor]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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

      setNewPayment(prev => ({ ...prev, proofUrl: publicUrl, proofKey: cloud_storage_path }));
      toast.success('Comprobante subido');
    } catch (error) {
      toast.error('Error al subir comprobante');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmprendedor) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emprendedorId: selectedEmprendedor.id,
          ...newPayment,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al registrar pago');
      }

      toast.success('Pago registrado correctamente');
      setShowModal(false);
      setNewPayment({
        amount: selectedEmprendedor.monthlyFee.toString(),
        periodMonth: (currentDate.getMonth() + 1).toString(),
        periodYear: currentDate.getFullYear().toString(),
        proofUrl: '',
        proofKey: '',
        notes: '',
      });

      // Refresh payments
      const paymentsRes = await fetch(`/api/admin/payments?emprendedorId=${selectedEmprendedor.id}`);
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData || []);
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar pago');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {!selectedEmprendedor ? (
          // List of emprendedores
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Pagos</h1>

            {/* Filtros por tipo */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTipoFilter('')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !tipoFilter ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setTipoFilter('VECINO')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                    tipoFilter === 'VECINO' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Emprendedores
                </button>
                <button
                  onClick={() => setTipoFilter('EMPRESA')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                    tipoFilter === 'EMPRESA' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Empresas
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {emprendedores
                .filter(emp => !tipoFilter || emp.tipo === tipoFilter)
                .map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmprendedor(emp);
                    setNewPayment(prev => ({ ...prev, amount: emp.monthlyFee.toString() }));
                  }}
                  className="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        emp.tipo === 'EMPRESA' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {emp.tipo === 'EMPRESA' 
                          ? <Building2 className="w-6 h-6 text-blue-600" />
                          : <Store className="w-6 h-6 text-green-600" />
                        }
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {emp.businessName}
                          {emp.tipo === 'EMPRESA' && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                              Empresa
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">{emp.user.fullName} - {emp.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        emp.subscriptionStatus === 'ACTIVO' ? 'bg-green-100 text-green-700' :
                        emp.subscriptionStatus === 'PENDIENTE_PAGO' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {emp.subscriptionStatus}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">${emp.monthlyFee.toLocaleString('es-AR')}/mes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Selected emprendedor details
          <>
            <button
              onClick={() => setSelectedEmprendedor(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a la lista
            </button>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    selectedEmprendedor.tipo === 'EMPRESA' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {selectedEmprendedor.tipo === 'EMPRESA' 
                      ? <Building2 className="w-8 h-8 text-blue-600" />
                      : <Store className="w-8 h-8 text-green-600" />
                    }
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedEmprendedor.businessName}
                      {selectedEmprendedor.tipo === 'EMPRESA' && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                          Empresa
                        </span>
                      )}
                    </h2>
                    <p className="text-gray-500">{selectedEmprendedor.user.fullName}</p>
                    <p className="text-sm text-gray-400">{selectedEmprendedor.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Registrar Pago
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Pagos</h3>

            {payments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay pagos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(payment => (
                  <div key={payment.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {MONTHS[payment.periodMonth - 1]} {payment.periodYear}
                          </p>
                          <p className="text-sm text-gray-500">
                            Registrado: {new Date(payment.createdAt).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${payment.amount.toLocaleString('es-AR')}</p>
                        {payment.proofUrl && (
                          <a
                            href={payment.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-teal-600 hover:underline flex items-center gap-1 justify-end"
                          >
                            <FileText className="w-4 h-4" />
                            Ver comprobante
                          </a>
                        )}
                      </div>
                    </div>
                    {payment.notes && (
                      <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">{payment.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal for new payment */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Registrar Pago</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                    <select
                      value={newPayment.periodMonth}
                      onChange={(e) => setNewPayment({ ...newPayment, periodMonth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {MONTHS.map((month, i) => (
                        <option key={i} value={i + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                    <select
                      value={newPayment.periodYear}
                      onChange={(e) => setNewPayment({ ...newPayment, periodYear: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {[2025, 2026, 2027].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (opcional)</label>
                  {newPayment.proofUrl ? (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700 flex-1">Comprobante cargado</span>
                      <button
                        type="button"
                        onClick={() => setNewPayment({ ...newPayment, proofUrl: '', proofKey: '' })}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                      ) : (
                        <Upload className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500">
                        {uploading ? 'Subiendo...' : 'Subir comprobante'}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    rows={2}
                    placeholder="Observaciones..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {saving ? 'Guardando...' : 'Registrar Pago'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer variant="light" />
    </div>
  );
}

export default function AdminEmprendedoresPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    }>
      <EmprendedoresContent />
    </Suspense>
  );
}
