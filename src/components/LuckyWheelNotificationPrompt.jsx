import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  enableLuckyWheelPushNotifications,
  shouldShowLuckyWheelNotificationPrompt,
} from '../utils/pushNotifications.js';
import './LuckyWheelNotificationPrompt.css';

const HIDE_KEY = '7xbet.luckyWheelNotificationPromptHidden';

export default function LuckyWheelNotificationPrompt() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;

    const hidden = localStorage.getItem(HIDE_KEY) === 'true';
    setVisible(!hidden && shouldShowLuckyWheelNotificationPrompt(user));
  }, [user, loading]);

  const handleClose = () => {
    localStorage.setItem(HIDE_KEY, 'true');
    setVisible(false);
  };

  const handleEnable = async () => {
    setSaving(true);

    try {
      const result = await enableLuckyWheelPushNotifications();

      if (result.enabled) {
        toast.success('Lucky Wheel notification enabled');
        setVisible(false);
        return;
      }

      toast.error('Notification could not be enabled');
    } catch (error) {
      toast.error(error?.message || 'Notification permission failed');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="lucky-push-prompt">
      <button type="button" className="lucky-push-close" onClick={handleClose} aria-label="Close">
        <X size={16} />
      </button>
      <div className="lucky-push-icon">
        <Bell size={22} />
      </div>
      <div className="lucky-push-copy">
        <strong>Lucky Wheel Ready</strong>
        <span>Allow notification to know when your free spin is ready.</span>
      </div>
      <button type="button" className="lucky-push-btn" onClick={handleEnable} disabled={saving}>
        {saving ? 'Please wait...' : 'Allow'}
      </button>
    </div>
  );
}
