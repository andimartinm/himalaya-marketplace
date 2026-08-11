'use client';

import Image from 'next/image';
import Link from 'next/link';

interface FooterProps {
  variant?: 'dark' | 'light';
}

export function Footer({ variant = 'dark' }: FooterProps) {
  const isDark = variant === 'dark';
  
  return (
    <footer className={`${isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-600'} py-10 mt-12`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* 3 columnas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          {/* Columna 1: Pedite */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/logo-pedite-oficial.png"
                alt="Pedite"
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              El marketplace de tu barrio. Comidas, productos y servicios de tus vecinos emprendedores.
            </p>
          </div>

          {/* Columna 2: Comunidad */}
          <div>
            <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Comunidad</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalogo" className={`${isDark ? 'hover:text-teal-400' : 'hover:text-teal-600'} transition-colors`}>
                  Explorar productos
                </Link>
              </li>
              <li>
                <Link href="/comercios" className={`${isDark ? 'hover:text-teal-400' : 'hover:text-teal-600'} transition-colors`}>
                  Ver comercios
                </Link>
              </li>
              <li>
                <Link href="/registro/emprendedor" className={`${isDark ? 'hover:text-teal-400' : 'hover:text-teal-600'} transition-colors`}>
                  Quiero vender
                </Link>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/pedite.shop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'} transition-colors`}
                >
                  @pedite.shop
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legal */}
          <div>
            <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terminos" className={`${isDark ? 'hover:text-gray-200' : 'hover:text-gray-800'} transition-colors`}>
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className={`${isDark ? 'hover:text-gray-200' : 'hover:text-gray-800'} transition-colors`}>
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} pt-6`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              © 2026 Pedite.shop <span className="text-[10px] opacity-50 ml-1">v2.0</span>
            </p>
            <a
              href="https://himalaya.agency"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
            >
              <span>Desarrollado por</span>
              <Image
                src="https://i.postimg.cc/3R7cXtCL/himalaya-logo-clean-white.png"
                alt="Himalaya Agency"
                width={20}
                height={20}
                className={`h-4 w-auto object-contain ${isDark ? '' : 'invert'}`}
                unoptimized
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
