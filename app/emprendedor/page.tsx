'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Package, ShoppingBag, Clock, CheckCircle, TrendingUp, ArrowRight, ChefHat, Truck, XCircle, ShoppingCart, Tag } from 'lucide-react';
import { ModeTransition } from '@/components/mode-transition';
import { motion } from 'framer-motion';

interface Pedido {
  id: string;
  status: string;
  total: number;
  discount?: number;
  createdAt: string;
  user: { fullName: string; barrio: { name: string } | null };
  items: { producto: { name: string }; quantity: number }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  CONFIRMADO: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  EN_PREPARACION: { label: 'En prep.', color: 'bg-purple-100 text-purple-700', icon: ChefHat },
  ENTREGADO: { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: Truck },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function EmprendedorDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransition, setShowTransition] = useState(false);

  const user = session?.user as any;

  const switchToVecino = () => {
    setShowTransition(true);
    setTimeout(() => {
      router.push('/catalogo');
    }, 800);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && user?.role !== 'EMPRENDEDOR') {
      router.replace('/');
    }
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === 'EMPRENDEDOR') {
      fetch('/api/pedidos')
        .then(res => res.json())
        .then(data => setPedidos(data ?? []))
        .catch(() => setPedidos([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const pendientes = pedidos?.filter(p => p.status === 'PENDIENTE') ?? [];
  const enProceso = pedidos?.filter(p => ['CONFIRMADO', 'EN_PREPARACION'].includes(p.status)) ?? [];
  const totalVentas = pedidos?.filter(p => p.status === 'ENTREGADO')?.reduce((sum, p) => sum + (p.total ?? 0), 0) ?? 0;
  const totalReintegros = pedidos?.filter(p => p.discount && p.status !== 'CANCELADO').reduce((sum, p) => sum + (p.discount || 0), 0) ?? 0;

  return (
    <>
      <ModeTransition mode="vecino" show={showTransition} onComplete={() => setShowTransition(false)} />
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <Link href="/emprendedor/pedidos?status=PENDIENTE">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-sm p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{pendientes.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">Pedidos pendientes</p>
              </motion.div>
            </Link>
            {[
              { label: 'En proceso', value: enProceso.length, icon: Package, color: 'bg-blue-100 text-blue-600' },
              { label: 'Total pedidos', value: pedidos?.length ?? 0, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
              { label: 'Ventas totales', value: `$${totalVentas.toLocaleString('es-AR')}`, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
              { label: 'Reintegros a favor', value: `$${totalReintegros.toLocaleString('es-AR')}`, icon: Tag, color: 'bg-emerald-100 text-emerald-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 1) * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-3 sm:p-4"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.color} rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link href="/emprendedor/productos">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-6 text-white cursor-pointer"
            >
              <Package className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Gestionar productos</h3>
              <p className="text-white/80 text-sm mb-3">Agregá, editá o eliminá tus productos</p>
              <div className="flex items-center gap-1 text-sm font-medium">
                Ir a productos <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </Link>
          <Link href="/emprendedor/pedidos">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-6 text-white cursor-pointer"
            >
              <ShoppingBag className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Ver pedidos</h3>
              <p className="text-white/80 text-sm mb-3">Gestioná los pedidos de tus clientes</p>
              <div className="flex items-center gap-1 text-sm font-medium">
                Ir a pedidos <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Pedidos recientes</h2>
            <Link href="/emprendedor/pedidos" className="text-teal-600 text-sm hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {pendientes.length === 0 && enProceso.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay pedidos pendientes</p>
          ) : (
            <div className="space-y-3">
              {[...pendientes, ...enProceso].slice(0, 5).map((pedido) => {
                const statusInfo = statusConfig[pedido.status] ?? statusConfig.PENDIENTE;
                
                return (
                  <div key={pedido.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{pedido.user?.fullName}</p>
                      <p className="text-sm text-gray-500">
                        {pedido.items?.map(i => `${i.quantity}x ${i.producto?.name}`).join(', ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {pedido.user?.barrio?.name} • {new Date(pedido.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-lg font-bold text-gray-800 mt-1">${pedido.total?.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

          {/* Switch to vecino mode */}
          <motion.button
            onClick={switchToVecino}
            whileHover={{ scale: 1.02 }}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl p-4 text-white flex items-center justify-center gap-3"
          >
            <ShoppingCart className="w-6 h-6" />
            <div className="text-left">
              <p className="font-semibold">Pasá a modo vecino</p>
              <p className="text-sm text-white/80">Empezá a comprar productos</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto" />
          </motion.button>
        </main>
        
        <Footer variant="light" />
      </div>
    </>
  );
}
