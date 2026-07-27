'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, User, Menu, X, LogOut, Package, Store, LayoutDashboard, HelpCircle, Grid3X3, ClipboardList, UserCircle, Users, CreditCard, MapPin, Tag, Settings, Building2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { ModeTransition } from './mode-transition';

export function Navbar() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionMode, setTransitionMode] = useState<'vecino' | 'emprendedor'>('vecino');
  const { items } = useCart();
  const user = session?.user as any;

  const itemCount = items?.reduce((sum, item) => sum + (item?.quantity ?? 0), 0) ?? 0;

  const openTidioChat = () => {
    if (typeof window !== 'undefined' && (window as any).tidioChatApi) {
      (window as any).tidioChatApi.open();
    }
  };

  const switchMode = (mode: 'vecino' | 'emprendedor', targetUrl: string) => {
    setTransitionMode(mode);
    setShowTransition(true);
    setMenuOpen(false);
    setTimeout(() => {
      router.push(targetUrl);
    }, 800);
  };

  return (
    <>
      <ModeTransition mode={transitionMode} show={showTransition} onComplete={() => setShowTransition(false)} />
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'EMPRENDEDOR' ? '/emprendedor' : '/catalogo'} className="flex items-center gap-2">
            <Image 
              src="/logo-pedite-oficial.png" 
              alt="Pedite" 
              width={120} 
              height={35} 
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav - lg breakpoint for tablets */}
          <nav className="hidden lg:flex items-center gap-4">
          {user?.role === 'VECINO' && (
            <>
              <Link href="/catalogo" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <Grid3X3 className="w-4 h-4" />
                Catálogo
              </Link>
              <Link href="/comercios" className="px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Comercios
              </Link>
              <Link href="/mis-pedidos" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <Package className="w-4 h-4" />
                Mis Pedidos
              </Link>
              <Link href="/mi-perfil" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <UserCircle className="w-4 h-4" />
                Mi Perfil
              </Link>
              <Link href="/carrito" className="relative px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                Carrito
                {itemCount > 0 && (
                  <span className="absolute -top-1 right-0 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
              {user?.emprendedorId && (
                <button 
                  onClick={() => switchMode('emprendedor', '/emprendedor')}
                  className="px-3 py-2 text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
                >
                  <Store className="w-4 h-4" />
                  Ventas
                </button>
              )}
              <button 
                onClick={openTidioChat}
                className="px-3 py-2 text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" />
                Ayuda
              </button>
            </>
          )}
          {user?.role === 'EMPRENDEDOR' && (
            <>
              <Link href="/emprendedor" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/carrito" className="relative px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                Carrito
                {itemCount > 0 && (
                  <span className="absolute -top-1 right-0 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
              {/* Hamburger menu for emprendedor desktop */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 text-gray-600 hover:text-teal-600 transition-colors"
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                    <Link href="/emprendedor/productos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50">
                      <Package className="w-4 h-4" />
                      Productos
                    </Link>
                    <Link href="/emprendedor/pedidos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50">
                      <ClipboardList className="w-4 h-4" />
                      Pedidos
                    </Link>
                    <Link href="/emprendedor/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50">
                      <UserCircle className="w-4 h-4" />
                      Perfil
                    </Link>
                    <Link href="/comercios" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-blue-50">
                      <Building2 className="w-4 h-4" />
                      Comercios
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => { switchMode('vecino', '/catalogo'); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-teal-600 hover:bg-teal-50"
                    >
                      <User className="w-4 h-4" />
                      Modo Vecino
                    </button>
                    <button 
                      onClick={() => { openTidioChat(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-teal-600 hover:bg-teal-50"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Ayuda
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Salir
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {user?.role === 'ADMIN' && (
            <>
              <Link href="/admin" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/admin/usuarios" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <Users className="w-4 h-4" />
                Usuarios
              </Link>
              <Link href="/admin/pedidos" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                Pedidos
              </Link>
              <Link href="/admin/emprendedores" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                Pagos
              </Link>
              <Link href="/admin/barrios" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Barrios
              </Link>
              <Link href="/admin/categorias" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Categorías
              </Link>
              <Link href="/admin/configuracion" className="px-3 py-2 text-gray-600 hover:text-teal-600 transition-colors flex items-center gap-1">
                <Settings className="w-4 h-4" />
                Config
              </Link>
            </>
          )}
          {user?.role !== 'EMPRENDEDOR' && (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-3 py-2 text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          )}
        </nav>

        {/* Mobile/Tablet: Cart + Menu buttons */}
        <div className="lg:hidden flex items-center gap-2">
          {user && user.role !== 'ADMIN' && (
            <Link href="/carrito" className="relative p-2 text-gray-600">
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-600"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-2">
            {user?.role === 'VECINO' && (
              <>
                <Link href="/catalogo" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Grid3X3 className="w-5 h-5" />
                  Catálogo
                </Link>
                <Link href="/comercios" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-blue-50 rounded-lg">
                  <Building2 className="w-5 h-5" />
                  Comercios
                </Link>
                <Link href="/mis-pedidos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Package className="w-5 h-5" />
                  Mis Pedidos
                </Link>
                <Link href="/mi-perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <UserCircle className="w-5 h-5" />
                  Mi Perfil
                </Link>
                {user?.emprendedorId && (
                  <button 
                    onClick={() => switchMode('emprendedor', '/emprendedor')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Store className="w-5 h-5" />
                    Modo Emprendedor
                  </button>
                )}
                <button 
                  onClick={() => { openTidioChat(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                >
                  <HelpCircle className="w-5 h-5" />
                  Ayuda
                </button>
              </>
            )}
            {user?.role === 'EMPRENDEDOR' && (
              <>
                <Link href="/emprendedor" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link href="/emprendedor/productos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Package className="w-5 h-5" />
                  Productos
                </Link>
                <Link href="/emprendedor/pedidos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <ClipboardList className="w-5 h-5" />
                  Pedidos
                </Link>
                <Link href="/emprendedor/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <UserCircle className="w-5 h-5" />
                  Perfil
                </Link>
                <Link href="/comercios" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-blue-50 rounded-lg">
                  <Building2 className="w-5 h-5" />
                  Comercios
                </Link>
                <button 
                  onClick={() => switchMode('vecino', '/catalogo')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Modo Vecino
                </button>
                <button 
                  onClick={() => { openTidioChat(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                >
                  <HelpCircle className="w-5 h-5" />
                  Ayuda
                </button>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link href="/admin/usuarios" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5" />
                  Usuarios
                </Link>
                <Link href="/admin/pedidos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <ClipboardList className="w-5 h-5" />
                  Pedidos
                </Link>
                <Link href="/admin/emprendedores" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                  Pagos
                </Link>
                <Link href="/admin/barrios" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5" />
                  Barrios
                </Link>
                <Link href="/admin/categorias" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Tag className="w-5 h-5" />
                  Categorías
                </Link>
                <Link href="/admin/configuracion" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Settings className="w-5 h-5" />
                  Configuración
                </Link>
              </>
            )}
            <button
              onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
    </>
  );
}
