'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Package, Clock, CheckCircle, XCircle, Truck, ChefHat, Phone, MapPin, Bell, MessageCircle } from 'lucide-react';
import { createWhatsAppLink } from '@/lib/phone-utils';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface PedidoItem {
  id: string;
  quantity: number;
  unitPrice: number;
  producto: { name: string };
}

interface Pedido {
  id: string;
  status: string;
  deliveryMethod: string;
  deliveryAddress: string;
  notes: string;
  total: number;
  discount?: number;
  createdAt: string;
  emprendedor: {
    businessName: string;
    user: { fullName: string; phone: string };
  };
  items: PedidoItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  CONFIRMADO: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  EN_PREPARACION: { label: 'En preparación', color: 'bg-purple-100 text-purple-700', icon: ChefHat },
  ENTREGADO: { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: Truck },
  RECIBIDO: { label: 'Recibido', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function MisPedidosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const prevPedidosRef = useRef<Record<string, string>>({});

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

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
      });
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const fetchPedidos = useCallback(() => {
    fetch('/api/pedidos')
      .then(res => res.json())
      .then(data => {
        if (!data) return;
        
        // Verificar cambios de estado para notificar
        const prevStatuses = prevPedidosRef.current;
        data.forEach((p: Pedido) => {
          if (prevStatuses[p.id] && prevStatuses[p.id] !== p.status) {
            const statusLabel = statusConfig[p.status]?.label || p.status;
            toast.success(`🔔 Tu pedido está: ${statusLabel}`);
            sendBrowserNotification('Actualización de pedido', `Tu pedido está: ${statusLabel}`);
          }
        });
        
        // Guardar estados actuales para próxima comparación
        const newStatuses: Record<string, string> = {};
        data.forEach((p: Pedido) => { newStatuses[p.id] = p.status; });
        prevPedidosRef.current = newStatuses;
        
        setPedidos(data);
      })
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [sendBrowserNotification]);

  useEffect(() => {
    fetchPedidos();
    
    // Polling para notificaciones en tiempo real cada 30 segundos
    const interval = setInterval(fetchPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

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
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="w-7 h-7 text-teal-600" />
          Mis Pedidos
        </h1>

        {pedidos?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aún no tenés pedidos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido, index) => {
              const statusInfo = statusConfig[pedido.status] ?? statusConfig.PENDIENTE;
              const StatusIcon = statusInfo.icon;
              
              return (
                <motion.div
                  key={pedido.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div
                    onClick={() => setSelectedPedido(selectedPedido?.id === pedido.id ? null : pedido)}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        {new Date(pedido.createdAt).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{pedido.emprendedor?.businessName}</h3>
                        <p className="text-sm text-gray-500">{pedido.items?.length} productos</p>
                      </div>
                      <span className="text-xl font-bold text-teal-600">
                        ${pedido.total?.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedPedido?.id === pedido.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-gray-100 p-4 bg-gray-50"
                    >
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Productos:</p>
                          <div className="space-y-1">
                            {pedido.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.quantity}x {item.producto?.name}</span>
                                <span className="font-medium">${(item.unitPrice * item.quantity)?.toLocaleString('es-AR')}</span>
                              </div>
                            ))}
                          </div>
                          {pedido.discount && pedido.discount > 0 && (
                            <div className="flex justify-between text-sm pt-2 mt-2 border-t border-gray-200 text-emerald-600 font-medium">
                              <span>Descuento cupón</span>
                              <span>-${pedido.discount.toLocaleString('es-AR')}</span>
                            </div>
                          )}
                        </div>

                        {pedido.deliveryAddress && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-gray-600">{pedido.deliveryAddress}</span>
                          </div>
                        )}

                        {pedido.notes && (
                          <div className="text-sm">
                            <span className="text-gray-500">Notas:</span>
                            <p className="text-gray-700">{pedido.notes}</p>
                          </div>
                        )}

                        {pedido.emprendedor?.user?.phone && (
                          <a
                            href={createWhatsAppLink(pedido.emprendedor.user.phone, 'Hola! Te escribo por mi pedido en Pedite')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-600 hover:underline text-sm"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp: {pedido.emprendedor.user.phone}
                          </a>
                        )}

                        {pedido.status === 'ENTREGADO' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetch(`/api/pedidos/${pedido.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'RECIBIDO' }),
                              }).then(() => {
                                toast.success('¡Pedido marcado como recibido!');
                                fetchPedidos();
                              });
                            }}
                            className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            ✓ Marcar como recibido
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
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
