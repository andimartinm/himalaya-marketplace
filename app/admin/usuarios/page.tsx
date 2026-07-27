'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Users, Store, Clock, CheckCircle, XCircle, Mail, Phone, MapPin, Search, CreditCard, ShoppingBag, DollarSign, Ban, Power, Eye, Building2, FileText, MessageCircle, Trash2 } from 'lucide-react';
import { Footer } from '@/components/footer';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createWhatsAppLink } from '@/lib/phone-utils';

const subscriptionStatusConfig: Record<string, { label: string; color: string }> = {
  PENDIENTE_PAGO: { label: 'Pendiente pago', color: 'bg-yellow-100 text-yellow-700' },
  ACTIVO: { label: 'Activo', color: 'bg-green-100 text-green-700' },
  VENCIDO: { label: 'Vencido', color: 'bg-red-100 text-red-700' },
  CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-700' },
};

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  dni: string;
  role: string;
  status: string;
  lotNumber: string;
  createdAt: string;
  barrio: { name: string } | null;
  stats: {
    totalPedidos: number;
    totalGastado: number;
    totalGenerado: number;
  };
  emprendedor: {
    id: string;
    businessName: string;
    categoria: { name: string } | null;
    subscriptionStatus: string;
    subscriptionExpiry: string | null;
    monthlyFee: number;
    active: boolean;
    barrios: { name: string }[];
    registrationProofUrl: string | null;
    lastPayment: { periodMonth: number; periodYear: number; createdAt: string } | null;
    tipo: 'VECINO' | 'EMPRESA';
    plan: string | null;
    zona: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  APROBADO: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  RECHAZADO: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
};

