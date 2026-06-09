"use client";

import React, { useState, useEffect } from "react";
import { 
  Save, 
  Printer, 
  MapPin, 
  Phone, 
  Mail, 
  Hash, 
  Type, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { receiptSettingsApi, ReceiptSettings } from "@/lib/api/receiptSettingsApi";
import { useToast } from "@/components/ui/toast";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
} from "@/lib/dashboard-ui";

export default function ReceiptSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReceiptSettings | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phones, setPhones] = useState<{provider: string, number: string}[]>([]);
  const [email, setEmail] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [footerText, setFooterText] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await receiptSettingsApi.getSettings();
      setSettings(data);
      setName(data.name || "");
      setAddress(data.address || "");
      try {
        const parsedPhones = data.phone ? JSON.parse(data.phone) : [];
        setPhones(Array.isArray(parsedPhones) ? parsedPhones : []);
      } catch (e) {
        setPhones([]);
      }
      setEmail(data.email || "");
      setVatNumber(data.vatNumber || "");
      setFooterText(data.footerText || "");
      setLogoUrl(data.logoUrl || "");
    } catch (err) {
      console.error("Failed to fetch settings", err);
      showToast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        return showToast("Logo size should be less than 1MB", "error");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return showToast("Restaurant name is required", "error");

    setSaving(true);
    try {
      await receiptSettingsApi.updateSettings({
        name,
        address,
        phone: JSON.stringify(phones),
        email,
        vatNumber,
        footerText,
        logoUrl
      });
      showToast("Receipt settings updated successfully", "success");
      await fetchSettings();
    } catch (err) {
      showToast("Failed to update settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${dashboardPageClass} pb-12`} style={dashboardPageStyle}>
      {/* Page Header */}
      <div className="mb-8 px-4 flex justify-between items-end">
        <div>
          <h1 className={pageHeaderTitleClass}>Receipt Settings</h1>
          <p className={pageHeaderSubtitleClass}>Configure the information that appears on your customer receipts.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={fetchSettings}
            className="h-11 px-4 border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold flex items-center gap-2"
          >
            <RefreshCw className={loading ? "animate-spin size-4" : "size-4"} />
            Refresh
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || loading}
            className="h-11 px-8 bg-primary !text-white hover:bg-primary/90 hover:!text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin size-4" /> : <Save className="size-4" />}
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1e293b]">Company Details</h3>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Public information for the receipt header</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#1e293b] flex items-center gap-2">
                    <Type className="size-3.5 text-zinc-400" />
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fine Dine Restaurant"
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-[14px] font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#1e293b] flex items-center gap-2">
                    <Hash className="size-3.5 text-zinc-400" />
                    VAT / Tax Number
                  </label>
                  <input
                    type="text"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="e.g. VAT-12345678"
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-[14px] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#1e293b] flex items-center gap-2">
                  <MapPin className="size-3.5 text-zinc-400" />
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Country"
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-[14px] font-medium resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-[#1e293b] flex items-center gap-2">
                    <Phone className="size-3.5 text-zinc-400" />
                    Phone Numbers & Providers
                  </label>
                  <Button 
                    type="button"
                    onClick={() => setPhones([...phones, { provider: "", number: "" }])}
                    className="h-8 px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold rounded-lg"
                  >
                    + Add Phone
                  </Button>
                </div>
                
                {phones.map((p, idx) => (
                  <div key={idx} className="flex gap-3 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={p.provider}
                        onChange={(e) => {
                          const newPhones = [...phones];
                          newPhones[idx].provider = e.target.value;
                          setPhones(newPhones);
                        }}
                        placeholder="Provider (e.g. Hormuud)"
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-primary text-[13px] font-medium"
                      />
                      <input
                        type="text"
                        value={p.number}
                        onChange={(e) => {
                          const newPhones = [...phones];
                          newPhones[idx].number = e.target.value;
                          setPhones(newPhones);
                        }}
                        placeholder="Number"
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-primary text-[13px] font-medium"
                      />
                    </div>
                    <Button 
                      onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                      className="size-10 p-0 bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 rounded-xl"
                    >
                      <Save className="size-4 rotate-45" /> {/* Using Save as a temp X replacement if X is not imported */}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 bg-zinc-50/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                <FileText className="size-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1e293b]">Additional Info</h3>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Logo and footer message</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[13px] font-bold text-[#1e293b] flex items-center gap-2">
                  <ImageIcon className="size-3.5 text-zinc-400" />
                  Restaurant Logo
                </label>
                <div className="flex items-center gap-6">
                  <div className="size-24 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center bg-zinc-50 overflow-hidden group hover:border-primary transition-all relative">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="size-8 text-zinc-300" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-[13px] font-bold text-[#1e293b]">Upload your logo</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">Recommended: Square format, PNG or JPG. Max 1MB. This logo will appear at the very top of your printed receipts.</p>
                    <Button 
                      variant="ghost" 
                      onClick={() => setLogoUrl("")}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-bold h-8 px-3 rounded-lg"
                    >
                      Remove Logo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#1e293b] flex items-center gap-2">
                  <Save className="size-3.5 text-zinc-400" />
                  Footer Message
                </label>
                <textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="e.g. Thank you for visiting! Please come again."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-[14px] font-medium resize-none"
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-100">
                <label className="text-[13px] font-bold text-[#1e293b] flex items-center gap-2">
                  <Mail className="size-3.5 text-zinc-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@restaurant.com"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-[14px] font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Printer className="size-4 text-zinc-400" />
              <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Live Receipt Preview</span>
            </div>
            
            <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-8 font-mono text-zinc-800 relative max-w-[380px] mx-auto min-h-[500px] flex flex-col">
              {/* Receipt Notch Effect */}
              <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-32 h-2 bg-zinc-100 rounded-b-xl border-x border-b border-zinc-200"></div>
              
              <div className="text-center space-y-2 mb-8 mt-4">
                {logoUrl ? (
                  <div className="flex justify-center mb-4">
                    <img src={logoUrl} alt="Logo" className="max-h-16 w-auto" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-zinc-100 rounded-full mx-auto flex items-center justify-center mb-4 border border-zinc-200">
                    <ImageIcon className="size-5 text-zinc-300" />
                  </div>
                )}
                <h2 className="text-lg font-bold uppercase tracking-tight leading-tight">{name || "RESTAURANT NAME"}</h2>
                <div className="text-[11px] text-zinc-500 space-y-0.5 font-medium">
                  {address && <p>{address}</p>}
                  {phones.map((p, idx) => (
                    <p key={idx}>{p.provider && <span className="font-bold">{p.provider}: </span>}{p.number}</p>
                  ))}
                  {vatNumber && <p className="font-bold">VAT: {vatNumber}</p>}
                </div>
              </div>

              <div className="border-b border-dashed border-zinc-300 pb-3 mb-3 text-[11px] text-zinc-400 font-medium">
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>TIME:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span>#001234</span>
                </div>
                <div className="flex justify-between">
                  <span>TABLE:</span>
                  <span>T-12</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-6">
                {[
                  { qty: 2, name: "Grilled Salmon", price: 48.00 },
                  { qty: 1, name: "Classic Caesar Salad", price: 12.50 },
                  { qty: 3, name: "Fresh Orange Juice", price: 15.00 }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] font-medium italic">
                    <span className="flex-1">{item.qty}x {item.name}</span>
                    <span className="tabular-nums">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-300 pt-4 space-y-1.5 text-[12px] font-bold">
                <div className="flex justify-between text-zinc-400 font-medium">
                  <span>SUBTOTAL</span>
                  <span className="tabular-nums">$75.50</span>
                </div>
                <div className="flex justify-between text-zinc-400 font-medium">
                  <span>TAX / VAT (5%)</span>
                  <span className="tabular-nums">$3.78</span>
                </div>
                <div className="flex justify-between text-lg font-black text-black pt-2">
                  <span>TOTAL</span>
                  <span className="tabular-nums">$79.28</span>
                </div>
              </div>

              <div className="mt-auto pt-8 text-center pb-8">
                <div className="text-[11px] text-zinc-400 italic leading-relaxed font-medium">
                  {footerText || "Thank you for your visit! Have a wonderful day!"}
                  {email && <p className="mt-1 font-bold not-italic">{email}</p>}
                </div>
              </div>

              {/* Receipt Bottom Jagged Edge Simulation */}
              <div className="absolute -bottom-1 left-0 right-0 flex overflow-hidden opacity-10 grayscale">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-zinc-200 rotate-45 -mb-2 shrink-0 border border-zinc-300"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
