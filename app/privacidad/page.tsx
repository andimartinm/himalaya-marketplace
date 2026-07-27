import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Pedite',
  description: 'Política de privacidad y protección de datos de Pedite',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Image src="/logo-pedite-oficial.png" alt="Pedite" width={120} height={35} className="h-9 w-auto object-contain" />
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Política de Privacidad</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 text-gray-600 leading-relaxed">
          <p className="text-sm text-gray-400">Última actualización: Febrero 2026</p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Información que Recopilamos</h2>
            <p>Recopilamos información que usted nos proporciona directamente al registrarse y usar la plataforma, incluyendo:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Barrio y número de lote</li>
              <li>DNI (para emprendedores)</li>
              <li>Información de productos y servicios ofrecidos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Uso de la Información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Proporcionar, mantener y mejorar nuestros servicios</li>
              <li>Procesar y completar transacciones</li>
              <li>Enviar notificaciones relacionadas con pedidos</li>
              <li>Responder a consultas y solicitudes de soporte</li>
              <li>Verificar la identidad de los usuarios</li>
              <li>Prevenir actividades fraudulentas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Compartición de Información</h2>
            <p>Compartimos información personal únicamente en las siguientes circunstancias:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Con otros usuarios para facilitar transacciones (nombre, teléfono, barrio)</li>
              <li>Con proveedores de servicios que nos asisten en la operación</li>
              <li>Cuando sea requerido por ley o autoridades competentes</li>
              <li>Para proteger nuestros derechos y seguridad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Seguridad de los Datos</h2>
            <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por Internet es 100% seguro.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Retención de Datos</h2>
            <p>Conservamos su información personal mientras su cuenta esté activa o sea necesaria para proporcionarle servicios. Puede solicitar la eliminación de su cuenta en cualquier momento.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Sus Derechos</h2>
            <p>Usted tiene derecho a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Acceder a su información personal</li>
              <li>Rectificar datos inexactos</li>
              <li>Solicitar la eliminación de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
              <li>Solicitar la portabilidad de sus datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Cookies y Tecnologías Similares</h2>
            <p>Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de la plataforma y personalizar contenido. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Servicios de Terceros</h2>
            <p>Nuestra plataforma puede contener enlaces a servicios de terceros (como WhatsApp para comunicación). No somos responsables por las prácticas de privacidad de estos servicios externos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Cambios a esta Política</h2>
            <p>Podemos actualizar esta política de privacidad periódicamente. Le notificaremos sobre cambios significativos publicando la nueva política en esta página con una fecha de actualización revisada.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contacto</h2>
            <p>Si tiene preguntas sobre esta política de privacidad o sobre cómo manejamos sus datos, puede contactarnos a través del chat de soporte disponible en la plataforma.</p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-teal-600 hover:underline">← Volver al inicio</Link>
        </div>
      </main>

      <Footer variant="light" />
    </div>
  );
}
