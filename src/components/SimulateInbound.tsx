/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Terminal, Mail, Send, Cpu, Check, AlertCircle } from "lucide-react";

interface SimulateInboundProps {
  lang: 'en' | 'ar';
  activeAddressId: string | null;
  activeAddressName: string | null;
  onMailInboundReceived: (newMail: any) => void;
  triggerLogsUpdate: () => void;
}

export function SimulateInbound({
  lang,
  activeAddressId,
  activeAddressName,
  onMailInboundReceived,
  triggerLogsUpdate
}: SimulateInboundProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("netflix");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const presets = [
    { id: "netflix", label_en: "Netflix Signup Verification", label_ar: "كود التحقق من نتفليكس", brand: "Netflix" },
    { id: "github", label_en: "GitHub Security Alert Key", label_ar: "تنبيه أمان مبرمج من جيت هاب", brand: "GitHub" },
    { id: "stripe", label_en: "Stripe Monthly SaaS Invoice", label_ar: "فاتورة اشتراك من سترايب", brand: "Stripe" }
  ];

  const triggerInbound = async (useGemini: boolean) => {
    if (!activeAddressId) {
      alert(lang === 'en' ? "Please generate a temporary email address to receive emails first!" : "برجاء إنشاء عنوان بريد مؤقت أولاً لاستقبال الرسائل!");
      return;
    }

    setIsInjecting(true);
    setSuccessToast(null);

    try {
      const payload: Record<string, any> = {
        addressId: activeAddressId,
        addressName: activeAddressName
      };

      if (useGemini) {
        if (!customTopic.trim()) {
          alert(lang === 'en' ? "Please type a brand name or email description!" : "برجاء كتابة الخدمة أو عنوان البريد الإلكتروني المطلوب محاكاته!");
          setIsInjecting(false);
          return;
        }
        payload.customTopic = customTopic;
      } else {
        payload.selectedPreset = selectedPreset;
      }

      const response = await fetch("/api/generate-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("SMTP relay simulator was unable to compile the transmission");
      }

      const newMail = await response.json();
      onMailInboundReceived(newMail);
      triggerLogsUpdate();
      
      setSuccessToast(
        lang === 'en' 
          ? `Inbound SMTP Relay Delivered: "${newMail.subject}"` 
          : `تم توصيل الرسالة بنجاح عبر بروتوكول SMTP: "${newMail.subject}"`
      );
      
      // clear AI field
      if (useGemini) {
        setCustomTopic("");
      }

      // auto-clear success toast
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (e: any) {
      alert(`Simulation injection failed: ${e.message}`);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div id="smtp-inbound-wizard" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
          <Sparkles className="text-indigo-400 w-5 h-5" />
          {lang === 'en' ? "Simulate Inbound SMTP Mail / MX Test" : "صندوق محاكاة وضخ رسائل SMTP الواردة"}
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {lang === 'en'
            ? "Since this sandboxed environment has no real dynamic external MX registers, trigger simulated web transmissions directly. Choose a high-accuracy preset or let Gemini AI customize HTML structures on-the-fly."
            : "محاكاة فورية لتدفق البريد الموجه لصندوقك. يمكنك تفعيل قوالب الحماية الجاهزة أو توظيف Gemini AI لإنشاء رسالة HTML مخصصة بالكامل لأي سيناريو بريدي ترغب فيه."}
        </p>
      </div>

      {/* Target Recipient Alert */}
      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono text-slate-400">
            {lang === 'en' ? "ACTIVE RECIPIENT TARGET:" : "البريد المستهدف النشط:"}
          </span>
          <span className="text-xs font-mono font-bold text-slate-100 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {activeAddressName || (lang === 'en' ? "None - Create an address first!" : "لا يوجد - أنشئ بريداً أولاً!")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Quick Presets */}
        <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-4">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
            {lang === 'en' ? "OPTION A: BRAND PRESETS" : "الخيار أ: قوالب الشركات الجاهزة"}
          </span>

          <div className="space-y-2">
            {presets.map((preset) => (
              <label
                key={preset.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPreset === preset.id 
                    ? "bg-slate-900 border-indigo-500/80 text-slate-100" 
                    : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900/40"
                }`}
              >
                <input
                  id={`preset-radio-${preset.id}`}
                  type="radio"
                  name="presetSelection"
                  value={preset.id}
                  checked={selectedPreset === preset.id}
                  onChange={() => setSelectedPreset(preset.id)}
                  className="accent-indigo-500"
                />
                <div className="text-xs font-semibold">
                  {lang === 'en' ? preset.label_en : preset.label_ar}
                </div>
              </label>
            ))}
          </div>

          <button
            id="inject-preset-mail-btn"
            onClick={() => triggerInbound(false)}
            disabled={isInjecting || !activeAddressId}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-250 hover:text-slate-100 border border-slate-700 font-bold px-4 py-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {lang === 'en' ? "Inject Preset Message" : "ضخ قالب الرسالة الفوري"}
          </button>
        </div>

        {/* Right Column: AI Custom Gemini */}
        <div id="ai-generator-panel" className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">
              {lang === 'en' ? "OPTION B: DYNAMIC GEMINI PAYLOAD" : "الخيار ب: توليد ذكي عبر Gemini AI"}
            </span>
            <label className="block text-slate-400 text-xs mb-2">
              {lang === 'en' 
                ? "Describe any email topic. Gemini will write customized HTML tables, validation headers, subject lines, and senders based on your prompt." 
                : "اكتب وصفاً للرسالة المطلوبة (مثال: تنبيه كلمة مرور من فيسبوك أو فاتورة AWS). سيعمل نموذج Gemini 3.5-flash على فبركة كافة تفاصيل الرسالة بصيغة HTML مذهلة."}
            </label>
            <textarea
              id="ai-email-description-input"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder={lang === 'en' ? "e.g., Zoom conference link with table passwords..." : "مثال: إشعار ترحيب من سلاك يحتوي على كود انضمام للشركة ورابط..."}
              className="w-full h-24 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-sans focus:outline-none focus:border-indigo-500 leading-relaxed placeholder:text-slate-500"
            />
          </div>

          <button
            id="generate-ai-mail-btn"
            onClick={() => triggerInbound(true)}
            disabled={isInjecting || !activeAddressId}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold px-4 py-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isInjecting ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>{lang === 'en' ? "Gemini Synthesizing Content..." : "جاري صياغة الرسالة بواسطة Gemini..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'en' ? "Generate with Gemini AI" : "محاكاة ذكية بواسطة Gemini"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successToast && (
        <div id="smtp-success-notification" className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in animate-bounce-subtle">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
}
