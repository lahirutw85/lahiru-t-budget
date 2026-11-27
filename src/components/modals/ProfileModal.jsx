import { useState } from 'react';
import { X, Save, Upload, Trash2, Lock, User, Mail, CheckCircle2 } from 'lucide-react';
import { supabase, hasSupabase } from '../../utils/supabaseClient';

const resizeImageToDataUrl = (file, maxSize = 256) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

export const ProfileModal = ({
  isOpen,
  onClose,
  COLORS,
  currentUser,
  userProfile,
  setUserProfile,
  defaultAvatar,
}) => {
  const email = currentUser?.email || '';
  const defaultNickname = email ? email.split('@')[0] : 'Lahiru T';

  const [nickname, setNickname] = useState(userProfile?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const dataUrl = await resizeImageToDataUrl(file, 256);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setErrorMsg(err.message || 'Could not process image');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const trimmedNickname = nickname.trim();
      const updatedProfile = {
        nickname: trimmedNickname,
        avatarUrl: avatarUrl || '',
      };
      setUserProfile(updatedProfile);

      if (hasSupabase() && supabase) {
        const updatePayload = {
          data: { nickname: trimmedNickname || defaultNickname },
        };
        if (newPassword) {
          updatePayload.password = newPassword;
        }
        const { error } = await supabase.auth.updateUser(updatePayload);
        if (error) throw error;
      }

      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(newPassword ? 'Profile and password updated!' : 'Profile updated!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: COLORS.bgCard, borderColor: COLORS.border }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: COLORS.border }}
        >
          <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
            User Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: COLORS.textSecondary }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl text-sm border bg-red-500/10 border-red-500/30 text-red-400">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl text-sm border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl || defaultAvatar}
              alt="Profile Preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#4FD1F5]/50 shrink-0"
            />
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[#4FD1F5]/15 text-[#4FD1F5] border border-[#4FD1F5]/30 hover:bg-[#4FD1F5]/25 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          {email && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
                Email Address
              </label>
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm opacity-80"
                style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
              >
                <Mail className="w-4 h-4 shrink-0" style={{ color: COLORS.textSecondary }} />
                <span className="truncate">{email}</span>
              </div>
            </div>
          )}

          {/* Nickname */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.textSecondary }}>
              Nickname
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.textSecondary }} />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={defaultNickname}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          {/* Change Password (Supabase Auth) */}
          {hasSupabase() && (
            <div className="pt-3 border-t space-y-3" style={{ borderColor: COLORS.border }}>
              <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: COLORS.textSecondary }}>
                <Lock className="w-3.5 h-3.5" />
                Change Password (Optional)
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#4FD1F5]"
                style={{ backgroundColor: COLORS.bgMain, borderColor: COLORS.border, color: COLORS.textPrimary }}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold border hover:bg-white/5 cursor-pointer transition-colors"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-[#0B0F19] bg-[#4FD1F5] hover:opacity-90 cursor-pointer transition-opacity disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
