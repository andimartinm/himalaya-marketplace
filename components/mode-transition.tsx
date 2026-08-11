'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ModeTransitionProps {
  mode: 'vecino' | 'emprendedor';
  show: boolean;
  onComplete: () => void;
}

export function ModeTransition({ mode, show, onComplete }: ModeTransitionProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f8f7f4] overflow-hidden"
        >
          {/* Curva amarilla arriba izquierda */}
          <div className="absolute top-0 left-0 w-[60%] h-[25%]">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,0 L0,100 Q50,80 100,0 Z" fill="#f5c518" />
            </svg>
          </div>

          {/* Curva verde abajo derecha */}
          <div className="absolute bottom-0 right-0 w-[50%] h-[20%]">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M100,100 L100,0 Q50,20 0,100 Z" fill="#4caf50" />
            </svg>
          </div>

          {/* Logo PEDITE centrado */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-col items-center z-10"
          >
            <div className="w-40 h-16 relative mb-4">
              <Image
                src="/logo-pedite-oficial.png"
                alt="Pedite"
                fill
                className="object-contain"
              />
            </div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="text-teal-700 text-xl font-semibold"
            >
              {mode === 'vecino' ? 'Modo Vecino' : 'Modo Emprendedor'}
            </motion.p>
          </motion.div>

          {/* Texto Pilar del Este abajo */}
          <div className="absolute bottom-20 z-10">
            <span className="text-gray-600 text-xl font-medium tracking-widest">
              MARKETPLACE PARA BARRIOS CERRADOS
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