const getDaysUntilNextPayment = (lastPaymentCreatedAt: string | null | undefined): number | null => {
  if (!lastPaymentCreatedAt) return null;
  const last = new Date(lastPaymentCreatedAt);
  const next = new Date(last);
  next.setDate(next.getDate() + 30);
  const today = new Date();
  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const buildWhatsAppMessage = (businessName: string, daysLeft: number) => {
  const text =
    `¡Hola! 👋 Te escribimos desde *Pedite* para avisarte que tu membresía como emprendedor en nuestra plataforma está por vencer en *${daysLeft} días*.\n\n` +
    `Para continuar disfrutando de todos los beneficios y seguir apareciendo en el catálogo, podés renovarla fácilmente:\n\n` +
    `💳 *Suscripción mensual* → https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=fecf2682c00845878429071823d3465e\n\n` +
    `También podés abonar por transferencia al alias: *pedite*\n\n` +
    `¡Muchas gracias por ser parte de la comunidad Pedite! Si tenés alguna duda, estamos acá para ayudarte 🙌`;
  return encodeURIComponent(text);
};

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams?.get('status') ?? '');
  const [roleFilter, setRoleFilter] = useState(searchParams?.get('role') ?? '');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [status, user, router]);

  const fetchUsers = () => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    // EMPRESA no es un rol real, es un subtipo de EMPRENDEDOR - traemos todos los EMPRENDEDOR y filtramos en cliente
    if (roleFilter && roleFilter !== 'EMPRESA') {
      params.set('role', roleFilter);
    } else if (roleFilter === 'EMPRESA') {
      params.set('role', 'EMPRENDEDOR');
    }

    fetch(`/api/admin/users?${params.toString()}`)
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user, filter, roleFilter]);

  const updateStatus = async (userId: string, newStatus: string) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();

      toast.success(`Usuario ${newStatus === 'APROBADO' ? 'habilitado' : 'deshabilitado'}`);
      fetchUsers();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setUpdating(null);
    }
  };

  const toggleEmprendedorActive = async (userId: string, currentActive: boolean) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emprendedorActive: !currentActive }),
      });

      if (!res.ok) throw new Error();

      toast.success(`Emprendedor ${!currentActive ? 'habilitado' : 'deshabilitado'}`);
      fetchUsers();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar a "${userName}"? Esta acción es irreversible y eliminará todos sus datos (pedidos, productos, etc).`)) return;
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar usuario');
    } finally {
      setUpdating(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
    // Filtro por tipo de emprendedor (EMPRESA)
    if (roleFilter === 'EMPRESA') {
      if (!u.emprendedor || u.emprendedor.tipo !== 'EMPRESA') return false;
    }
    // Filtro por emprendedor vecino (excluye empresas)
    if (roleFilter === 'EMPRENDEDOR') {
      if (!u.emprendedor || u.emprendedor.tipo === 'EMPRESA') return false;
    }
    
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.emprendedor?.businessName?.toLowerCase().includes(searchLower)
    );
  });

  const formatMoney = (amount: number) => `$${amount.toLocaleString('es-AR')}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Usuarios</h1>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o negocio..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setRoleFilter('')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !roleFilter ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setRoleFilter('VECINO')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  roleFilter === 'VECINO' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Vecinos
              </button>
              <button
                onClick={() => setRoleFilter('EMPRENDEDOR')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  roleFilter === 'EMPRENDEDOR' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Store className="w-4 h-4" />
                Emprendedores
              </button>
              <button
                onClick={() => setRoleFilter('EMPRESA')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  roleFilter === 'EMPRESA' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Empresas
              </button>
            </div>

            <div className="border-l border-gray-200 mx-2" />

            <div className="flex gap-2">
              {Object.entries(statusConfig).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFilter(filter === key ? '' : key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === key ? val.color : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users list */}
        {filteredUsers?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers?.map((u, index) => {
              const statusInfo = statusConfig[u.status] ?? statusConfig.PENDIENTE;

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`bg-white rounded-xl shadow-sm p-4 ${u.emprendedor && !u.emprendedor.active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          u.emprendedor?.tipo === 'EMPRESA' 
                            ? 'bg-blue-100 text-blue-600' 
                            : u.role === 'EMPRENDEDOR' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.emprendedor?.tipo === 'EMPRESA' 
                          ? <Building2 className="w-6 h-6" /> 
                          : u.role === 'EMPRENDEDOR' 
                            ? <Store className="w-6 h-6" /> 
                            : <Users className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800">
                          {u.fullName}
                          {u.emprendedor && (
                            <span className={`font-normal ml-2 ${u.emprendedor.tipo === 'EMPRESA' ? 'text-blue-600' : 'text-teal-600'}`}>
                              ({u.emprendedor.businessName})
                            </span>
                          )}
                          {u.emprendedor?.tipo === 'EMPRESA' && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                              Empresa
                            </span>
                          )}
                          {u.emprendedor && !u.emprendedor.active && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">Deshabilitado</span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {u.email}
                          </span>
                          {u.phone && (
                            <a
                              href={createWhatsAppLink(u.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline"
                            >
                              <Phone className="w-4 h-4" />
                              {u.phone}
                            </a>
                          )}
                          {u.barrio && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {u.barrio.name}
                              {u.lotNumber ? `, Lote ${u.lotNumber}` : ''}
                            </span>
                          )}
                        </div>

                        {/* Stats section */}
                        <div className="flex flex-wrap gap-3 mt-3">
                          {u.role === 'VECINO' && (
                            <>
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-sm">
                                <ShoppingBag className="w-4 h-4 text-blue-500" />
                                <span className="text-blue-700">{u.stats.totalPedidos} pedidos</span>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-sm">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-green-700">{formatMoney(u.stats.totalGastado)} gastado</span>
                              </div>
                            </>
                          )}

                          {u.role === 'EMPRENDEDOR' && u.emprendedor && (
                            <>
                              {u.emprendedor.barrios?.length > 0 && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded text-sm">
                                  <MapPin className="w-4 h-4 text-purple-500" />
                                  <span className="text-purple-700">
                                    {u.emprendedor.barrios.map(b => b.name).join(', ')}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-sm">
                                <ShoppingBag className="w-4 h-4 text-blue-500" />
                                <span className="text-blue-700">{u.stats.totalPedidos} pedidos</span>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-sm">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-green-700">{formatMoney(u.stats.totalGenerado)} generado</span>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                                  subscriptionStatusConfig[u.emprendedor.subscriptionStatus]?.color ?? 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <CreditCard className="w-3 h-3" />
                                {subscriptionStatusConfig[u.emprendedor.subscriptionStatus]?.label ?? u.emprendedor.subscriptionStatus}
                              </span>

                              {/* Payment expiry indicator */}
                              {(() => {
                                const days = getDaysUntilNextPayment(u.emprendedor.lastPayment?.createdAt);
                                if (days === null) return null;
                                const isUrgent = days <= 25;
                                const isWarning = days <= 30;
                                if (!isWarning) return null;
                                return (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                                      isUrgent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      <Clock className="w-3 h-3" />
                                      {days <= 0 ? 'Vencido' : `${days} días para próximo cobro`}
                                    </span>
                                    {isUrgent && u.phone && (
                                      <a
                                        href={`https://wa.me/${u.phone.replace(/\D/g, '')}?text=${buildWhatsAppMessage(u.emprendedor.businessName, days)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        Contactar por pago
                                      </a>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>

                        {u.emprendedor?.categoria && (
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                            {u.emprendedor.categoria.name}
                          </span>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          Registrado: {new Date(u.createdAt).toLocaleDateString('es-AR')}
                        </p>
                        
                        {u.emprendedor?.registrationProofUrl && (
                          <a
                            href={u.emprendedor.registrationProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <FileText className="w-3 h-3" />
                            Ver comprobante de pago
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {u.status === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => updateStatus(u.id, 'APROBADO')}
                              disabled={updating === u.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Aprobar"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => updateStatus(u.id, 'RECHAZADO')}
                              disabled={updating === u.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rechazar"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* Vecino aprobado - botón para deshabilitar/habilitar */}
                        {u.role === 'VECINO' && u.status !== 'PENDIENTE' && (
                          <button
                            onClick={() => updateStatus(u.id, u.status === 'APROBADO' ? 'RECHAZADO' : 'APROBADO')}
                            disabled={updating === u.id}
                            className={`p-2 rounded-lg transition-colors ${
                              u.status === 'APROBADO'
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={u.status === 'APROBADO' ? 'Deshabilitar' : 'Habilitar'}
                          >
                            {u.status === 'APROBADO' ? <Ban className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                          </button>
                        )}

                        {u.emprendedor && u.status === 'APROBADO' && (
                          <>
                            <Link
                              href={`/admin/emprendedores?id=${u.emprendedor.id}`}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Ver pagos"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => toggleEmprendedorActive(u.id, u.emprendedor!.active)}
                              disabled={updating === u.id}
                              className={`p-2 rounded-lg transition-colors ${
                                u.emprendedor.active
                                  ? 'text-orange-600 hover:bg-orange-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={u.emprendedor.active ? 'Deshabilitar' : 'Habilitar'}
                            >
                              {u.emprendedor.active ? <Ban className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                            </button>
                          </>
                        )}

                        {/* Delete user button */}
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => deleteUser(u.id, u.fullName)}
                            disabled={updating === u.id}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer variant="light" />
    </div>
  );
}
