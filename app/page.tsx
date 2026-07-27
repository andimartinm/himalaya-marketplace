'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Utensils, Package, Wrench, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/footer';

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any)?.role;
      if (role === 'ADMIN') {
        router.replace('/admin');
      } else if (role === 'EMPRENDEDOR') {
        router.replace('/emprendedor');
      } else {
        router.replace('/catalogo');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#107c46]/70 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: 'url(/hero-empresa.jpg)' }}
        />

        {/* Barra blanca debajo del logo - nav */}
        <nav className="relative z-[60] w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo-pedite-oficial.png" 
                alt="Pedite" 
                width={140} 
                height={40} 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="hidden sm:block px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Registrarme
              </Link>
              <Link
                href="/registro/empresa"
                className="hidden sm:block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Registro Empresa
              </Link>
              <div className="sm:hidden relative z-[100]">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                {mobileMenuOpen && (
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px] z-[100]">
                    <Link
                      href="/registro"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Registrarme
                    </Link>
                    <Link
                      href="/registro/empresa"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                    >
                      Registro Empresa
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 md:py-32 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Tu barrio ya está <span className="text-cyan-300">vendiendo distinto</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
            Descubrí comidas, productos y servicios de tus propios vecinos en un solo lugar.
            Más fácil para comprar. Más profesional para vender.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registro"
              className="px-8 py-4 bg-white text-teal-600 rounded-xl font-semibold text-lg hover:bg-teal-50 transition-colors"
            >
              Explorar el barrio
            </Link>

            <Link
              href="/registro/emprendedor"
              className="px-8 py-4 bg-teal-700/50 text-white rounded-xl font-semibold text-lg hover:bg-teal-700/70 transition-colors border border-white/30"
            >
              Quiero vender en mi barrio
            </Link>
          </div>
        </div>
      </header>

      {/* Categorías */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-14">
            Todo lo que ya se vende en Pilar del Este, ahora en un solo lugar
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Utensils,
                title: 'Comidas',
                desc: 'Viandas caseras, pastelería y comidas hechas por vecinos del barrio',
                color: 'bg-orange-100 text-orange-600'
              },
              {
                icon: Package,
                title: 'Productos',
                desc: 'Artesanías, plantas y productos creados por emprendedores locales',
                color: 'bg-green-100 text-green-600'
              },
              {
                icon: Wrench,
                title: 'Servicios',
                desc: 'Pileta, jardinería, reparaciones y servicios dentro del barrio',
                color: 'bg-blue-100 text-blue-600'
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-14">
            Comprar en el barrio nunca fue tan simple
          </h2>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { step: '1', title: 'Registrate', desc: 'Creá tu cuenta y confirmá tu barrio' },
              { step: '2', title: 'Explorá', desc: 'Descubrí todo lo que ofrecen tus vecinos' },
              { step: '3', title: 'Pedí', desc: 'Hacé tu pedido sin buscar en grupos de WhatsApp' },
              { step: '4', title: 'Recibí', desc: 'Coordiná directo y recibí en tu casa' },
            ].map((item) => (
              <div key={item.step}>
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prueba social */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            El mercado interno del barrio ya empezó
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Cada vez más vecinos eligen comprar dentro del barrio.
            Cada vez más emprendedores eligen vender de forma más profesional.
            Pedite conecta todo en un solo lugar.
          </p>

          <Link
            href="/registro"
            className="inline-block px-8 py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Entrar al catálogo
          </Link>
        </div>
      </section>

      {/* CTA Emprendedores */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl p-10 md:p-14 text-center text-white">
          <Users className="w-16 h-16 mx-auto mb-6 text-cyan-200" />
          <h2 className="text-3xl font-bold mb-4">
            ¿Tenés un emprendimiento en el barrio?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Dejá de vender solo por WhatsApp.
            Mostrá tu catálogo ordenado, recibí pedidos claros y llegá a todos los vecinos de Pilar del Este desde un solo lugar.
            <br /><br />
            Más visibilidad. Más organización. Más ventas.
          </p>

          <Link
            href="/registro/emprendedor"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors"
          >
            Sumarme como emprendedor
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
