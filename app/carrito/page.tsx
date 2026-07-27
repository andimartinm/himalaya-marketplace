'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, Truck, MapPin, FileText, Loader2, CheckCircle, Tag, X } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { createWhatsAppLink } from '@/lib/phone-utils';
import { Footer } from '@/components/footer';

export default function CarritoPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { items, emprendedorId, updateQuantity, removeItem, clearCart, getTotal } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO'>('EFECTIVO');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentProofKey, setPaymentProofKey] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [emprendedorConfig, setEmprendedorConfig] = useState<any>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discountPercent: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (emprendedorId) {
      fetch(`/api/emprendedor/${emprendedorId}`)
        .then(res => res.json())
        .then(data => {
          setEmprendedorConfig(data);
          if (data?.deliveryMethodsList?.length > 0) {
            setAvailableMethods(data.deliveryMethodsList);
            if (!deliveryMethod || !data.deliveryMethodsList.includes(deliveryMethod)) {
              setDeliveryMethod(data.deliveryMethodsList[0]);
            }
          } else {
            setAvailableMethods(['ENTREGA_PROPIA']);
            setDeliveryMethod('ENTREGA_PROPIA');
          }
        })
        .catch(err => console.error('Error fetching emprendedor config', err));
    }
  }, [emprendedorId, deliveryMethod]);

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxWidth = 1024;
      const quality = 0.8;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Error al comprimir imagen'));
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 10MB');
      return;
    }

    setUploadingProof(true);
    try {
      let fileToUpload: File;
      let contentType = 'image/jpeg';
      let fileName = `${Date.now()}-comprobante.jpg`;

      try {
        const compressedBlob = await compressImage(file);
        fileToUpload = new File([compressedBlob], fileName, { type: contentType });
      } catch (compressionError) {
        console.log('Compression failed, uploading original:', compressionError);
        fileToUpload = file;
        contentType = file.type || 'image/jpeg';
        fileName = file.name || fileName;
      }

      const res = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          contentType,
          isPublic: false,
        }),
      });

      if (!res.ok) throw new Error('Error al obtener URL de subida');
      const { uploadUrl, cloud_storage_path, publicUrl } = await res.json();

      const urlParams = new URLSearchParams(uploadUrl.split('?')[1]);
      const signedHeaders = urlParams.get('X-Amz-SignedHeaders') || '';
      const headers: Record<string, string> = { 'Content-Type': contentType };

      if (signedHeaders.includes('content-disposition')) {
        headers['Content-Disposition'] = 'attachment';
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: fileToUpload,
      });

      if (!uploadRes.ok) throw new Error('Error al subir el archivo al servidor');

      setPaymentProofUrl(publicUrl);
      setPaymentProofKey(cloud_storage_path);
      toast.success('Comprobante subido correctamente');
    } catch (error) {
      toast.error('Error al subir el comprobante');
      console.error(error);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error('Ingresá un código de cupón');
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: total }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Cupón inválido');
        return;
      }
      setAppliedCoupon({ id: data.couponId, code: data.code, discountPercent: data.discountPercent });
      toast.success(`¡Cupón aplicado! ${data.discountPercent}% de descuento`);
    } catch {
      toast.error('Error al validar cupón');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleSubmit = async () => {
    if (!items || items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (paymentMethod === 'TRANSFERENCIA' && !paymentProofUrl) {
      toast.error('Por favor subí un comprobante de transferencia');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productoId: item?.productoId,
            quantity: item?.quantity,
            price: item?.price,
          })),
          emprendedorId,
          deliveryMethod,
          deliveryAddress,
          notes,
          paymentMethod,
          paymentProofUrl,
          paymentProofKey,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Error al crear pedido');
        return;
      }

      clearCart();
      setSuccessOrder(data);
      setSuccess(true);
    } catch (error) {
      toast.error('Error al crear pedido');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Pedido confirmado!</h1>
            <p className="text-gray-600 mb-6">
              Tu pedido fue enviado al emprendedor.
              {successOrder?.paymentMethod === 'TRANSFERENCIA'
                ? ' Revisarán tu comprobante de pago y prepararán tu pedido para entregarlo.'
                : ' Te contactarán para coordinar el pago y la entrega.'}
            </p>

            {successOrder?.paymentMethod === 'EFECTIVO' && successOrder?.emprendedor?.user?.phone && (
              <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm text-green-800 mb-3">Elegiste pago en efectivo. Coordiná la entrega y el pago directamente por WhatsApp:</p>
                <a
                  href={createWhatsAppLink(successOrder.emprendedor.user.phone, `Hola! Acabo de hacer un pedido en Pedite (Efectivo). Mi nombre es ${user?.name || user?.fullName || 'Cliente'}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl font-medium hover:bg-[#128C7E] transition-colors"
                >
                  Confirmar por WhatsApp
                </a>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/mis-pedidos"
                className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                Ver mis pedidos
              </Link>
              <Link
                href="/catalogo"
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Seguir explorando
              </Link>
            </div>
          </motion.div>
        </div>
        <Footer variant="light" />
      </div>
    );
  }

  const total = getTotal?.() || 0;
  const discountAmount = appliedCoupon ? Math.round(total * appliedCoupon.discountPercent / 100) : 0;
  const finalTotal = total - discountAmount;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-teal-600" />
          Tu carrito
        </h1>

        {!items || items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
            <Link
              href="/catalogo"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Items */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500 mb-4">Comprando a: <span className="font-medium text-gray-700">{items[0]?.emprendedorName}</span></p>

                <div className="space-y-4">
                  {items.map((item, i) => (
                    <motion.div
                      key={item?.productoId ?? i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item?.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{item?.name}</h3>
                        <p className="text-teal-600 font-semibold">${item?.price?.toLocaleString('es-AR')}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => item?.productoId && updateQuantity(item.productoId, (item?.quantity || 1) - 1)}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item?.quantity}</span>
                          <button
                            onClick={() => item?.productoId && updateQuantity(item.productoId, (item?.quantity || 1) + 1)}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => item?.productoId && removeItem(item.productoId)}
                            className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Delivery options */}
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-600" />
                  Método de entrega
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'ENTREGA_PROPIA', label: 'A domicilio' },
                    { value: 'RETIRO_DOMICILIO', label: 'En el domicilio/local del emprendedor' },
                    { value: 'PUNTO_ENCUENTRO', label: 'A coordinar' },
                  ]
                    .filter(opt => availableMethods.includes(opt.value))
                    .map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="delivery"
                          value={opt.value}
                          checked={deliveryMethod === opt.value}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          className="w-4 h-4 text-teal-600"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  {availableMethods.length === 0 && (
                    <p className="text-gray-500 text-sm">Consultar métodos de entrega al emprendedor.</p>
                  )}
                </div>

                {deliveryMethod !== 'RETIRO_DOMICILIO' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {deliveryMethod === 'PUNTO_ENCUENTRO' ? 'Punto de encuentro' : 'Dirección de entrega'}
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ej: Barrio Santa María, Lote 123"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Notas adicionales
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucciones especiales, horarios preferidos..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Payment options */}
              {emprendedorConfig && (
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    💳 Método de pago
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {emprendedorConfig.acceptsCash && (
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'EFECTIVO' ? 'border-teal-600 bg-teal-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value="EFECTIVO"
                          checked={paymentMethod === 'EFECTIVO'}
                          onChange={() => setPaymentMethod('EFECTIVO')}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'EFECTIVO' ? 'border-teal-600' : 'border-gray-300'}`}>
                          {paymentMethod === 'EFECTIVO' && <div className="w-2.5 h-2.5 bg-teal-600 rounded-full" />}
                        </div>
                        <span className="font-medium text-gray-800">Efectivo</span>
                      </label>
                    )}

                    {(emprendedorConfig.bankAlias || emprendedorConfig.bankCbu) && (
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'TRANSFERENCIA' ? 'border-teal-600 bg-teal-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value="TRANSFERENCIA"
                          checked={paymentMethod === 'TRANSFERENCIA'}
                          onChange={() => setPaymentMethod('TRANSFERENCIA')}
                          className="hidden"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'TRANSFERENCIA' ? 'border-teal-600' : 'border-gray-300'}`}>
                          {paymentMethod === 'TRANSFERENCIA' && <div className="w-2.5 h-2.5 bg-teal-600 rounded-full" />}
                        </div>
                        <span className="font-medium text-gray-800">Transferencia</span>
                      </label>
                    )}
                  </div>

                  {paymentMethod === 'TRANSFERENCIA' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-gray-50 rounded-xl space-y-4 overflow-hidden border border-gray-200"
                    >
                      <div className="space-y-2 text-sm text-gray-700">
                        <p className="font-medium">Datos bancarios del emprendedor:</p>
                        {emprendedorConfig.bankAlias && (
                          <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                            <span>Alias: <strong>{emprendedorConfig.bankAlias}</strong></span>
                            <button onClick={() => { navigator.clipboard.writeText(emprendedorConfig.bankAlias); toast.success('Alias copiado'); }} className="text-teal-600 text-xs font-semibold px-2 py-1 bg-teal-50 rounded hover:bg-teal-100">Copiar</button>
                          </div>
                        )}
                        {emprendedorConfig.bankCbu && (
                          <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100">
                            <span>CBU: <strong>{emprendedorConfig.bankCbu}</strong></span>
                            <button onClick={() => { navigator.clipboard.writeText(emprendedorConfig.bankCbu); toast.success('CBU copiado'); }} className="text-teal-600 text-xs font-semibold px-2 py-1 bg-teal-50 rounded hover:bg-teal-100">Copiar</button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante de pago</label>
                        {paymentProofUrl ? (
                          <div className="relative group rounded-lg overflow-hidden border border-gray-200 h-32 bg-white flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={paymentProofUrl} alt="Comprobante" className="max-h-full max-w-full object-contain" />
                            <button
                              onClick={() => { setPaymentProofUrl(''); setPaymentProofKey(''); }}
                              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-teal-500 transition-colors bg-white">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {uploadingProof ? (
                                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                              ) : (
                                <p className="text-sm font-medium text-gray-600">Subir comprobante</p>
                              )}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleProofUpload}
                              disabled={uploadingProof}
                            />
                          </label>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Requerido para confirmar el pedido por transferencia.</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
                <h3 className="font-semibold text-gray-800 mb-4">Resumen del pedido</h3>

                <div className="space-y-2 text-sm">
                  {items.map((item, i) => (
                    <div key={item?.productoId ?? i} className="flex justify-between">
                      <span className="text-gray-600">{item?.quantity}x {item?.name}</span>
                      <span className="font-medium">${((item?.price || 0) * (item?.quantity || 0)).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon input */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {appliedCoupon.code} (-{appliedCoupon.discountPercent}%)
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="p-1 text-green-600 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Código de cupón"
                        className="flex-1 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="px-4 py-2.5 bg-gray-800 text-white text-sm rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {appliedCoupon ? (
                    <>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>${total?.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Descuento ({appliedCoupon.discountPercent}%)</span>
                        <span>-${discountAmount.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-1">
                        <span>Total</span>
                        <span className="text-teal-600">${finalTotal.toLocaleString('es-AR')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-teal-600">${total?.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !deliveryMethod}
                  className="w-full mt-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar pedido'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer variant="light" />
    </div>
  );
}
