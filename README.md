# Astro Notification System

<img width="2331" height="1203" alt="image" src="https://github.com/user-attachments/assets/0a621a65-c596-4188-8a19-d620010c345a" />

A lightweight, customizable notification panel system for Astro-based Content Management Systems (CMS). This system provides role-based notifications with individual dismissal functionality, built using Astro, AstroDB, and vanilla CSS/JavaScript.

## Features

- ✅ **Role-Based Notifications**: Target notifications to specific user roles (admin, editor, user, or all)
- ✅ **Individual Dismissal**: Users can dismiss notifications independently without affecting others
- ✅ **User-Specific Notifications**: Send notifications to individual users or broadcast to all users with a specific role
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ✅ **Accessible**: Built with WCAG 2.1 AA accessibility standards in mind
- ✅ **Lightweight**: Pure vanilla CSS and TypeScript - no heavy dependencies
- ✅ **Smooth Animations**: CSS-based animations with respect for `prefers-reduced-motion`
- ✅ **Real-time Updates**: Optional polling for new notifications
- ✅ **Easy Integration**: Simple drop-in component that works with any user management system

## Architecture

### Components

```
notification-system/
├── db/
│   ├── config.ts          # AstroDB schema definitions
│   └── seed.ts            # Sample data for development
├── src/
│   ├── components/
│   │   └── NotificationPanel.astro   # Main notification panel component
│   ├── pages/
│   │   └── api/
│   │       └── notifications/
│   │           ├── index.ts          # GET/POST notifications
│   │           └── [id]/
│   │               └── dismiss.ts    # Dismiss notification
│   ├── scripts/
│   │   └── NotificationPanel.client.ts  # Client-side logic
│   └── styles/
│       └── notification-item.css     # Notification item styles
```

## Installation

### 1. Prerequisites

- Astro project (v4.0 or later)
- Node.js (v18 or later)
- AstroDB integration

### 2. Install Dependencies

```bash
# Install Astro DB if not already installed
npx astro add db

# For SSR support (recommended for API routes)
npx astro add node  # or your preferred adapter
```

### 3. Configure Astro

Update your `astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server', // or 'hybrid'
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [db()]
});
```

### 4. Copy Files

Copy the following files to your project:

1. **Database Schema**: Copy `db/config.ts` and `db/seed.ts`
2. **API Routes**: Copy the `src/pages/api/notifications` directory
3. **Component**: Copy `src/components/NotificationPanel.astro`
4. **Client Script**: Copy `src/scripts/NotificationPanel.client.ts`
5. **Styles**: Copy `src/styles/notification-item.css`

### 5. Initialize Database

```bash
# For local development
npm run astro db push

# For production (with remote DB)
npm run astro db push --remote
```

## Usage

### Basic Integration

Add the notification panel to your layout or page:

```astro
---
// src/layouts/MainLayout.astro
import NotificationPanel from '../components/NotificationPanel.astro';

// Get current user from your auth system
const user = Astro.locals.user; // or however you access user data
---

<html>
  <head>
    <title>My CMS</title>
    <link rel="stylesheet" href="/src/styles/notification-item.css" />
  </head>
  <body>
    <header>
      <nav>
        <!-- Your navigation -->
        
        <!-- Add notification panel -->
        {user && (
          <NotificationPanel 
            userId={user.id} 
            userRole={user.role}
            position="right"
          />
        )}
      </nav>
    </header>
    
    <main>
      <slot />
    </main>

    <!-- Include client script -->
    <script src="/src/scripts/NotificationPanel.client.ts"></script>
  </body>
</html>
```

### Component Props

| Prop        | Type                            | Required | Default   | Description                      |
| ----------- | ------------------------------- | -------- | --------- | -------------------------------- |
| `userId`    | `string`                        | Yes      | -         | Current user's unique identifier |
| `userRole`  | `'admin' \| 'editor' \| 'user'` | Yes      | -         | Current user's role              |
| `position`  | `'right' \| 'left'`             | No       | `'right'` | Panel slide-in position          |
| `maxHeight` | `string`                        | No       | `'80vh'`  | Maximum panel height (CSS value) |

## Integrating with Your User Management System

The notification system is designed to work with any user management system. You need to:

### 1. Map Your User Data

Adapt the component props to your user model:

```astro
---
// Example with Supabase
import { getUser } from '../lib/supabase';

const supabaseUser = await getUser(Astro.cookies);
const mappedUser = {
  id: supabaseUser.id,
  role: supabaseUser.user_metadata.role // 'admin', 'editor', or 'user'
};
---

<NotificationPanel 
  userId={mappedUser.id} 
  userRole={mappedUser.role}
/>
```

```astro
---
// Example with Firebase
import { getAuth } from 'firebase-admin/auth';

const auth = getAuth();
const token = Astro.cookies.get('session')?.value;
const user = await auth.verifyIdToken(token);

const mappedUser = {
  id: user.uid,
  role: user.customClaims?.role || 'user'
};
---

<NotificationPanel 
  userId={mappedUser.id} 
  userRole={mappedUser.role}
/>
```

### 2. Sync with Existing Users (Optional)

If you want to use the built-in User table, sync your existing users:

