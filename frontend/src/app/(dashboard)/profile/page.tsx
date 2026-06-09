"use client";

import React, { useEffect, useState, useRef } from "react";
import { authApi, AuthUser } from "@/lib/api/authApi";
import { User as UserIcon, Lock, LogOut, CheckCircle2, Calendar, ChevronDown, Edit2, Upload, Save, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const InputWrapper = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "Male",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      
      const firstName = currentUser.fullName?.split(" ")[0] || "";
      const lastName = currentUser.fullName?.split(" ").slice(1).join(" ") || "";
      
      // Format date for input if exists
      let formattedDob = "";
      if (currentUser.dateOfBirth) {
        const d = new Date(currentUser.dateOfBirth);
        if (!isNaN(d.getTime())) {
          formattedDob = d.toISOString().split('T')[0];
        }
      }
      
      setFormData({
        firstName,
        lastName,
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        address: currentUser.address || "",
        dateOfBirth: formattedDob,
        gender: currentUser.gender || "Male",
        avatarUrl: currentUser.avatarUrl || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    } else {
      showToast("Click 'Edit Profile' to change avatar", "info");
    }
  };

  const handleSave = async () => {
    if (activeTab === 'security') {
      if (!formData.currentPassword || !formData.newPassword) {
        showToast("Please enter both current and new passwords", "error");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        showToast("New passwords do not match", "error");
        return;
      }
      if (formData.newPassword.length < 6) {
        showToast("New password must be at least 6 characters", "error");
        return;
      }
    }

    try {
      setSaving(true);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      await authApi.updateProfile({
        fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        avatarUrl: formData.avatarUrl,
        ...(activeTab === 'security' && formData.newPassword ? { 
          currentPassword: formData.currentPassword, 
          newPassword: formData.newPassword 
        } : {})
      });
      
      showToast("Profile updated successfully", "success");
      setIsEditing(false);
      fetchUser();
      
      // Notify layouts to update the header avatar instantly
      window.dispatchEvent(new CustomEvent('profile_updated'));
      
      if (activeTab === 'security') {
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex justify-center p-6 md:p-10 bg-transparent overflow-y-auto">
      <div className="max-w-7xl w-full flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-[300px] shrink-0 bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-fit">
          <div className="flex flex-col items-center mb-10 mt-4">
            <div className="relative group cursor-pointer" onClick={triggerFileUpload}>
              <div className="w-32 h-32 bg-gray-50 text-primary rounded-full flex items-center justify-center text-5xl font-black border-4 border-white shadow-sm overflow-hidden relative">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) || "U"
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="text-white size-8" />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              {isEditing && (
                <button className="absolute bottom-0 right-2 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-secondary transition-colors z-10">
                  <Edit2 className="size-4" />
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-[#1E293B] mt-5 tracking-tight">{user?.fullName || "User"}</h2>
            <p className="text-sm font-medium text-gray-400 mt-1 capitalize">{user?.role || "Staff"}</p>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => { setActiveTab('personal'); setIsEditing(false); }}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-lg font-bold text-[14px] transition-colors",
                activeTab === 'personal' ? "bg-[#F0F0FF] text-primary" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <UserIcon className="size-4" />
              Personal Information
            </button>
            <button 
              onClick={() => { setActiveTab('security'); setIsEditing(false); }}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-lg font-bold text-[14px] transition-colors",
                activeTab === 'security' ? "bg-[#F0F0FF] text-primary" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <Lock className="size-4" />
              Login & Password
            </button>
            <button 
              onClick={() => authApi.logout()}
              className="flex items-center gap-4 px-5 py-4 text-gray-500 hover:bg-gray-50 rounded-lg font-bold text-[14px] transition-colors mt-4"
            >
              <LogOut className="size-4" />
              Log Out
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white rounded-xl p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col h-fit">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
            <h2 className="text-[22px] font-black text-[#1E293B] tracking-tight">
              {activeTab === 'personal' ? 'Personal Information' : 'Security Settings'}
            </h2>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#F0F0FF] text-primary rounded-lg font-bold text-[13px] hover:bg-[#E5E5FF] transition-colors"
              >
                <Edit2 className="size-3.5" /> Edit Profile
              </button>
            ) : (
              <button 
                onClick={() => { setIsEditing(false); fetchUser(); }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-500 rounded-lg font-bold text-[13px] hover:bg-rose-100 transition-colors"
              >
                <X className="size-3.5" /> Cancel
              </button>
            )}
          </div>

          {activeTab === 'personal' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Gender Selection */}
              <div className="flex items-center gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="gender" value="Male" checked={formData.gender === "Male"} onChange={handleInputChange} disabled={!isEditing} className="hidden peer" />
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", formData.gender === "Male" ? "border-primary" : "border-gray-300", !isEditing && "opacity-70 cursor-not-allowed")}>
                    <div className={cn("w-2.5 h-2.5 rounded-full bg-primary", formData.gender === "Male" ? "block" : "hidden")}></div>
                  </div>
                  <span className={cn("text-[14px] font-bold", formData.gender === "Male" ? "text-gray-800" : "text-gray-400")}>Male</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="gender" value="Female" checked={formData.gender === "Female"} onChange={handleInputChange} disabled={!isEditing} className="hidden peer" />
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", formData.gender === "Female" ? "border-primary" : "border-gray-300", !isEditing && "opacity-70 cursor-not-allowed")}>
                    <div className={cn("w-2.5 h-2.5 rounded-full bg-primary", formData.gender === "Female" ? "block" : "hidden")}></div>
                  </div>
                  <span className={cn("text-[14px] font-bold", formData.gender === "Female" ? "text-gray-800" : "text-gray-400")}>Female</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
                <InputWrapper label="First Name">
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} readOnly={!isEditing} className={cn("h-[52px] px-5 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20" : "bg-transparent border border-gray-100")} />
                </InputWrapper>
                
                <InputWrapper label="Last Name">
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} readOnly={!isEditing} className={cn("h-[52px] px-5 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20" : "bg-transparent border border-gray-100")} />
                </InputWrapper>

                <div className="col-span-1 md:col-span-2">
                  <InputWrapper label="Email Address">
                    <div className="relative">
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} readOnly={!isEditing} className={cn("h-[52px] pl-5 pr-24 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20" : "bg-transparent border border-gray-100")} />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-emerald-500 text-[11px] font-black uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle2 className="size-3.5" /> Verified
                      </div>
                    </div>
                  </InputWrapper>
                </div>
                <InputWrapper label="Phone Number">
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} readOnly={!isEditing} placeholder={isEditing ? "Enter phone number" : "No phone provided"} className={cn("h-[52px] px-5 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20" : "bg-transparent border border-gray-100")} />
                </InputWrapper>
                
                <InputWrapper label="Date of Birth">
                  <div className="relative">
                    <input type={isEditing ? "date" : "text"} name="dateOfBirth" value={isEditing ? formData.dateOfBirth : (formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : "Not provided")} onChange={handleInputChange} readOnly={!isEditing} className={cn("h-[52px] pl-5 pr-12 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full appearance-none", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20 cursor-pointer" : "bg-transparent border border-gray-100")} />
                    {!isEditing && <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />}
                  </div>
                </InputWrapper>

                <div className="col-span-1 md:col-span-2">
                  <InputWrapper label="Address">
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} readOnly={!isEditing} placeholder={isEditing ? "Enter your full address" : "No address provided"} className={cn("h-[52px] px-5 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20" : "bg-transparent border border-gray-100")} />
                  </InputWrapper>
                </div>

                
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-md space-y-7 animate-in fade-in duration-300">
              <p className="text-sm font-medium text-gray-500 mb-6">Update your password to keep your account secure. You must enter your current password to set a new one.</p>
              
              <InputWrapper label="Current Password">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
                  <input type={showCurrentPassword ? "text" : "password"} name="currentPassword" value={formData.currentPassword} onChange={handleInputChange} readOnly={!isEditing} placeholder={isEditing ? "Enter current password" : "••••••••"} className={cn("h-[52px] pl-12 pr-12 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20" : "bg-transparent border border-gray-100")} />
                  {isEditing && (
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showCurrentPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  )}
                </div>
              </InputWrapper>

              <InputWrapper label="New Password">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
                  <input type={showNewPassword ? "text" : "password"} name="newPassword" value={formData.newPassword} onChange={handleInputChange} readOnly={!isEditing} placeholder={isEditing ? "Enter new password" : "••••••••"} className={cn("h-[52px] pl-12 pr-12 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20" : "bg-transparent border border-gray-100")} />
                  {isEditing && (
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showNewPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  )}
                </div>
              </InputWrapper>

              <InputWrapper label="Confirm New Password">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-gray-400" />
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} readOnly={!isEditing} placeholder={isEditing ? "Confirm new password" : "••••••••"} className={cn("h-[52px] pl-12 pr-12 rounded-md text-[14px] font-bold text-[#1E293B] outline-none transition-all w-full", isEditing ? "bg-[#f4f5f9] border-none focus:ring-2 focus:ring-primary/20" : "bg-transparent border border-gray-100")} />
                  {isEditing && (
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirmPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  )}
                </div>
              </InputWrapper>
            </div>
          )}

          {isEditing && (
            <div className="flex items-center gap-5 mt-10 pt-8 border-t border-gray-50 animate-in slide-in-from-bottom-4 duration-300">
              <button onClick={() => { setIsEditing(false); fetchUser(); }} className="flex-1 max-w-[200px] h-[52px] bg-white border-2 border-gray-200 text-gray-600 rounded-md font-bold text-[14px] hover:bg-gray-50 transition-colors">
                Discard Changes
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 max-w-[200px] h-[52px] bg-primary text-white rounded-md font-bold text-[14px] hover:bg-secondary transition-all shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><Save className="size-4" /> Save Changes</>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
