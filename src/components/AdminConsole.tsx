/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, RefreshCw, Cpu, Database, Plus, Check, Loader2, Globe, AlertTriangle, Activity } from "lucide-react";

interface AdminConsoleProps {
  lang: 'en' | 'ar';
  domains: { id: string; domainName: string; status: string; type: string }[];
  onAddDomain: (domainName: string, type: 'public' | 'premium') => void;
  triggerLogsTick: number; // key changes to force logs refresh from outside
}

interface TelemetryStats {
  activeAddressesCount: number;
  messagesReceivedCount: number;
  spamFilteredCount: number;
  activeDomainsCount: number;
  dbConnections: number;
  cpuUsage: string;
  memoryUsage: string;
}

interface TechLog {
  id: string;
  timestamp: string;
  service: string;
  level: string;
  message: string;
}

export function AdminConsole({ lang, domains, onAddDomain, triggerLogsTick }: AdminConsoleProps) {
  const [stats, setStats] = useState<TelemetryStats>({
    activeAddressesCount: 0,
    messagesReceivedCount: 0,
    spamFilteredCount: 0,
    activeDomainsCount: 4,
    dbConnections: 8,
    cpuUsage: "0.8%",
    memoryUsage: "244MB / 1024MB"
  });
  const [logs, setLogs] = useState<TechLog[]>([]);
  const [newDomainInput, setNewDomainInput] = useState<string>("");
  const [newDomainType, setNewDomainType] = useState<'public' | 'premium'>("public");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchStatsAndLogs = async () => {
    setIsRefreshing(true);
    try {
      const statsRes = await fetch("/api/telemetry/stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      const logsRes = await fetch("/api/telemetry/logs");
      const logsData = await logsRes.json();
      setLogs(logsData);
    } catch (e) {
      console.error("Failed to load admin metrics:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatsAndLogs();
    // Setup continuous polling
    const interval = setInterval(fetchStatsAndLogs, 6000);
    return () => clearInterval(interval);
  }, [triggerLogsTick]);

  const handleDomainAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    const cleanDomain = newDomainInput.trim().toLowerCase().replace(/[^a-z0-9.-]/g, "");
    if (!cleanDomain.includes(".")) return; // simple valid domain check

    onAddDomain(cleanDomain, newDomainType);
    setNewDomainInput("");
    
    // Quick refresh stats
    setTimeout(fetchStatsAndLogs, 300);
  };

  return (
    <div id="admin-panel" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-8">
      {/* Header */}
      <div className="border-b border-slate-800 p-6 bg-slate-950/45 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              {lang === 'en' ? "SmailPro System Operator telemetry" : "لوحة مراقبة تدفق النظام والمؤشرات الكلية"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'en' ? "Verify resources, purge cache pipelines, or expand available MX endpoints." : "إدارة وتحسين النطاقات النشطة، وفحص سجلات الأخطاء البرمجية (MIME Routing)."}
            </p>
          </div>
        </div>
        <button
          id="refresh-telemetry-btn"
          onClick={fetchStatsAndLogs}
          disabled={isRefreshing}
          className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          {isRefreshing ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </div>

      {/* Grid Dashboard */}
      <div className="p-6 space-y-6">
        {/* Hardware & Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-500 text-[10px] tracking-wider uppercase font-mono font-semibold">
              <span>{lang === 'en' ? "ACTIVE ADDRESSES" : "العناوين النشطة"}</span>
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono mt-2">{stats.activeAddressesCount}</div>
            <div className="text-[10px] text-indigo-400 mt-1 font-mono">10m TTL expires</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-500 text-[10px] tracking-wider uppercase font-mono font-semibold">
              <span>{lang === 'en' ? "EMAILS RECEIVED" : "الرسائل المستقبلة"}</span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono mt-2">{stats.messagesReceivedCount}</div>
            <div className="text-[10px] text-emerald-400 mt-1 font-mono">{stats.spamFilteredCount} Spam Filtered</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-500 text-[10px] tracking-wider uppercase font-mono font-semibold">
              <span>{lang === 'en' ? "CPU LOAD" : "استهلاك المعالج"}</span>
              <Cpu className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono mt-2">{stats.cpuUsage}</div>
            <div className="text-[10px] text-amber-500 mt-1 font-mono">16 Single Cores cluster</div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-500 text-[10px] tracking-wider uppercase font-mono font-semibold">
              <span>{lang === 'en' ? "MEMORY ALLOCATION" : "حجم الذاكرة المستهلكة"}</span>
              <Activity className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-md md:text-md lg:text-md font-bold text-slate-100 font-mono mt-2.5 whitespace-nowrap">{stats.memoryUsage}</div>
            <div className="text-[10px] text-rose-450 mt-1 font-mono">V8 Garbage Collector live</div>
          </div>
        </div>

        {/* Console Log Streaming (Terminal) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5 uppercase font-bold text-slate-400">
              <Terminal className="w-4 h-4 text-indigo-400" />
              {lang === 'en' ? "Live Telemetry Log Routing Network" : "سجل تعقب الأحداث في الوقت الفعلي"}
            </span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase font-semibold">
              {lang === 'en' ? "Polling Status: Active" : "حالة الاتصال: استماع"}
            </span>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800/85 p-4 font-mono text-[11px] leading-relaxed text-slate-300 max-h-56 overflow-y-auto">
            <div className="space-y-1" ref={scrollRef}>
              {logs.length > 0 ? (
                logs.map((log) => {
                  const errorClass = log.level === "error" ? "text-rose-400" : log.level === "warn" ? "text-amber-400" : "text-slate-400";
                  const serviceColor = log.service === "MailEngine" ? "text-rose-300" : log.service === "Database" ? "text-emerald-300" : "text-sky-300";
                  return (
                    <div key={log.id} className="hover:bg-slate-900/40 py-0.5 flex items-start gap-2 border-b border-slate-900/40 last:border-0">
                      <span className="text-slate-500 text-[10px] whitespace-nowrap">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`font-semibold shrink-0 uppercase text-[9px] px-1 bg-slate-900 rounded ${serviceColor}`}>
                        {log.service}
                      </span>
                      <span className={`${errorClass} break-all`}>
                        {log.message}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-slate-500 py-8 italic">
                  {lang === 'en' ? "Awaiting syslog feed generation..." : "في انتظار ورود مؤشرات تشغيل النظام من الخادم..."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Temporary Domain Pool Expansion */}
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Globe className="w-4 h-4 text-indigo-400" />
                {lang === 'en' ? "TEMPORARY MX DOMAIN POOL" : "مجموعة نطاقات تجميع رسائل البريد المؤقت"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en'
                  ? "Manage active namespaces configured with direct DNS MX routes feeding the Postfix Engine."
                  : "إدارة النطاقات البريدية النشطة الموجهة لإلكترونيات الاستلام SMTP."}
              </p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleDomainAdd} className="flex flex-col sm:flex-row items-stretch gap-2">
              <input
                id="new-mx-domain-input"
                type="text"
                placeholder={lang === 'en' ? "e.g., mailpro.vip" : "مثال: inboxfree.care"}
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                className="bg-slate-900 text-xs border border-slate-850 px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 min-w-44"
              />
              <select
                id="new-mx-domain-type"
                value={newDomainType}
                onChange={(e) => setNewDomainType(e.target.value as any)}
                className="bg-slate-950 text-xs border border-slate-850 px-2 py-2 rounded-lg text-slate-350 focus:outline-none"
              >
                <option value="public">{lang === 'en' ? "Public Domain" : "عام مجاني"}</option>
                <option value="premium">{lang === 'en' ? "Pro Premium VIP" : "باقة مدفوعة VIP"}</option>
              </select>
              <button
                id="add-mx-domain-btn"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                {lang === 'en' ? "Add MX" : "إضافة نطاق"}
              </button>
            </form>
          </div>

          {/* Connected Domains Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {domains.map((dom) => (
              <div key={dom.id} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-slate-200 font-bold">@{dom.domainName}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[8px] uppercase tracking-wider font-semibold px-1 rounded ${
                      dom.type === "premium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" : "bg-indigo-500/10 text-indigo-400"
                    }`}>
                      {dom.type === "premium" ? "VIP" : "Free"}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[9px] text-slate-500 font-mono capitalize">{dom.status}</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 font-bold bg-slate-900 px-2 py-1 rounded">
                  MX: 10
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