```typescript
// src/scripts/sync-users.ts
import { db, User } from 'astro:db';

export async function syncUser(user: YourUserType) {
  await db.insert(User).values({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: new Date(),
  }).onConflictDoUpdate({
    target: User.id,
    set: {
      email: user.email,
      name: user.name,
      role: user.role,
    }
  });
}
```

Or simply use your existing user table and modify the database schema accordingly.

## API Reference

### GET `/api/notifications`

Fetch notifications for the current user.

**Query Parameters:**
- `userId` (required): User's unique identifier
- `role` (required): User's role (`admin`, `editor`, `user`)

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "userId": null,
      "title": "System Maintenance",
      "role": "admin",
      "message": "Scheduled maintenance tomorrow at 2 AM UTC",
      "dismissed": [],
      "createdAt": "2025-10-21T10:00:00Z"
    }
  ],
  "count": 1
}
```

### POST `/api/notifications`

Create a new notification (admin only).

**Request Body:**
```json
{
  "title": "New Feature Released",
  "message": "Check out our new dashboard feature!",
  "role": "all",
  "userId": null,
  "currentUserRole": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": 6,
    "userId": null,
    "title": "New Feature Released",
    "role": "all",
    "message": "Check out our new dashboard feature!",
    "dismissed": [],
    "createdAt": "2025-10-21T12:00:00Z"
  }
}
```

### POST `/api/notifications/[id]/dismiss`

Dismiss a notification for the current user.

**URL Parameters:**
- `id`: Notification ID

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification dismissed successfully",
  "notification": {
    "id": 1,
    "dismissed": ["user-123"]
  }
}
```

## Creating Notifications

### From Server-Side Code

```typescript
// src/pages/api/some-action.ts
import { db, Notification } from 'astro:db';

export async function POST({ request }) {
  // Your action logic...
  
  // Create notification for all admins
  await db.insert(Notification).values({
    title: 'Action Required',
    message: 'A user has submitted a new form',
    role: 'admin',
    userId: null, // null = all users with role
    dismissed: [],
    createdAt: new Date(),
  });
  
  return new Response('Success');
}
```

### From Admin Dashboard

Create an admin interface to send notifications:

```astro
---
// src/pages/admin/notifications.astro
import Layout from '../../layouts/MainLayout.astro';
---

<Layout>
  <h1>Send Notification</h1>
  <form id="notification-form">
    <label>
      Title:
      <input type="text" name="title" required />
    </label>
    
    <label>
      Message:
      <textarea name="message" required></textarea>
    </label>
    
    <label>
      Role:
      <select name="role" required>
        <option value="all">All Users</option>
        <option value="admin">Admins</option>
        <option value="editor">Editors</option>
        <option value="user">Users</option>
      </select>
    </label>
    
    <label>
      Specific User ID (optional):
      <input type="text" name="userId" />
    </label>
    
    <button type="submit">Send Notification</button>
  </form>

  <script>
    const form = document.getElementById('notification-form');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          message: formData.get('message'),
          role: formData.get('role'),
          userId: formData.get('userId') || null,
          currentUserRole: 'admin', // Get from session
        }),
      });
      
      if (response.ok) {
        alert('Notification sent!');
        form.reset();
      }
    });
  </script>
</Layout>
```

## Customization

### Polling Interval

Adjust the notification polling interval in `NotificationPanel.client.ts`:

```typescript
// Change from 30 seconds to 60 seconds
setInterval(() => this.loadNotifications(true), 60000);
```

### Custom Notification Types

Extend the database schema to support custom notification types:

```typescript
// db/config.ts
const Notification = defineTable({
  columns: {
    // ... existing columns
    type: column.text({ default: 'info' }), // 'info', 'warning', 'success', 'error'
    actionUrl: column.text({ optional: true }),
    actionLabel: column.text({ optional: true }),
  }
});
```

## Security Considerations

1. **Authentication**: Always verify user identity before serving notifications
2. **Authorization**: Ensure only admins can create notifications
3. **Rate Limiting**: Consider implementing rate limiting on API endpoints
4. **Input Validation**: Validate and sanitize all user input
5. **CSRF Protection**: Implement CSRF tokens for state-changing operations

## Accessibility

The notification system is built with accessibility in mind:

- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader announcements
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Semantic HTML

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

## Troubleshooting

### Notifications not loading

1. Check browser console for errors
2. Verify API routes are accessible
3. Ensure user data (userId, userRole) is being passed correctly
4. Check database connection

### Dismiss not working

1. Verify POST request is reaching the API
2. Check userId matches between request and user session
3. Ensure notification ID exists in database

### Styling issues

1. Confirm CSS files are imported correctly
2. Check for CSS conflicts with existing styles
3. Verify browser DevTools for applied styles

## Performance Tips

1. **Database Indexing**: Add indexes on frequently queried columns:
   ```typescript
   // db/config.ts
   const Notification = defineTable({
     columns: { /* ... */ },
     indexes: {
       roleIdx: ['role'],
       userIdIdx: ['userId'],
       createdAtIdx: ['createdAt'],
     }
   });
   ```

2. **Pagination**: For large notification volumes, implement pagination
3. **Caching**: Consider caching notification counts
4. **Cleanup**: Periodically delete old dismissed notifications

## License

MIT License - feel free to use this in your projects!

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### Version 1.0.0 (2025-10-21)
- Initial release
- Role-based notifications
- Individual dismissal functionality
- Responsive design
- Accessibility features
- Comprehensive documentation
