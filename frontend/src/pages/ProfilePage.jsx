import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import useTimedMessage from '../hooks/useTimedMessage';
import { getApiErrorMessage } from '../utils/apiError';

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TF';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const { message: profileMsg, show: showProfileMsg } = useTimedMessage();
  const { message: pwMsg, show: showPasswordMsg } = useTimedMessage();
  const logoutTimerRef = useRef(null);

  useEffect(() => {
    setProfileForm({ name: user?.name || '', email: user?.email || '' });
  }, [user?.email, user?.name]);

  useEffect(() => () => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
    }
  }, []);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await authApi.updateMe(profileForm);
      updateUser(response.data.data.user);
      showProfileMsg('Profile updated successfully.');
    } catch (err) {
      showProfileMsg(getApiErrorMessage(err, 'Update failed.'), { error: true });
    } finally {
      setSaving(false);
    }
  };

  const handlePwSave = async (event) => {
    event.preventDefault();

    if (pwForm.newPassword !== pwForm.confirm) {
      showPasswordMsg('Passwords do not match.', { error: true });
      return;
    }

    setSavingPw(true);

    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showPasswordMsg('Password changed. Please sign in again with the new password.', { timeoutMs: 1500 });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      logoutTimerRef.current = window.setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err) {
      showPasswordMsg(getApiErrorMessage(err, 'Password change failed.'), { error: true });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-copy">
          <div className="page-eyebrow">Account settings</div>
          <div className="page-title">Profile and security</div>
          <div className="page-subtitle">
            Keep your identity details current and your account access locked down.
          </div>
        </div>

        <div className="page-actions">
          <div className="header-stat">
            <span className="header-stat-label">Access level</span>
            <strong>{user?.role === 'admin' ? 'Admin' : 'Member'}</strong>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="profile-grid">
          <div className="card identity-card">
            <div className="card-body">
              <div className="identity-avatar">{getInitials(user?.name)}</div>
              <div className="identity-name">{user?.name}</div>
              <div className="identity-email">{user?.email}</div>

              <div className="identity-metrics">
                <div className="identity-metric">
                  <span>Role</span>
                  <strong>{user?.role === 'admin' ? 'Administrator' : 'Workspace member'}</strong>
                </div>
                <div className="identity-metric">
                  <span>Status</span>
                  <strong>Active</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-stack">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Personal information</div>
                  <div className="card-subtitle">Refresh the basics that identify your account.</div>
                </div>
              </div>

              <div className="card-body">
                {profileMsg && (
                  <div className={`alert alert-${profileMsg.error ? 'error' : 'success'}`}>{profileMsg.text}</div>
                )}

                <form onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label className="form-label">Full name</label>
                    <input
                      className="form-input"
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <div className="readonly-field">
                      {user?.role} <span>Role changes are managed by administrators.</span>
                    </div>
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? <><span className="spinner" /> Saving...</> : 'Save changes'}
                  </button>
                </form>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Password and access</div>
                  <div className="card-subtitle">Rotate your password when you want a fresh lock on the account.</div>
                </div>
              </div>

              <div className="card-body">
                {pwMsg && <div className={`alert alert-${pwMsg.error ? 'error' : 'success'}`}>{pwMsg.text}</div>}

                <form onSubmit={handlePwSave}>
                  {[
                    ['currentPassword', 'Current password'],
                    ['newPassword', 'New password'],
                    ['confirm', 'Confirm new password'],
                  ].map(([key, label]) => (
                    <div className="form-group" key={key}>
                      <label className="form-label">{label}</label>
                      <input
                        className="form-input"
                        type="password"
                        value={pwForm[key]}
                        onChange={(event) => setPwForm((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder="Enter password"
                      />
                    </div>
                  ))}

                  <button className="btn btn-primary" type="submit" disabled={savingPw}>
                    {savingPw ? <><span className="spinner" /> Updating...</> : 'Update password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
