import React, { useState, useEffect, useRef } from 'react';
import './NotificationBell.css';

const NotificationBell = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`http://localhost:5000/api/notifications/user/${userId}`);
            const result = await response.json();
            if (result.success) {
                setNotifications(result.notifications);
                setUnreadCount(result.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`http://localhost:5000/api/notifications/user/${userId}/read-all`, { method: 'PUT' });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button className="bell-btn" onClick={() => setIsOpen(!isOpen)}>
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notifications-dropdown">
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={markAllAsRead}>Mark all as read</button>
                        )}
                    </div>
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <p className="no-notifications">No notifications yet</p>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    className={`notification-item ${notif.Is_Read ? 'read' : 'unread'}`}
                                    onClick={() => markAsRead(notif.Notification_Id)}
                                >
                                    <div className="notif-content">
                                        <p className="notif-title">{notif.Title}</p>
                                        <p className="notif-message">{notif.Message}</p>
                                        <span className="notif-time">
                                            {new Date(notif.Created_At).toLocaleString()}
                                        </span>
                                    </div>
                                    {!notif.Is_Read && <span className="unread-dot"></span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
