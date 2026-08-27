import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, Order } from '../../api/orders.api';
import { Bell, ArrowRight, X, ShoppingBag } from 'lucide-react';

// Web Audio API chime bell synthesizer (no external audio asset required)
const playNewOrderChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // 3-note ascending order bell chime (C5 -> E5 -> G5)
    playNote(523.25, 0, 0.4);
    playNote(659.25, 0.15, 0.4);
    playNote(783.99, 0.3, 0.6);
  } catch (err) {
    console.log('Audio playback error:', err);
  }
};

export const OrderNotificationListener: React.FC = () => {
  const navigate = useNavigate();
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());
  const [activeAlert, setActiveAlert] = useState<Order | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isInitialFetch = true;

    const checkNewOrders = async () => {
      try {
        const orders = await ordersApi.getAll();
        if (!orders || !Array.isArray(orders)) return;

        const currentIds = new Set(orders.map((o) => o.id));

        if (isInitialFetch) {
          setKnownOrderIds(currentIds);
          isInitialFetch = false;
          return;
        }

        // Find newly placed orders
        const newOrders = orders.filter(
          (o) => !knownOrderIds.has(o.id) && o.status === 'PLACED'
        );

        if (newOrders.length > 0) {
          const latest = newOrders[0]!;
          setActiveAlert(latest);
          setUnreadCount((prev) => prev + newOrders.length);
          playNewOrderChime();
        }

        setKnownOrderIds((prev) => {
          const updated = new Set(prev);
          orders.forEach((o) => updated.add(o.id));
          return updated;
        });
      } catch (err) {
        console.log('Error checking new admin orders:', err);
      }
    };

    checkNewOrders();
    const interval = setInterval(checkNewOrders, 5000);
    return () => clearInterval(interval);
  }, [knownOrderIds]);

  return (
    <>
      {/* Top Right Floating Alert Toast */}
      {activeAlert && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl max-w-sm w-full flex items-start gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <ShoppingBag className="w-6 h-6 animate-bounce" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  🔔 New Order Received!
                </span>
                <button
                  onClick={() => setActiveAlert(null)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm font-bold text-white mt-1">
                Order #{activeAlert.id.slice(-6).toUpperCase()}
              </p>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                Customer: {activeAlert.customer?.name || 'Guest'}
              </p>
              <p className="text-xs text-emerald-400 font-bold mt-1">
                Total: ₹{activeAlert.totalAmount} • {activeAlert.items?.length || 1} Item(s)
              </p>

              <button
                onClick={() => {
                  setActiveAlert(null);
                  navigate('/orders');
                }}
                className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-amber-500/20"
              >
                View Order & Accept <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
