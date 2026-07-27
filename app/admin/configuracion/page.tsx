'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Settings, Save, Loader2, CreditCard, Building, DollarSign, Link2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminConfiguracionPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    payment_alias: '',
    payment_cbu: '',
    payment_titular: '',
    monthly_fee: '15000',
    mercadopago_link: '',
    whatsapp_number: '',
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
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => setSettings(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error();

      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Configuración del Sistema</h1>
              <p className="text-sm text-gray-500">Datos de pago para suscripciones</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Datos Bancarios para Transferencias
              </h3>
              <p className="text-sm text-gray-500">
                Estos datos se mostrarán a los emprendedores cuando se registren para que puedan realizar el pago de la suscripción.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
                <input
                  type="text"
                  value={settings.payment_alias}
                  onChange={(e) => setSettings({ ...settings, payment_alias: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="ej: himalaya.pilar.mp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CBU</label>
                <input
                  type="text"
                  value={settings.payment_cbu}
                  onChange={(e) => setSettings({ ...settings, payment_cbu: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="ej: 0000003100099999999991"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Titular
                </label>
                <input
                  type="text"
                  value={settings.payment_titular}
                  onChange={(e) => setSettings({ ...settings, payment_titular: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="ej: Himalaya Agency SRL"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Link de Mercado Pago (Suscripción)
              </h3>
              <p className="text-sm text-gray-500">
                Este link se mostrará a los emprendedores como opción de pago automático.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del Link de Pago</label>
                <input
                  type="url"
                  value={settings.mercadopago_link}
                  onChange={(e) => setSettings({ ...settings, mercadopago_link: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  placeholder="ej: https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=..."
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Tarifa de Suscripción
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuota mensual (ARS)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={settings.monthly_fee}
                    onChange={(e) => setSettings({ ...settings, monthly_fee: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Este valor se mostrará a los nuevos emprendedores</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-xl space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                WhatsApp de Contacto
              </h3>
              <p className="text-sm text-gray-500">
                Número de WhatsApp para recibir consultas y feedback de los usuarios.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número (con código de país)</label>
                <input
                  type="text"
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="ej: 5491168477708"
                />
                <p className="text-xs text-gray-400 mt-1">Sin espacios ni guiones. Ej: 5491168477708</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </form>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  );
}
