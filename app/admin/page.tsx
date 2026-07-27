'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Users, Store, ShoppingBag, MapPin, Clock, TrendingUp, ArrowRight, CheckCircle, Tag, DollarSign, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  totalEmprendedores: number;
  pendingEmprendedores: number;
  totalPedidos: number;
  pedidosPendientes: number;
  totalBarrios: number;
  totalVentas: number;
  totalLicencias: number;
  emprendedoresActivos: number;
  pedidosByStatus: { status: string; count: number }[];
  categoriaStats: { name: string; productos: number; pedidos: number }[];
}

const COLORS = ['#0d9488', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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
      fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(() => setStats(null))
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

  const statusLabels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    CONFIRMADO: 'Confirmado',
    EN_PREPARACION: 'En prep.',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
  };

  const pieData = stats?.pedidosByStatus?.map(p => ({
    name: statusLabels[p.status] ?? p.status,
    value: p.count,
  })) ?? [];

  const barData = stats?.categoriaStats ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Administración</h1>

        {/* Stats cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Vecinos', value: stats?.totalUsers ?? 0, pending: stats?.pendingUsers, icon: Users, color: 'bg-blue-100 text-blue-600' },
            { label: 'Emprendedores', value: stats?.totalEmprendedores ?? 0, pending: stats?.pendingEmprendedores, icon: Store, color: 'bg-green-100 text-green-600' },
            { label: 'Pedidos', value: stats?.totalPedidos ?? 0, pending: stats?.pedidosPendientes, icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
              {stat.pending !== undefined && stat.pending > 0 && (
                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {stat.pending} pendientes
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Financial stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">${(stats?.totalVentas ?? 0).toLocaleString('es-AR')}</p>
                <p className="text-white/80 text-sm">Ventas totales (emprendedores)</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">${(stats?.totalLicencias ?? 0).toLocaleString('es-AR')}</p>
                <p className="text-white/80 text-sm">Licencias cobradas/mes</p>
              </div>
            </div>
            <p className="text-xs text-white/60">{stats?.emprendedoresActivos ?? 0} emprendedores activos x $15.000</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-5 text-white"
          >
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalBarrios ?? 0}</p>
                <p className="text-white/80 text-sm">Barrios activos</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/usuarios?status=PENDIENTE">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-5 text-white cursor-pointer"
            >
              <Clock className="w-7 h-7 mb-2" />
              <h3 className="font-semibold mb-1">Validar usuarios</h3>
              <p className="text-white/80 text-sm">
                {(stats?.pendingUsers ?? 0) + (stats?.pendingEmprendedores ?? 0)} pendientes
              </p>
            </motion.div>
          </Link>
          <Link href="/admin/barrios">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-5 text-white cursor-pointer"
            >
              <MapPin className="w-7 h-7 mb-2" />
              <h3 className="font-semibold mb-1">Gestionar barrios</h3>
              <p className="text-white/80 text-sm">{stats?.totalBarrios} barrios activos</p>
            </motion.div>
          </Link>
          <Link href="/admin/categorias">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-5 text-white cursor-pointer"
            >
              <Tag className="w-7 h-7 mb-2" />
              <h3 className="font-semibold mb-1">Gestionar categorías</h3>
              <p className="text-white/80 text-sm">{stats?.categoriaStats?.length ?? 0} categorías</p>
            </motion.div>
          </Link>

          <Link href="/admin/cupones">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 text-white cursor-pointer"
            >
              <Tag className="w-7 h-7 mb-2" />
              <h3 className="font-semibold mb-1">Cupones de descuento</h3>
              <p className="text-white/80 text-sm">Crear y gestionar cupones</p>
            </motion.div>
          </Link>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pedidos by status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-4">Pedidos por estado</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">Sin datos</p>
            )}
          </motion.div>

          {/* Products by category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="font-semibold text-gray-800 mb-4">Productos y pedidos por categoría</h2>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="productos" name="Productos" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pedidos" name="Pedidos" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">Sin datos</p>
            )}
          </motion.div>
        </div>
      </main>
      
      <Footer variant="light" />
    </div>
  );
}
