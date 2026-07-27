import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Términos y Condiciones - Pedite',
  description: 'Términos y condiciones de uso de la plataforma Pedite',
};

export default function TerminosPage() {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Términos y Condiciones</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 text-gray-600 leading-relaxed">
          <p className="text-sm text-gray-400">Última actualización: Febrero 2026</p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar la plataforma Pedite, usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Descripción del Servicio</h2>
            <p>Pedite es una plataforma digital que conecta a vecinos de comunidades cerradas con emprendedores locales, facilitando la compra y venta de productos y servicios dentro de la comunidad. La plataforma actúa únicamente como intermediario tecnológico.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Registro de Usuarios</h2>
            <p>Para utilizar los servicios de Pedite, los usuarios deben registrarse proporcionando información veraz y actualizada. Los usuarios son responsables de mantener la confidencialidad de sus credenciales de acceso.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Usuarios Emprendedores</h2>
            <p>Los emprendedores que deseen ofrecer productos o servicios a través de la plataforma deben cumplir con todas las normativas locales aplicables. Pedite no es responsable por la calidad, legalidad o disponibilidad de los productos o servicios ofrecidos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Suscripciones y Pagos</h2>
            <p>Los emprendedores están sujetos a una suscripción mensual para mantener su perfil activo en la plataforma. Los pagos realizados no son reembolsables, salvo disposición legal en contrario.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Transacciones entre Usuarios</h2>
            <p>Las transacciones comerciales se realizan directamente entre compradores y vendedores. Pedite no participa en las transacciones económicas ni es responsable por disputas, reclamos o problemas derivados de las mismas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Conducta del Usuario</h2>
            <p>Los usuarios se comprometen a utilizar la plataforma de manera responsable, sin publicar contenido ofensivo, fraudulento o que viole derechos de terceros. Pedite se reserva el derecho de suspender o eliminar cuentas que incumplan estas normas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Propiedad Intelectual</h2>
            <p>Todo el contenido de la plataforma, incluyendo logos, diseños y código, es propiedad de Himalaya Agency o sus licenciantes. Los usuarios conservan los derechos sobre el contenido que publican.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Limitación de Responsabilidad</h2>
            <p>Pedite proporciona la plataforma "tal cual" y no garantiza su disponibilidad ininterrumpida. En ningún caso seremos responsables por daños indirectos, incidentales o consecuentes derivados del uso del servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor al momento de su publicación. El uso continuado del servicio constituye aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Contacto</h2>
            <p>Para consultas sobre estos términos, puede contactarnos a través del chat de soporte disponible en la plataforma.</p>
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
