import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './NotificationBell.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const resp = await axios.get(`${API_URL}/notifications`);
      setNotifications(resp.data.slice(0, 10));
    } catch (err) {
      // silently fail
    }
  };

  const unread = notifications.filter(n => !n.read).length;

  const handleRead = async (notif) => {
    if (!notif.read) {
      try {
        await axios.post(`${API_URL}/notifications/read/${notif.id}`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      } catch (err) { /* ignore */ }
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAll = async () => {
    try {
      await axios.post(`${API_URL}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { /* ignore */ }
  };

  return (
    <div className="notification-bell-wrap" ref={dropdownRef}>
      <button
        className="bell-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && <span className="unread-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notifications-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unread > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAll}>Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            <div className="notif-list">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? '' : ' unread'}`}
                  onClick={() => handleRead(n)}
                >
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
