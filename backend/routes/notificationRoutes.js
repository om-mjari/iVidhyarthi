const express = require("express");
const router = express.Router();
const Notification = require("../models/Tbl_Notifications");

// Get notifications for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📬 Fetching notifications for user: ${userId}`);

    const notifications = await Notification.find({ User_Id: userId })
      .sort({ Created_At: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n) => !n.Is_Read).length;

    console.log(
      `✅ Found ${notifications.length} notifications (${unreadCount} unread)`
    );

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
});

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Marking notification as read: ${id}`);

    const notification = await Notification.findOneAndUpdate(
      { Notification_Id: id },
      { Is_Read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification",
      error: error.message,
    });
  }
});

// Mark all notifications as read for a user
router.put("/user/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`✅ Marking all notifications as read for user: ${userId}`);

    await Notification.updateMany({ User_Id: userId }, { Is_Read: true });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notifications",
      error: error.message,
    });
  }
});

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting notification: ${id}`);

    const notification = await Notification.findOneAndDelete({
      Notification_Id: id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
});

module.exports = router;
