'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ClipboardList, Search, User, Store, MapPin, Phone, Calendar, DollarSign, Package, ChevronDown, ChevronUp, MessageCircle, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { createWhatsAppLink } from '@/lib/phone-utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PedidoItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  producto: { name: string };
}

interface Pedido {
  id: string;
  status: string;
  deliveryMethod: string;
  deliveryAddress: string | null;
  notes: string | null;
  total: number;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    barrio: { name: string } | null;
    lotNumber: string | null;
  };
  emprendedor: {
    id: string;
    businessName: string;
    user: { phone: string | null };
  };
  items: PedidoItem[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  CONFIRMADO: { label: 'Confirmado', color: 'text-blue-700', bg: 'bg-blue-100' },
  EN_PREPARACION: { label: 'En preparación', color: 'text-purple-700', bg: 'bg-purple-100' },
  ENTREGADO: { label: 'Entregado', color: 'text-green-700', bg: 'bg-green-100' },
  CANCELADO: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100' },
};

const deliveryLabels: Record<string, string> = {
  ENTREGA_PROPIA: 'A domicilio',
  RETIRO_DOMICILIO: 'Retiro en local',
  PUNTO_ENCUENTRO: 'A coordinar',
};

export default function AdminPedidosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      fetch('/api/admin/pedidos')
        .then(res => res.json())
        .then(data => setPedidos(Array.isArray(data) ? data : []))
        .catch(() => setPedidos([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch =
      p.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.emprendedor.businessName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="w-8 h-8 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Todos los Pedidos</h1>
            <p className="text-gray-500 text-sm">Vista general de pedidos del marketplace</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, emprendedor o ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = pedidos.filter(p => p.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
                className={`p-3 rounded-xl border transition-all ${
                  statusFilter === key
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className={`text-xs font-medium ${config.color}`}>{config.label}</div>
              </button>
            );
          })}
        </div>

        {/* Pedidos list */}
        {filteredPedidos.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {search || statusFilter ? 'No se encontraron pedidos' : 'No hay pedidos registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPedidos.map(pedido => {
              const statusInfo = statusConfig[pedido.status] || statusConfig.PENDIENTE;
              const isExpanded = expandedId === pedido.id;

              return (
                <motion.div
                  key={pedido.id}
                  layout
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-gray-400">#{pedido.id.slice(-6)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-800 truncate">{pedido.user.fullName}</span>
                        <span className="text-gray-300">→</span>
                        <Store className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 truncate">{pedido.emprendedor.businessName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-teal-600">
                        ${pedido.total.toLocaleString('es-AR')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(pedido.createdAt)}
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-4 space-y-4">
                          {/* Cliente info */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Cliente</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{pedido.user.fullName}</span>
                              </div>
                              {pedido.user.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span>{pedido.user.phone}</span>
                                </div>
                              )}
                              {pedido.user.barrio && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span>{pedido.user.barrio.name}{pedido.user.lotNumber ? `, Lote ${pedido.user.lotNumber}` : ''}</span>
                                </div>
                              )}
                              {pedido.deliveryAddress && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-teal-500" />
                                  <span className="text-teal-700">Entrega: {pedido.deliveryAddress}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Items */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Productos</h4>
                            <div className="space-y-2">
                              {pedido.items.map(item => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span>{item.quantity}x {item.producto.name}</span>
                                  </div>
                                  <span className="font-medium">${item.subtotal.toLocaleString('es-AR')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Checklist de seguridad */}
                          <div className="bg-blue-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">✓ Checklist antes de entregar</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded border-2 border-blue-300 flex items-center justify-center">
                                  <MessageCircle className="w-3 h-3 text-blue-500" />
                                </div>
                                <span className="text-sm text-blue-700">1. Contactar cliente por WhatsApp</span>
                                {pedido.user.phone && (
                                  <a
                                    href={createWhatsAppLink(pedido.user.phone, `Hola ${pedido.user.fullName}! Soy de Pedite. Te contacto por tu pedido #${pedido.id.slice(-6)}.`)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto px-2 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    Contactar
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded border-2 border-blue-300 flex items-center justify-center">
                                  <CreditCard className="w-3 h-3 text-blue-500" />
                                </div>
                                <span className="text-sm text-blue-700">2. Confirmar pago recibido</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded border-2 border-blue-300 flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-blue-500" />
                                </div>
                                <span className="text-sm text-blue-700">3. Aceptar y preparar pedido</span>
                              </div>
                            </div>
                          </div>

                          {/* Delivery & Notes */}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Entrega:</span>
                              <span className="font-medium">{deliveryLabels[pedido.deliveryMethod] || pedido.deliveryMethod}</span>
                            </div>
                            {pedido.notes && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Notas:</span>
                                <span>{pedido.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
