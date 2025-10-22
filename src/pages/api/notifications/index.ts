import type { APIRoute } from 'astro';
import { db, Notification, eq, and, or, isNull, sql } from 'astro:db';

/**
 * GET /api/notifications
 * 
 * Retrieves notifications for the current user based on their role.
 * 
 * Query Parameters:
 * - userId: The ID of the current user (required)
 * - role: The role of the current user (required: 'admin', 'editor', 'user')
 * 
 * Returns:
 * - Array of notifications that:
 *   1. Match the user's role or are marked as 'all'
 *   2. Are either for all users (userId is null) or specifically for this user
 *   3. Have not been dismissed by this user
 * 
 * Example: GET /api/notifications?userId=user-1&role=admin
 */
export const GET: APIRoute = async ({ url, request }) => {
  try {
    const userId = url.searchParams.get('userId');
    const userRole = url.searchParams.get('role');

    if (!userId || !userRole) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: userId and role' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Query notifications that match the user's role and haven't been dismissed
    const notifications = await db
      .select()
      .from(Notification)
      .where(
        and(
          // Check if notification is for user's role or 'all'
          or(
            eq(Notification.role, userRole),
            eq(Notification.role, 'all')
          ),
          // Check if notification is global or specific to this user
          or(
            isNull(Notification.userId),
            eq(Notification.userId, userId)
          )
        )
      )
      .orderBy(sql`${Notification.createdAt} DESC`);

    // Filter out notifications that have been dismissed by this user
    const activeNotifications = notifications.filter(notification => {
      const dismissedUsers = Array.isArray(notification.dismissed) 
        ? notification.dismissed 
        : [];
      return !dismissedUsers.includes(userId);
    });

    return new Response(
      JSON.stringify({
        notifications: activeNotifications,
        count: activeNotifications.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * POST /api/notifications
 * 
 * Creates a new notification (admin only).
 * 
 * Request Body (JSON):
 * {
 *   "title": "Notification title",
 *   "message": "Notification message",
 *   "role": "admin|editor|user|all",
 *   "userId": "optional-specific-user-id",
 *   "currentUserRole": "admin" // Must be admin to create
 * }
 * 
 * Returns:
 * - Created notification object
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, message, role, userId, currentUserRole } = body;

    // Authorization check - only admins can create notifications
    if (currentUserRole !== 'admin') {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized: Only admins can create notifications' 
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validation
    if (!title || !message || !role) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: title, message, role' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate role
    const validRoles = ['admin', 'editor', 'user', 'all'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the next ID
    const maxIdResult = await db
      .select({ maxId: sql<number>`MAX(${Notification.id})` })
      .from(Notification);
    const nextId = (maxIdResult[0]?.maxId || 0) + 1;

    // Insert notification
    const [newNotification] = await db
      .insert(Notification)
      .values({
        id: nextId,
        title,
        message,
        role,
        userId: userId || null,
        dismissed: [],
        createdAt: new Date(),
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        notification: newNotification
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
