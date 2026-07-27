'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Package, Clock, CheckCircle, XCircle, ChefHat, Truck, Phone, MapPin, Filter, Bell, MessageCircle, CreditCard } from 'lucide-react';
import { createWhatsAppLink } from '@/lib/phone-utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Pedido {
  id: string;
  status: string;
  deliveryMethod: string;
  deliveryAddress: string;
  notes: string;
  total: number;
  discount?: number;
  createdAt: string;
  user: { fullName: string; phone: string; email: string; barrio: { name: string } | null; lotNumber: string };
  items: { id: string; quantity: number; unitPrice: number; producto: { name: string } }[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  CONFIRMADO: { label: 'Confirmado', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle },
  EN_PREPARACION: { label: 'En preparación', color: 'text-purple-700', bg: 'bg-purple-100', icon: ChefHat },
  ENTREGADO: { label: 'Entregado', color: 'text-green-700', bg: 'bg-green-100', icon: Truck },
  CANCELADO: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
};

const statusFlow = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'ENTREGADO'];

export default function EmprendedorPedidosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams?.get('status') || '');
  const [updating, setUpdating] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const prevPedidosRef = useRef<Set<string>>(new Set());

  const user = session?.user as any;

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationsEnabled(permission === 'granted');
        });
      }
    }
  }, []);

  const sendBrowserNotification = (title: string, body: string) => {
    if (notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
      });
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'EMPRENDEDOR') {
      router.replace('/');
    }
  }, [status, user, router]);

  const fetchPedidos = () => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    
    fetch(`/api/pedidos?${params.toString()}`)
      .then(res => res.json())
      .then(data => setPedidos(data ?? []))
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'EMPRENDEDOR') {
      fetchPedidos();
      
      // Polling para notificaciones en tiempo real cada 30 segundos
      const interval = setInterval(() => {
        fetch(`/api/pedidos?${filter ? `status=${filter}` : ''}`)
          .then(res => res.json())
          .then(newPedidos => {
            if (!newPedidos) return;
            // Verificar si hay pedidos nuevos
            const currentIds = prevPedidosRef.current;
            const newOnes = newPedidos.filter((p: Pedido) => !currentIds.has(p.id));
            if (newOnes.length > 0 && currentIds.size > 0) {
              toast.success(`🔔 ${newOnes.length} pedido(s) nuevo(s)!`);
              sendBrowserNotification('¡Nuevo pedido!', `Tenés ${newOnes.length} pedido(s) nuevo(s) en Pedite`);
            }
            // Update ref
            prevPedidosRef.current = new Set(newPedidos.map((p: Pedido) => p.id));
            setPedidos(newPedidos);
          })
          .catch(() => {});
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, filter, pedidos]);

  const updateStatus = async (pedidoId: string, newStatus: string) => {
    setUpdating(pedidoId);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();
      
      toast.success(`Pedido ${statusConfig[newStatus]?.label?.toLowerCase() ?? ''}`); 
      fetchPedidos();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const filteredPedidos = filter ? pedidos?.filter(p => p.status === filter) : pedidos;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Pedidos</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !filter ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {Object.entries(statusConfig).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filter === key ? `${val.bg} ${val.color}` : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <val.icon className="w-4 h-4" />
              {val.label}
            </button>
          ))}
        </div>

        {filteredPedidos?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay pedidos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPedidos?.map((pedido, index) => {
              const statusInfo = statusConfig[pedido.status] ?? statusConfig.PENDIENTE;
              const StatusIcon = statusInfo.icon;
              const nextStatus = getNextStatus(pedido.status);
              
              return (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{pedido.user?.fullName}</p>
                        <p className="text-sm text-gray-500">
                          {pedido.user?.barrio?.name}{pedido.user?.lotNumber ? `, Lote ${pedido.user.lotNumber}` : ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(pedido.createdAt).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Productos:</p>
                      {pedido.items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.quantity}x {item.producto?.name}</span>
                          <span className="font-medium">${(item.unitPrice * item.quantity)?.toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 mt-3 pt-3">
                        {pedido.discount && pedido.discount > 0 ? (
                          <>
                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                              <span>Subtotal Productos</span><span>${(pedido.total + pedido.discount).toLocaleString('es-AR')}</span>
                            </div>
                            <div className="flex justify-between text-sm text-emerald-600 font-medium mb-2">
                              <span>Reintegro por Cupón</span><span>+${pedido.discount.toLocaleString('es-AR')}</span>
                            </div>
                            <div className="flex justify-between items-center bg-teal-50 p-2 rounded-lg">
                              <span className="font-semibold text-teal-900">A cobrar al vecino</span>
                              <span className="font-bold text-teal-600 text-lg">${pedido.total?.toLocaleString('es-AR')}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span className="font-semibold">Total a cobrar</span>
                            <span className="font-bold text-teal-600 text-lg">${pedido.total?.toLocaleString('es-AR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checklist antes de entregar */}
                    {pedido.status !== 'ENTREGADO' && pedido.status !== 'CANCELADO' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="font-semibold text-blue-800 text-sm mb-2">✓ Checklist antes de entregar</p>
                        <div className="space-y-1.5 text-sm text-blue-700">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>1. Contactar cliente por WhatsApp</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span>2. Confirmar pago recibido</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>3. Aceptar y preparar pedido</span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">Entrega: <strong>A coordinar</strong></p>
                      </div>
                    )}

                    {pedido.deliveryAddress && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        {pedido.deliveryAddress}
                      </div>
                    )}

                    {pedido.notes && (
                      <div className="text-sm mb-3">
                        <span className="text-gray-500">Nota:</span>
                        <p className="text-gray-700">{pedido.notes}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      {pedido.user?.phone && (
                        <a
                          href={createWhatsAppLink(pedido.user.phone, `Hola ${pedido.user.fullName}! Te escribo por tu pedido en Pedite.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-green-600 hover:underline text-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {pedido.user.phone}
                        </a>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        {pedido.status !== 'CANCELADO' && pedido.status !== 'ENTREGADO' && (
                          <button
                            onClick={() => updateStatus(pedido.id, 'CANCELADO')}
                            disabled={updating === pedido.id}
                            className="w-full py-2.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                          >
                            Cancelar
                          </button>
                        )}
                        {nextStatus && (
                          <button
                            onClick={() => updateStatus(pedido.id, nextStatus)}
                            disabled={updating === pedido.id}
                            className="w-full py-3 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-semibold"
                          >
                            {updating === pedido.id ? 'Actualizando...' : `Marcar ${statusConfig[nextStatus]?.label?.toLowerCase()}`}
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
