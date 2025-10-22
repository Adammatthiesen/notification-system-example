import { defineDb, defineTable, column } from 'astro:db';

/**
 * Notifications table schema for storing user notifications
 * 
 * Fields:
 * - id: Unique identifier (auto-incremented primary key)
 * - userId: Reference to the user who should see this notification
 * - title: Short notification title
 * - role: Target role (admin, editor, user) - determines who can see the notification
 * - message: Full notification message content
 * - dismissed: Array of user IDs who have dismissed this notification (JSON)
 * - createdAt: Timestamp when notification was created
 */
const Notification = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    userId: column.text({ optional: true }), // If null, notification is for all users with matching role
    title: column.text(),
    role: column.text(), // 'admin', 'editor', 'user', or 'all'
    message: column.text(),
    dismissed: column.json({ default: [] }), // Array of user IDs who dismissed this
    createdAt: column.date({ default: new Date() }),
  }
});

/**
 * Optional Users table for demo purposes
 * In production, this would integrate with your existing user management system
 */
const User = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    email: column.text({ unique: true }),
    name: column.text(),
    role: column.text(), // 'admin', 'editor', 'user'
    createdAt: column.date({ default: new Date() }),
  }
});

export default defineDb({
  tables: { Notification, User },
});
