'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Tag, Plus, Pencil, Trash2, X, Users, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  maxUsesPerUser: number;
  active: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  _count: { usages: number };
}

interface CouponDetail extends Coupon {
  usages: {
    id: string;
    createdAt: string;
    user: { id: string; fullName: string; email: string };
    pedido: { id: string; total: number; discount: number; createdAt: string };
  }[];
}

const emptyForm = {
  code: '',
  discountPercent: 30,
  maxUsesPerUser: 3,
  active: true,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
};

export default function AdminCuponesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detailCoupon, setDetailCoupon] = useState<CouponDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchCoupons();
  }, [session, status]);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      setCoupons(data);
    } catch { toast.error('Error cargando cupones'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discountPercent: c.discountPercent,
      maxUsesPerUser: c.maxUsesPerUser,
      active: c.active,
      startDate: c.startDate.split('T')[0],
      endDate: c.endDate ? c.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('El código es requerido'); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          endDate: form.endDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editingId ? 'Cupón actualizado' : 'Cupón creado');
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) { toast.error(err.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      toast.success('Cupón eliminado');
      fetchCoupons();
    } catch { toast.error('Error eliminando'); }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await fetch(`/api/admin/coupons/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active }),
      });
      fetchCoupons();
      toast.success(c.active ? 'Cupón desactivado' : 'Cupón activado');
    } catch { toast.error('Error'); }
  };

  const viewDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`);
      const data = await res.json();
      setDetailCoupon(data);
      setShowDetail(true);
    } catch { toast.error('Error cargando detalle'); }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-20 pb-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Campaña de Cupones</h1>
              <p className="text-gray-400 text-sm mt-1">Gestiona los descuentos activos en la plataforma</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nuevo Cupón
            </button>
          </div>

          {coupons.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay cupones creados</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase text-xs tracking-wider">
                    <th className="py-4 px-4 text-left font-medium">Estado</th>
                    <th className="py-4 px-4 text-left font-medium">Código</th>
                    <th className="py-4 px-4 text-center font-medium">Descuento</th>
                    <th className="py-4 px-4 text-center font-medium">Válido hasta</th>
                    <th className="py-4 px-4 text-center font-medium">Usos máx.</th>
                    <th className="py-4 px-4 text-center font-medium">Consumos</th>
                    <th className="py-4 px-4 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${!c.active ? 'opacity-50' : ''}`}>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleActive(c)}
                          className={`p-1.5 rounded-full transition-colors ${c.active ? 'text-green-500 bg-green-50 hover:bg-green-100' : 'text-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                          title={c.active ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Código copiado'); }}
                          className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          {c.code}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                          {c.discountPercent}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600">
                        {c.endDate ? new Date(c.endDate).toLocaleDateString('es-AR') : '—'}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600">
                        {c.maxUsesPerUser} p/u
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => viewDetail(c.id)}
                          className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                        >
                          <span className="font-semibold text-gray-800 group-hover:text-indigo-600">{c._count.usages}</span>
                          <span className="text-[10px] text-gray-400 group-hover:text-indigo-500">Ver reporte</span>
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Cupón' : 'Nuevo Cupón'}</h2>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-xl font-mono uppercase" placeholder="EJ: PEDITE30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">% Descuento</label>
                    <input
                      type="number" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl" min={1} max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Máx usos/usuario</label>
                    <input
                      type="number" value={form.maxUsesPerUser} onChange={e => setForm({ ...form, maxUsesPerUser: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl" min={1}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input
                      type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin (opcional)</label>
                    <input
                      type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-teal-600"
                  />
                  <span className="text-sm text-gray-700">Cupón activo</span>
                </label>
                <button
                  onClick={handleSave} disabled={saving}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Cupón'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal - Reporte de Usos */}
      <AnimatePresence>
        {showDetail && detailCoupon && (() => {
          // Aggregate usages by user
          const userMap = new Map<string, { fullName: string; email: string; uses: number; totalSpent: number; totalSaved: number }>();
          detailCoupon.usages?.forEach(u => {
            const existing = userMap.get(u.user.id);
            if (existing) {
              existing.uses += 1;
              existing.totalSpent += u.pedido.total || 0;
              existing.totalSaved += u.pedido.discount || 0;
            } else {
              userMap.set(u.user.id, {
                fullName: u.user.fullName,
                email: u.user.email,
                uses: 1,
                totalSpent: u.pedido.total || 0,
                totalSaved: u.pedido.discount || 0,
              });
            }
          });
          const aggregatedUsers = Array.from(userMap.values());
          return (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-gray-800">Reporte de Usos</h2>
                </div>
                <button onClick={() => setShowDetail(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <p className="text-sm text-gray-500 mb-5">Cupón: <span className="font-semibold text-indigo-600">{detailCoupon.code}</span></p>

              {aggregatedUsers.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">Aún no se ha usado este cupón</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-left">
                        <th className="pb-3 font-medium">Vecino</th>
                        <th className="pb-3 font-medium text-center">Cant. Usos</th>
                        <th className="pb-3 font-medium text-right">Monto Gastado</th>
                        <th className="pb-3 font-medium text-right">Plata Ahorrada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedUsers.map((u, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-3">
                            <p className="font-medium text-gray-800">{u.fullName}</p>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </td>
                          <td className="py-3 text-center text-gray-700">{u.uses}</td>
                          <td className="py-3 text-right text-gray-700">${u.totalSpent.toLocaleString('es-AR')}</td>
                          <td className="py-3 text-right font-semibold text-emerald-600">${u.totalSaved.toLocaleString('es-AR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
      <Footer />
    </>
  );
}
