/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Check, CreditCard, ShieldCheck, X, Loader2, Award } from "lucide-react";

interface PricingModalProps {
  lang: 'en' | 'ar';
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: (newPlan: 'free' | 'pro' | 'api') => void;
}

export function PricingModal({ lang, isOpen, onClose, onUpgradeSuccess }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'api'>("pro");
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>("4242 •••• •••• 4242");
  const [cardHolder, setCardHolder] = useState<string>("MOHAMMED K.");
  const [expiry, setExpiry] = useState<string>("12/29");
  const [cvc, setCvc] = useState<string>("***");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const plans = {
    pro: {
      name_en: "Pro Premium VIP Plan",
      name_ar: "باقة المشتركين المحترفين VIP",
      cost: "$4.99",
      period_en: "per month",
      period_ar: "شهرياً",
      features_en: [
        "Create custom usernames and prefixes",
        "Unlock elite VIP domains (@boxmail.pro, @vmail.co)",
        "Zero advertisement block metrics",
        "Extended expires lifetime support (60 mins base)"
      ],
      features_ar: [
        "تخصيص كامل لأسماء المستخدمين والمقاطع",
        "وصول غير محدود للنطاقات الممتازة (@boxmail.pro, @vmail.co)",
        "تصفح نظيف وخالي من النوافذ الإعلانية تماماً",
        "دعم تمديد حياة البريد المؤقت حتى 60 دقيقة أساسية"
      ]
    },
    api: {
      name_en: "Developer High-Capacity API",
      name_ar: "باقة مبرمجي التطبيقات والاتصال البرمجي",
      cost: "$9.99",
      period_en: "per month",
      period_ar: "شهرياً",
      features_en: [
        "Support standard cURL / HTTP REST payloads",
        "Query up to 50 active temporary mail accounts in parallel",
        "Trigger custom domain rotations automatically",
        "Premium API key credentials panel integration"
      ],
      features_ar: [
        "أذن برمجية كاملة للاتصال وطلب cURL / HTTP REST",
        "توليد أكثر من 50 عنوان بريد مؤقت بالتوازي",
        "فحوصات تعقب بروتوكولات الخبراء (MIME Analysis)",
        "لوحة مخصصة لإدارة وتجديد مفاتيح المطورين الـ API"
      ]
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment connection with Stripe gateway
    setTimeout(async () => {
      try {
        // Log transaction success to server logging telemetry 
        await fetch("/api/generate-mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customTopic: "Subscription Receipt stripe: SmailPro Premium Payment Gateway Verified",
            addressId: "temp-sim-stripe",
            addressName: "billing-success@smail.pro"
          })
        });
      } catch (err) {
        console.error(err);
      }
      
      setIsProcessing(false);
      setSuccess(true);
      onUpgradeSuccess(selectedPlan);
      
      setTimeout(() => {
        setSuccess(false);
        setShowCheckout(false);
        onClose();
      }, 3000);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div id="pricing-modal-box" className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Close Button */}
        <button
          id="close-pricing-modal-btn"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          /* Payment success screen */
          <div id="checkout-success-view" className="p-10 text-center space-y-5 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/35 flex items-center justify-center animate-bounce-subtle">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100 font-sans">
                {lang === 'en' ? "Access Key Payment Verified Successfully!" : "تم الدفع وتنشيط الباقة الممتازة بنجاح!"}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm">
                {lang === 'en'
                  ? "Your account levels have been updated. Pro temporary domains and high-capacity developer endpoints are now unlocked."
                  : "تم ترقية مستويات الصلاحيات الخاصة بك على الخادم وسجلات Postgres. تم فك قفل النطاقات الممتازة VIP بنجاح."}
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/5 px-4 py-2 border border-emerald-500/15 rounded-full flex items-center gap-1.5 shadow-md">
              <Award className="w-4 h-4" />
              <span>{plans[selectedPlan].name_en} — ACTIVE</span>
            </div>
          </div>
        ) : showCheckout ? (
          /* Checkout Billing Frame */
          <form onSubmit={handlePaymentSubmit} className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <CreditCard className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-md font-bold text-slate-100">
                  {lang === 'en' ? "Secure Simulated Checkout Gateway" : "لوحة الدفع الآمنة المشفرة للمشتركين"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'en' ? "Integrated with Stripe Payments. No real money will be charged." : "مدعوم بواسطة بوابة Stripe التجريبية. لن يتم خصم أموال حقيقية."}
                </p>
              </div>
            </div>

            {/* Virtual Credit Card Graphics */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-xl p-5 shadow-lg border border-indigo-500/20 max-w-sm mx-auto font-mono text-xs">
              <div className="flex justify-between items-start mb-6">
                <span className="font-bold text-md italic text-indigo-300">SmailPro VIP</span>
                <span className="font-bold text-[10px] bg-slate-950/20 text-indigo-200 px-2 py-0.5 rounded uppercase tracking-widest leading-none">STRIPE</span>
              </div>
              <div className="space-y-4">
                <div className="text-base text-slate-100 font-bold tracking-widest">{cardNumber}</div>
                <div className="flex justify-between text-[10px] text-indigo-200 uppercase">
                  <div>
                    <span className="block text-[8px] text-indigo-400">Card Holder</span>
                    {cardHolder}
                  </div>
                  <div>
                    <span className="block text-[8px] text-indigo-400">Expires</span>
                    {expiry}
                  </div>
                  <div>
                    <span className="block text-[8px] text-indigo-400">CVC</span>
                    {cvc}
                  </div>
                </div>
              </div>
            </div>

            {/* Fields Inputs */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="col-span-2">
                <label className="block text-slate-400 uppercase text-[9px] mb-1">Card Holder Name</label>
                <input
                  id="card-holder-input"
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 uppercase text-[9px] mb-1">Card Number</label>
                <input
                  id="card-number-input"
                  type="text"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase text-[9px] mb-1">Expiry Date</label>
                <input
                  id="card-expiry-input"
                  type="text"
                  required
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase text-[9px] mb-1">CVC / Security Key</label>
                <input
                  id="card-cvc-input"
                  type="password"
                  required
                  maxLength={3}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400">{lang === 'en' ? "Subscription Fee:" : "قيمة الاشتراك المستحق:"}</span>
              <span className="text-base font-bold text-slate-100 font-mono">{plans[selectedPlan].cost}</span>
            </div>

            {/* Back CTA */}
            <div className="flex justify-between items-center gap-3">
              <button
                id="back-checkout-btn"
                type="button"
                onClick={() => setShowCheckout(false)}
                disabled={isProcessing}
                className="text-xs font-semibold hover:underline text-slate-400 hover:text-slate-100 cursor-pointer disabled:opacity-50"
              >
                {lang === 'en' ? "Go Back" : "تراجع للمقارنة"}
              </button>
              <button
                id="payment-submit-btn"
                type="submit"
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold px-5 py-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {isProcessing ? (lang === 'en' ? "Authenticating Transaction..." : "جاري فحص وتأكيد المعاملة...") : (lang === 'en' ? "Complete VIP Activation" : "تأكيد الدفع والتفعيل")}
              </button>
            </div>
          </form>
        ) : (
          /* Selection frame */
          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2 mb-4">
              <div className="inline-flex p-2.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight font-sans">
                {lang === 'en' ? "Upgrade to SmailPro Premium Track" : "ترقية الحساب وحجز النطاقات المخصصة"}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {lang === 'en' ? "Activate high-level filters, VIP temporary domain pools, and standard developers REST API access." : "أتمِت أعمالك بأعلى كفاءة، والغي فترات الانتظار واحصل على تخصيص كامل لمسارات الاستقبال."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              {/* Option A: PRO PLAN */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-5 transition-all cursor-pointer ${
                selectedPlan === "pro" 
                  ? "bg-slate-950/60 border-indigo-500 ring-1 ring-indigo-500/50" 
                  : "bg-slate-950/20 border-slate-800 hover:border-slate-700"
              }`} onClick={() => setSelectedPlan("pro")}>
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded font-bold">PRO ACCOUNT</span>
                  <h3 className="font-bold text-slate-100">{lang === 'en' ? plans.pro.name_en : plans.pro.name_ar}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold text-slate-100 font-mono">{plans.pro.cost}</span>
                    <span className="text-[10px] text-slate-500 font-mono">/{(lang === 'en' ? plans.pro.period_en : plans.pro.period_ar)}</span>
                  </div>
                  
                  <ul className="text-xs text-slate-400 space-y-1.5 pt-3 border-t border-slate-900 leading-relaxed">
                    {(lang === 'en' ? plans.pro.features_en : plans.pro.features_ar).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Option B: API PLAN */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-5 transition-all cursor-pointer ${
                selectedPlan === "api" 
                  ? "bg-slate-950/60 border-indigo-500 ring-1 ring-indigo-500/50" 
                  : "bg-slate-950/20 border-slate-800 hover:border-slate-700"
              }`} onClick={() => setSelectedPlan("api")}>
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded font-bold">DEVELOPER REST</span>
                  <h3 className="font-bold text-slate-100">{lang === 'en' ? plans.api.name_en : plans.api.name_ar}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold text-slate-100 font-mono">{plans.api.cost}</span>
                    <span className="text-[10px] text-slate-500 font-mono">/{(lang === 'en' ? plans.api.period_en : plans.api.period_ar)}</span>
                  </div>
                  
                  <ul className="text-xs text-slate-400 space-y-1.5 pt-3 border-t border-slate-900 leading-relaxed">
                    {(lang === 'en' ? plans.api.features_en : plans.api.features_ar).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Checkout Trigger */}
            <div className="pt-2">
              <button
                id="activate-plan-checkout-btn"
                onClick={() => setShowCheckout(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{lang === 'en' ? `Proceed with payment of ${plans[selectedPlan].cost}` : `المتابعة لخطوات إلقاء الدفع بقيمة ${plans[selectedPlan].cost}`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
