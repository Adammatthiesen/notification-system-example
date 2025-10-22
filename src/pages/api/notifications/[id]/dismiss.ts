import type { APIRoute } from 'astro';
import { db, Notification, eq } from 'astro:db';

/**
 * POST /api/notifications/[id]/dismiss
 * 
 * Dismisses a notification for the current user.
 * The notification is not deleted but the user's ID is added to the dismissed array.
 * 
 * URL Parameters:
 * - id: The notification ID to dismiss
 * 
 * Request Body (JSON):
 * {
 *   "userId": "current-user-id"
 * }
 * 
 * Returns:
 * - Success message with updated notification
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const notificationId = params.id ? parseInt(params.id) : null;

    if (!notificationId) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid notification ID' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: userId' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the notification
    const [notification] = await db
      .select()
      .from(Notification)
      .where(eq(Notification.id, notificationId))
      .limit(1);

    if (!notification) {
      return new Response(
        JSON.stringify({ 
          error: 'Notification not found' 
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get current dismissed users list
    const dismissedUsers = Array.isArray(notification.dismissed) 
      ? notification.dismissed 
      : [];

    // Check if user already dismissed this notification
    if (dismissedUsers.includes(userId)) {
      return new Response(
        JSON.stringify({ 
          message: 'Notification already dismissed',
          notification 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Add user to dismissed list
    const updatedDismissed = [...dismissedUsers, userId];

    // Update the notification
    const [updatedNotification] = await db
      .update(Notification)
      .set({ dismissed: updatedDismissed })
      .where(eq(Notification.id, notificationId))
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification dismissed successfully',
        notification: updatedNotification
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to dismiss notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
