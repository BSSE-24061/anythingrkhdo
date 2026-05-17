<<<<<<< HEAD
import { useEffect, useState, useRef } from 'react';
import { notificationApi } from '../utils/apiHelper';
import { getStoredUser } from '../utils/session';
import { playNotificationSound } from '../utils/notificationSound';
import { formatIslamabadDateTime } from '../utils/dateTime';
=======
import { useEffect, useState } from 'react';
import { notificationApi } from '../utils/apiHelper';
import { getStoredUser } from '../utils/session';
import { playNotificationSound } from '../utils/notificationSound';
>>>>>>> parent of 42a0ed9 (push)

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
<<<<<<< HEAD
    const prevUnreadRef = useRef(0);
=======
>>>>>>> parent of 42a0ed9 (push)
    const user = getStoredUser();

    useEffect(() => {
        if (!user?.id) return;

        const loadNotifications = async () => {
            try {
                const response = await notificationApi.list(user.id);
                const allNotifications = response.data || [];
                const unread = allNotifications.filter(n => !n.is_read);
                setNotifications(allNotifications.slice(0, 10)); // Show last 10
                setUnreadCount(unread.length);

                // Play sound if there are new unread notifications
<<<<<<< HEAD
                if (unread.length > prevUnreadRef.current) {
                    playNotificationSound();
                }
                prevUnreadRef.current = unread.length;
=======
                if (unread.length > 0) {
                    playNotificationSound();
                }
>>>>>>> parent of 42a0ed9 (push)
            } catch (error) {
                console.error('Error loading notifications:', error);
            }
        };

        loadNotifications();
        const interval = setInterval(loadNotifications, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [user?.id]);

    const markAsRead = async (notificationId) => {
        try {
            await notificationApi.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            for (const notif of notifications.filter(n => !n.is_read)) {
                await notificationApi.markAsRead(notif.notification_id);
            }
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                title="Notifications"
            >
                {/* Bell Icon */}
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: '#475569' }}
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            background: '#ef4444',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            border: '2px solid #fff',
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 40,
                        }}
                    />

                    {/* Dropdown Menu */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            width: '360px',
                            maxHeight: '500px',
                            background: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                            zIndex: 50,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: '16px',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#3b82f6',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        padding: '4px 8px',
                                    }}
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                maxHeight: '420px',
                            }}
                        >
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div
                                        key={notif.notification_id}
                                        onClick={() => !notif.is_read && markAsRead(notif.notification_id)}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid #f1f5f9',
                                            background: notif.is_read ? '#fff' : '#f0f9ff',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={e => {
                                            if (!notif.is_read) e.currentTarget.style.background = '#e0f2fe';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = notif.is_read ? '#fff' : '#f0f9ff';
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {!notif.is_read && (
                                                <div
                                                    style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: '#3b82f6',
                                                        marginTop: '6px',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p
                                                    style={{
                                                        margin: '0 0 4px 0',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        color: '#0f172a',
                                                    }}
                                                >
                                                    {notif.title}
                                                </p>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: '13px',
                                                        color: '#64748b',
                                                        lineHeight: '1.4',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: '2',
                                                        WebkitBoxOrient: 'vertical',
                                                    }}
                                                >
                                                    {notif.body}
                                                </p>
                                                <p
                                                    style={{
                                                        margin: '4px 0 0 0',
                                                        fontSize: '12px',
                                                        color: '#94a3b8',
                                                    }}
                                                >
<<<<<<< HEAD
                                                    {formatIslamabadDateTime(notif.created_at)}
=======
                                                    {new Date(notif.created_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
>>>>>>> parent of 42a0ed9 (push)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div
                                    style={{
                                        padding: '40px 16px',
                                        textAlign: 'center',
                                        color: '#94a3b8',
                                    }}
                                >
                                    <svg
                                        width="40"
                                        height="40"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        style={{ margin: '0 auto 12px', opacity: '0.5' }}
                                    >
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                    <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
