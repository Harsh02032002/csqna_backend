import Notifications from "../models/Notifications.js";

export async function logNotification(user, message, details = {}, type = "info") {
    try {
        if (!user) {
            console.error("No user provided for the notification.");
            return;
        }

        const notification = new Notifications ({
            user: user._id,
            message,
            type,
            details,
        });

        await notification.save();
        // console.log("Notification logged successfully:", notification);
    } catch (err) {
        console.error("Error logging notification:", err);
    }
}