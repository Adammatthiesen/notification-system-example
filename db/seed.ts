import { db, Notification, User } from 'astro:db';

export default async function seed() {
  // Seed demo users with different roles
  await db.insert(User).values([
    {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    },
    {
      id: 'user-2',
      email: 'editor@example.com',
      name: 'Editor User',
      role: 'editor',
    },
    {
      id: 'user-3',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
    },
  ]);

  // Seed sample notifications
  await db.insert(Notification).values([
    {
      id: 1,
      userId: null, // Available to all admins
      title: 'System Maintenance Scheduled',
      role: 'admin',
      message: 'Server maintenance is scheduled for tomorrow at 2 AM UTC. Please inform your users.',
      dismissed: [],
      createdAt: new Date('2025-10-20T10:00:00Z'),
    },
    {
      id: 2,
      userId: null, // Available to all editors
      title: 'New Content Guidelines',
      role: 'editor',
      message: 'Updated content guidelines are now available. Please review before publishing new content.',
      dismissed: [],
      createdAt: new Date('2025-10-20T14:30:00Z'),
    },
    {
      id: 3,
      userId: null, // Available to all users
      title: 'Welcome to the CMS!',
      role: 'all',
      message: 'Thank you for joining our platform. Explore the features and let us know if you have questions.',
      dismissed: [],
      createdAt: new Date('2025-10-21T08:00:00Z'),
    },
    {
      id: 4,
      userId: 'user-1', // Specific to admin user
      title: 'Security Alert',
      role: 'admin',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100. Please investigate.',
      dismissed: [],
      createdAt: new Date('2025-10-21T09:15:00Z'),
    },
    {
      id: 5,
      userId: null, // Available to all editors
      title: 'Editorial Meeting Tomorrow',
      role: 'editor',
      message: 'Don\'t forget: editorial team meeting tomorrow at 10 AM in Conference Room B.',
      dismissed: [],
      createdAt: new Date('2025-10-21T11:45:00Z'),
    },
  ]);
}
