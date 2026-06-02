/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, Clock, Globe, Shield, Terminal, Settings, CreditCard, Sparkles, Check, ChevronDown, User, Server, Code, ChevronRight, Award, ChevronLeft, Mail } from "lucide-react";
import { motion } from "motion/react";

import { TempAddress, MailMessage, Domain } from "./types";
import { translations } from "./translations";
import { MailInbox } from "./components/MailInbox";
import { SimulateInbound } from "./components/SimulateInbound";
import { ApiPlayground } from "./components/ApiPlayground";
import { AdminConsole } from "./components/AdminConsole";
import { SystemArchitecture } from "./components/SystemArchitecture";
import { PricingModal } from "./components/PricingModal";

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>("en");
  const [activeAddress, setActiveAddress] = useState<TempAddress | null>(null);
  const [domains, setDomains] = useState<Domain[]>([
    { id: "dom-1", domainName: "smail.live", status: "active", type: "public" },
    { id: "dom-2", domainName: "tempbox.xyz", status: "active", type: "public" },
    { id: "dom-3", domainName: "boxmail.pro", status: "active", type: "premium" },
    { id: "dom-4", domainName: "vmail.co", status: "active", type: "premium" }
  ]);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [activeTab, setActiveTab] = useState<'inbox' | 'simulate' | 'api' | 'telemetry' | 'architecture'>('inbox');
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'api'>("free");
  const [customUsername, setCustomUsername] = useState<string>("");
  const [selectedDomainName, setSelectedDomainName] = useState<string>("smail.live");
  const [isCustomizeUsernameOpen, setIsCustomizeUsernameOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);
  const [triggerTelemetryLogs, setTriggerTelemetryLogs] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[lang];

  // Create an initial address on first load so user is ready to inspect right away
  useEffect(() => {
    handleGenerateRandomAddress();
  }, []);

  // Poll Inbox messages every 5 seconds if address is active
  useEffect(() => {
    if (!activeAddress) return;
    
    fetchInboxMessages(activeAddress.id);
    const interval = setInterval(() => {
      fetchInboxMessages(activeAddress.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeAddress]);

  // Countdown timer effect
  useEffect(() => {
    if (!activeAddress) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAddressExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeAddress]);

  const fetchInboxMessages = async (addressId: string) => {
    try {
      const res = await fetch(`/api/v1/mail/inbox/${addressId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to poll inbox:", e);
    }
  };

  const handleGenerateRandomAddress = async (customPrefixInput?: string) => {
    setIsLoading(true);
    setToastMessage(null);
    try {
      const payload: Record<string, any> = {
        domainName: selectedDomainName,
        planType: userPlan
      };
      if (customPrefixInput) {
        payload.customPrefix = customPrefixInput;
      }
      
      const response = await fetch("/api/v1/mail/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      setActiveAddress(data);
      setTimeLeft(600); // reset to 10 minutes
      setMessages([]);
      setSelectedMessage(null);
      setTriggerTelemetryLogs(prev => prev + 1);
    } catch (err) {
      console.error("Failed to generate address:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendLifetime = async () => {
    if (!activeAddress) return;
    try {
      const res = await fetch(`/api/v1/mail/extend/${activeAddress.id}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setActiveAddress(data);
        setTimeLeft((prev) => prev + 600); // Add 10 minutes
        setTriggerTelemetryLogs(prev => prev + 1);
        showToast(lang === 'en' ? "Lifetime extended by 10 minutes!" : "تم تمديد صلاحية العنوان بـ 10 دقائق إضافية!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAddress = async () => {
    if (!activeAddress) return;
    setIsLoading(true);
    try {
      await fetch(`/api/v1/mail/${activeAddress.id}`, { method: "DELETE" });
      setActiveAddress(null);
      setMessages([]);
      setSelectedMessage(null);
      setTriggerTelemetryLogs(prev => prev + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressExpired = () => {
    setActiveAddress(null);
    setMessages([]);
    setSelectedMessage(null);
    showToast(lang === 'en' ? "Temporary address expired and secure database purged." : "انتهت صلاحية العنوان المؤقت وتم إتلاف البيانات بنجاح.");
  };

  const handleAddDomain = (domainName: string, type: 'public' | 'premium') => {
    const newDomain: Domain = {
      id: `dom-${Math.random().toString(36).substring(2, 11)}`,
      domainName,
      status: "active",
      type
    };
    setDomains((prev) => [...prev, newDomain]);
    setTriggerTelemetryLogs(prev => prev + 1);
    showToast(lang === 'en' ? `Connected MX domain: @${domainName}` : `تم توصيل نطاق بريدي جديد: @${domainName}`);
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min < 10 ? "0" : ""}${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const copyToClipboard = () => {
    if (!activeAddress) return;
    navigator.clipboard.writeText(activeAddress.address);
    showToast(t.copySuccess);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpgradeSuccess = (newPlan: 'free' | 'pro' | 'api') => {
    setUserPlan(newPlan);
    setTriggerTelemetryLogs(prev => prev + 1);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-indigo-600 selection:text-white ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none z-0"></div>

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center font-display font-bold tracking-tight text-base">
              <span className="font-mono">S</span>M
            </div>
            <div>
              <div className="font-display font-bold text-slate-100 text-md tracking-tight flex items-center gap-2">
                SmailPro <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded">Core</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold uppercase">{lang === 'en' ? "DECOUPLED SANDBOX" : "محاكاة معزولة كاملة"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* VIP Plan Status Badge */}
            {userPlan !== 'free' ? (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span className="uppercase">{userPlan} PRO VIP</span>
              </div>
            ) : (
              <button
                id="upgrade-cta-nav"
                onClick={() => setIsUpgradeOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.upgradeBtn}</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              id="lang-switch-btn"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'en' ? "العربية" : "English"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full space-y-8 z-10 relative">
        
        {/* Pitch Hero Subtitle block */}
        <div className="space-y-3 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-slate-100">
            {t.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-4xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Dynamic Email Generator Banner */}
        <div id="email-generator-banner" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            
            {/* Active Email View or Empty View */}
            <div className="flex-1 space-y-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                {lang === 'en' ? "PREMIUM TEMP ADDRESS CONTAINER" : "حاوية العنوان النشطة"}
              </span>

              {activeAddress ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Copy block */}
                  <div className="flex-1 flex items-center bg-slate-950 border border-slate-850 rounded-xl overflow-hidden px-4 py-3">
                    <span className="flex-1 font-mono text-sm md:text-base font-bold text-slate-200 truncate select-all">
                      {activeAddress.address}
                    </span>
                    <button
                      id="copy-address-btn"
                      onClick={copyToClipboard}
                      className="ml-3 p-1.5 bg-slate-905 hover:bg-slate-800 text-slate-400 hover:text-slate-150 rounded-lg transition-colors cursor-pointer"
                      title={lang === 'en' ? "Copy to Clipboard" : "نسخ للذاكرة"}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 shrink-0">
                    <Clock className="w-5 h-5 text-indigo-400 animate-pulse animate-duration-1000" />
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold leading-none">{t.expiresIn}</div>
                      <div className="font-mono font-bold text-slate-100 text-sm md:text-base mt-1">{formatTime(timeLeft)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 italic text-xs py-2">
                  {lang === 'en' ? "No temporary address allocated. Click button to provision a secure namespace." : "لا يوجد عنوان مخصص حالياً. اضغط على الزر بالأسفل لتوليد مسار بريد مخصص."}
                </div>
              )}
            </div>

            {/* Generator actions */}
            <div className="flex flex-wrap items-center gap-3 self-end lg:self-center">
              {activeAddress && (
                <button
                  id="extend-lifetime-btn"
                  onClick={handleExtendLifetime}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-705 text-slate-200 font-bold px-4 py-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.extendBtn}</span>
                </button>
              )}

              <button
                id="generate-random-btn"
                onClick={() => handleGenerateRandomAddress()}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold px-5 py-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-md"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>{t.createBtn}</span>
              </button>

              <button
                id="customize-username-btn"
                onClick={() => setIsCustomizeUsernameOpen(!isCustomizeUsernameOpen)}
                className="bg-slate-950 hover:bg-slate-850 p-4 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-all"
                title={t.regenerateBtn}
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCustomizeUsernameOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Customize Drawer Panel */}
          {isCustomizeUsernameOpen && (
            <div id="customize-username-drawer" className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4 animate-fade-in">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
                {lang === 'en' ? "PRO CUSTOM USERNAME ROUTING" : "إعدادات الربط المخصص (Pro Routing)"}
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-500 uppercase text-[9px] font-semibold mb-1.5">User Handle prefix</label>
                  <input
                    id="custom-prefix-handle-input"
                    type="text"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    placeholder="e.g. testing123"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 uppercase text-[9px] font-semibold mb-1.5">Domain pool MX link</label>
                  <select
                    id="domain-mx-pool-select"
                    value={selectedDomainName}
                    onChange={(e) => setSelectedDomainName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 focus:outline-none"
                  >
                    {domains.map((dom) => {
                      const isLocked = dom.type === "premium" && userPlan === "free";
                      return (
                        <option key={dom.id} value={dom.domainName} disabled={isLocked}>
                          @{dom.domainName} {isLocked ? `(PRO Locked 🔒)` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    id="apply-custom-address-btn"
                    onClick={() => {
                      if (!customUsername.trim()) {
                        alert(lang === 'en' ? "Please type a unique prefix name!" : "برجاء كتابة اسم مستخدم صالح أولاً!");
                        return;
                      }
                      handleGenerateRandomAddress(customUsername.trim());
                    }}
                    disabled={isLoading}
                    className="w-full bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-slate-100 py-2 border border-slate-700 hover:border-indigo-500 rounded-lg font-bold font-sans cursor-pointer transition-all"
                  >
                    {lang === 'en' ? "Deploy Custom Address" : "نشر المسار المخصص ونقله"}
                  </button>
                </div>
              </div>

              {userPlan === "free" && (
                <div className="text-[10px] text-amber-500 flex items-center gap-1.5 font-sans bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10">
                  <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {lang === 'en' 
                      ? "Some domains listed are available only for VIP track premium. Upgrade accounts to unlock elite endpoints (@boxmail.pro, @vmail.co)." 
                      : "النطاقات المميزة VIP مثل (@boxmail.pro, @vmail.co) مغلقة فقط للمشتركين ذوي الباقات المدفوعة. قم بترقية باقتك لفتحها."}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workspace Panels Dashboard Tabs selector */}
        <div id="workspace-tabs-group" className="border-b border-slate-800 flex flex-wrap gap-1 font-sans">
          {[
            { id: 'inbox', label_en: `Inbox Feed (${messages.length})`, label_ar: `علبة الرسائل (${messages.length})`, icon: Mail },
            { id: 'simulate', label_en: "Simulate SMTP Inbound", label_ar: "محاكاة وصول SMTP", icon: RefreshCw },
            { id: 'api', label_en: "Developer REST Playground", label_ar: "لوحة المطورين REST", icon: Code },
            { id: 'telemetry', label_en: "Server Telemetry & Logs", label_ar: "مراقبة الخادم والذاكرة", icon: Terminal },
            { id: 'architecture', label_en: "Engineering Blueprint & SQL", label_ar: "البنية الهندسية واستعلامات SQL", icon: Server }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                id={`tab-btn-${tab.id}`}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  // Refresh metrics when shifting tabs to logs or stats
                  if (tab.id === 'telemetry') {
                    setTriggerTelemetryLogs(prev => prev + 1);
                  }
                }}
                className={`flex items-center gap-2.5 px-4 md:px-5 py-3 text-xs font-bold border-b-2 tracking-tight transition-all cursor-pointer ${
                  isActive 
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/5 font-semibold" 
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{lang === 'en' ? tab.label_en : tab.label_ar}</span>
              </button>
            );
          })}
        </div>

        {/* Tabs Render Viewports */}
        <div className="min-h-[400px]">
          {activeTab === 'inbox' && (
            <MailInbox
              lang={lang}
              messages={messages}
              selectedMessage={selectedMessage}
              onSelectMessage={(msg) => setSelectedMessage(msg)}
              onClearMessageSelection={() => setSelectedMessage(null)}
              onDeleteMessage={(msgId) => {
                setMessages((prev) => prev.filter(m => m.id !== msgId));
                setTriggerTelemetryLogs(prev => prev + 1);
              }}
              isLoading={isLoading}
              onRefreshInbox={() => {
                if (activeAddress) fetchInboxMessages(activeAddress.id);
                setTriggerTelemetryLogs(prev => prev + 1);
                showToast(lang === 'en' ? "Checking for new SMTP routes..." : "جاري التحقق من مسارات SMTP الواردة بالخادم...");
              }}
            />
          )}

          {activeTab === 'simulate' && (
            <SimulateInbound
              lang={lang}
              activeAddressId={activeAddress ? activeAddress.id : null}
              activeAddressName={activeAddress ? activeAddress.address : null}
              onMailInboundReceived={(newMail) => {
                setMessages((prev) => [newMail, ...prev]);
                setSelectedMessage(newMail);
                setActiveTab('inbox');
                setTriggerTelemetryLogs(prev => prev + 1);
              }}
              triggerLogsUpdate={() => setTriggerTelemetryLogs(prev => prev + 1)}
            />
          )}

          {activeTab === 'api' && (
            <ApiPlayground
              lang={lang}
              activeAddressId={activeAddress ? activeAddress.id : ""}
            />
          )}

          {activeTab === 'telemetry' && (
            <AdminConsole
              lang={lang}
              domains={domains}
              onAddDomain={handleAddDomain}
              triggerLogsTick={triggerTelemetryLogs}
            />
          )}

          {activeTab === 'architecture' && (
            <SystemArchitecture
              lang={lang}
            />
          )}
        </div>

        {/* Global Floating Toast Alert */}
        {toastMessage && (
          <div id="global-floating-toast" className={`fixed bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} z-50 bg-slate-900 border border-slate-750 p-4 rounded-xl shadow-2xl flex items-center gap-2.5 animate-fade-in text-xs font-semibold`}>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
            <span className="text-slate-200">{toastMessage}</span>
          </div>
        )}

        {/* Upgrade Billing Checkout Modal */}
        <PricingModal
          lang={lang}
          isOpen={isUpgradeOpen}
          onClose={() => setIsUpgradeOpen(false)}
          onUpgradeSuccess={handleUpgradeSuccess}
        />

        {/* Million Users Scaling Engineering Note section */}
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900 space-y-3 mt-8">
          <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-500" />
            {lang === 'en' ? "TECHNICAL HORIZONTAL SCALING PLAN" : "خطة التوسع لمليون مستخدم نشط - SmailPro Scaling Model"}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {lang === 'en'
              ? "To scale temporary mail engines to 1,000,000+ concurrent readers, DNS records must front a geo-located Anycast IP Cluster. Use Cloudflare CDN to shield NestJS/Fastify nodes, implement a master/replica PostgreSQL cluster for state retention, and decouple incoming SMTP relays with memory-managed Redis BullMQ clusters on private networks."
              : "لتحسين ورفع أداء خوادم البريد الإلكتروني المؤقت لتحمل أكثر من مليون مستخدم نشط في آن واحد، يجب توجيه سجلات DNS عبر شبكة Anycast IP موزعة جغرافياً. تدرج الحماية الكاملة لخدمات الـ NestJS عبر خوادم Cloudflare، بينما تتولى عناقيد PostgreSQL المتطابقة إدارة سجلات الحفظ، وتلغي BullMQ/Redis فترات التحميل SMTP الـ Relays على خادم داخلي Hetzner معزول تماماً."}
          </p>
        </div>

      </main>

      {/* Humble Footer */}
      <footer className="border-t border-slate-900 py-6 mt-12 bg-slate-950/40 text-center text-xs text-slate-600 font-mono">
        <div>SmailPro System Architecture Simulation Core © 2026. Designed for absolute developer transparency.</div>
      </footer>

    </div>
  );
}
