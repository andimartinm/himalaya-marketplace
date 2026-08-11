'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Utensils, Package, Wrench, Menu, X, ArrowRight, Star, ShoppingBag, Smartphone, Store, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/footer';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const screenshots = [
  { src: '/screens/IMG_2497.PNG', alt: 'Catálogo de productos' },
  { src: '/screens/IMG_2498.PNG', alt: 'Servicios del barrio' },
  { src: '/screens/IMG_2499.PNG', alt: 'Carrito de compras' },
  { src: '/screens/IMG_2500.PNG', alt: 'Métodos de pago' },
  { src: '/screens/IMG_2502.PNG', alt: 'Detalle de producto' },
  { src: '/screens/IMG_2509.PNG', alt: 'Detalle de servicio' },
];

function PhoneMockup({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden">
          <div className="bg-gray-100 h-6 flex items-center justify-center">
            <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
          </div>
          <Image
            src={src}
            alt={alt}
            width={280}
            height={600}
            className="w-full h-auto"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreenshot((prev) => (prev + 1) % screenshots.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-pedite-oficial.png" alt="Pedite" width={140} height={40} className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="px-3 sm:px-4 py-2 text-gray-700 hover:text-teal-600 rounded-lg transition-colors text-sm sm:text-base font-medium">
              Ingresar
            </Link>
            <Link href="/registro" className="hidden sm:block px-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-all hover:shadow-lg hover:shadow-teal-600/25">
              Registrarme
            </Link>
            <Link href="/registro/empresa" className="hidden sm:block px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/25">
              Empresa
            </Link>
            <div className="sm:hidden relative z-[100]">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-[220px] z-[100]"
                  >
                    <Link href="/registro" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      Registrarme
                    </Link>
                    <Link href="/registro/empresa" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-blue-600 hover:bg-blue-50 font-medium transition-colors">
                      Registro Empresa
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-cyan-50" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center md:text-left">
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-base font-bold shadow-lg shadow-green-500/30 animate-pulse">
                  <Zap className="w-5 h-5" />
                  GRATIS — Sin costo oculto
                </span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Tu barrio ya está{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500">
                  vendiendo distinto
                </span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
                Descubrí comidas, productos y servicios de tus propios vecinos en un solo lugar.
                Más fácil para comprar. Más profesional para vender. <strong className="text-green-600">Totalmente gratis.</strong>
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/registro"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-teal-600/25 transition-all"
                >
                  Explorar el barrio
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/registro/emprendedor"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-2xl font-semibold text-lg border-2 border-teal-100 hover:border-teal-200 hover:shadow-lg transition-all"
                >
                  <Store className="w-5 h-5" />
                  Quiero vender
                </Link>
              </motion.div>
            </motion.div>

            {/* Phone carousel */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-[3rem] blur-2xl opacity-20" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeScreenshot}
                    initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                    transition={{ duration: 0.5 }}
                  >
                    <PhoneMockup
                      src={screenshots[activeScreenshot].src}
                      alt={screenshots[activeScreenshot].alt}
                      className="w-[280px] md:w-[300px]"
                    />
                  </motion.div>
                </AnimatePresence>
                {/* Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {screenshots.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreenshot(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeScreenshot ? 'bg-teal-600 w-6' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Social proof bar */}
      <section className="py-6 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            {[
              { value: '100+', label: 'Productos' },
              { value: '50+', label: 'Emprendedores' },
              { value: '5+', label: 'Barrios' },
              { value: 'Gratis', label: 'Por tiempo limitado', highlight: true },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className={`text-2xl md:text-3xl font-bold ${stat.highlight ? 'text-green-600' : 'text-teal-600'}`}>{stat.value}</span>
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <AnimatedSection className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4">Categorías</span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Todo en un solo lugar
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comidas, productos artesanales y servicios profesionales de tus vecinos del barrio
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Utensils, title: 'Comidas', desc: 'Viandas caseras, pastelería y comidas hechas por vecinos del barrio', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50' },
              { icon: Package, title: 'Productos', desc: 'Artesanías, plantas y productos creados por emprendedores locales', color: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
              { icon: Wrench, title: 'Servicios', desc: 'Pileta, jardinería, reparaciones y servicios dentro del barrio', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50' },
            ].map((item) => (
              <motion.div key={item.title} variants={scaleIn} className={`${item.bg} rounded-3xl p-8 hover:shadow-xl transition-shadow`}>
                <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* How it works */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-4">¿Cómo funciona?</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Comprar en el barrio nunca fue tan simple
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Registrate', desc: 'Creá tu cuenta y confirmá tu barrio', icon: Users, color: 'from-teal-500 to-cyan-500' },
                { step: '2', title: 'Explorá', desc: 'Descubrí todo lo que ofrecen tus vecinos', icon: ShoppingBag, color: 'from-emerald-500 to-green-500' },
                { step: '3', title: 'Pedí', desc: 'Hacé tu pedido sin buscar en grupos de WhatsApp', icon: Package, color: 'from-blue-500 to-indigo-500' },
                { step: '4', title: 'Recibí', desc: 'Coordiná directo y recibí en tu casa', icon: Star, color: 'from-purple-500 to-pink-500' },
              ].map((item) => (
                <motion.div key={item.step} variants={fadeUp} className="text-center relative">
                  <div className={`w-16 h-16 bg-gradient-to-r ${item.color} text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-lg`}>
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* App showcase */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">La app</span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                Todo lo que necesitás, en tu celular
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explorá productos, hacé pedidos y pagá desde tu casa
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {screenshots.slice(0, 3).map((shot, i) => (
                <motion.div
                  key={shot.src}
                  variants={scaleIn}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group"
                >
                  <PhoneMockup src={shot.src} alt={shot.alt} className="w-[220px] md:w-[250px]" />
                  <p className="text-center text-sm text-gray-500 mt-4 group-hover:text-teal-600 transition-colors">{shot.alt}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-teal-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                El mercado interno del barrio ya empezó
              </h2>
              <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
                Cada vez más vecinos eligen comprar dentro del barrio.
                Cada vez más emprendedores eligen vender de forma más profesional.
                Pedite conecta todo en un solo lugar.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all"
              >
                Entrar al catálogo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Emprendedores */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">Emprendedores</span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                  ¿Tenés un emprendimiento en el barrio?
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Dejá de vender solo por WhatsApp. Mostrá tu catálogo ordenado, recibí pedidos claros y llegá a todos los vecinos desde un solo lugar.
                </p>
                <ul className="space-y-4 mb-8">
                  {['100% gratis — sin costos ocultos', 'Catálogo profesional con fotos', 'Pedidos organizados y claros', 'Alcance a todos los vecinos del barrio'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro/emprendedor"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-teal-600/25 transition-all"
                >
                  Sumarme gratis como emprendedor
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="flex justify-center">
                <PhoneMockup src="/screens/IMG_2497.PNG" alt="Panel de emprendedor" className="w-[280px] md:w-[320px]" />
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
