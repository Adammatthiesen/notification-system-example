/**
 * NotificationPanel Client-Side Logic
 * 
 * Handles all client-side interactions for the notification panel including:
 * - Opening/closing the panel
 * - Fetching notifications from the API
 * - Dismissing individual notifications
 * - Updating the notification count badge
 * - Managing panel state and animations
 */

interface NotificationEntry {
  id: number;
  userId: string | null;
  title: string;
  role: string;
  message: string;
  dismissed: string[];
  createdAt: string;
}

interface NotificationResponse {
  notifications: NotificationEntry[];
  count: number;
}

class NotificationPanel {
  private userId: string;
  private userRole: string;
  private panel: HTMLElement;
  private overlay: HTMLElement;
  private bell: HTMLElement;
  private badge: HTMLElement;
  private closeButton: HTMLElement;
  private retryButton: HTMLElement | null;
  private notificationsList: HTMLElement;
  private loadingState: HTMLElement;
  private errorState: HTMLElement;
  private emptyState: HTMLElement;
  private isOpen = false;
  private notifications: NotificationEntry[] = [];

  constructor() {
    // Get DOM elements
    this.panel = document.getElementById('notification-panel') as HTMLElement;
    this.overlay = document.getElementById('notification-overlay') as HTMLElement;
    this.bell = document.getElementById('notification-bell') as HTMLElement;
    this.badge = document.getElementById('notification-count') as HTMLElement;
    this.closeButton = document.getElementById('close-panel') as HTMLElement;
    this.retryButton = document.getElementById('retry-button');
    this.notificationsList = document.getElementById('notifications-list') as HTMLElement;
    this.loadingState = document.getElementById('loading-state') as HTMLElement;
    this.errorState = document.getElementById('error-state') as HTMLElement;
    this.emptyState = document.getElementById('empty-state') as HTMLElement;

    // Get user data from button attributes
    this.userId = this.bell.dataset.userId || '';
    this.userRole = this.bell.dataset.userRole || '';

    if (!this.userId || !this.userRole) {
      console.error('NotificationPanel: userId and userRole are required');
      return;
    }

    this.init();
  }

  private init(): void {
    // Set up event listeners
    this.bell.addEventListener('click', () => this.togglePanel());
    this.closeButton.addEventListener('click', () => this.closePanel());
    this.overlay.addEventListener('click', () => this.closePanel());
    
    if (this.retryButton) {
      this.retryButton.addEventListener('click', () => this.loadNotifications());
    }

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePanel();
      }
    });

    // Focus trap for accessibility
    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabKey(e);
      }
    });

    // Initial load
    this.loadNotifications();

    // Optional: Poll for new notifications every 30 seconds
    setInterval(() => this.loadNotifications(true), 30000);
  }

  private async togglePanel(): Promise<void> {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  private openPanel(): void {
    this.isOpen = true;
    this.panel.classList.add('open');
    this.overlay.classList.add('active');
    this.bell.setAttribute('aria-expanded', 'true');
    
    // Focus the close button for accessibility
    setTimeout(() => {
      this.closeButton.focus();
    }, 300);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  private closePanel(): void {
    this.isOpen = false;
    this.panel.classList.remove('open');
    this.overlay.classList.remove('active');
    this.bell.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to bell button
    this.bell.focus();
  }

  private async loadNotifications(silent = false): Promise<void> {
    try {
      // Show loading state only if not silent refresh
      if (!silent) {
        this.showState('loading');
      }

      const response = await fetch(
        `/api/notifications?userId=${encodeURIComponent(this.userId)}&role=${encodeURIComponent(this.userRole)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data: NotificationResponse = await response.json();
      this.notifications = data.notifications;

      this.updateBadge(data.count);

      if (data.notifications.length === 0) {
        this.showState('empty');
      } else {
        this.showState('list');
        this.renderNotifications();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      if (!silent) {
        this.showState('error');
      }
    }
  }

  private showState(state: 'loading' | 'error' | 'empty' | 'list'): void {
    // Hide all states
    this.loadingState.style.display = 'none';
    this.errorState.style.display = 'none';
    this.emptyState.style.display = 'none';
    this.notificationsList.style.display = 'none';

    // Show requested state
    switch (state) {
      case 'loading':
        this.loadingState.style.display = 'flex';
        break;
      case 'error':
        this.errorState.style.display = 'flex';
        break;
      case 'empty':
        this.emptyState.style.display = 'flex';
        break;
      case 'list':
        this.notificationsList.style.display = 'block';
        break;
    }
  }

  private updateBadge(count: number): void {
    this.badge.textContent = count > 99 ? '99+' : count.toString();
    
    if (count > 0) {
      this.badge.classList.add('has-notifications');
      this.bell.setAttribute('aria-label', `Open notifications (${count} unread)`);
    } else {
      this.badge.classList.remove('has-notifications');
      this.bell.setAttribute('aria-label', 'Open notifications');
    }
  }

  private renderNotifications(): void {
    this.notificationsList.innerHTML = '';

    this.notifications.forEach((notification) => {
      const item = this.createNotificationItem(notification);
      this.notificationsList.appendChild(item);
    });
  }

  private createNotificationItem(notification: NotificationEntry): HTMLElement {
    const item = document.createElement('article');
    item.className = 'notification-item';
    item.dataset.notificationId = notification.id.toString();

    // Check if notification is less than 24 hours old
    const isNew = this.isNotificationNew(notification.createdAt);
    if (isNew) {
      item.classList.add('is-new');
    }

    // Check if notification is user-specific
    const isSpecific = notification.userId !== null;
    if (isSpecific) {
      item.classList.add('is-specific');
    }

    const timestamp = this.formatTimestamp(notification.createdAt);

    item.innerHTML = `
      <div class="notification-item-header">
        <h3 class="notification-item-title">${this.escapeHtml(notification.title)}</h3>
        <button 
          class="notification-item-dismiss" 
          aria-label="Dismiss notification"
          data-notification-id="${notification.id}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <p class="notification-item-message">${this.escapeHtml(notification.message)}</p>
      <div class="notification-item-footer">
        <div class="notification-item-meta">
          <span class="notification-role-badge role-${notification.role}">
            ${notification.role}
          </span>
          ${isSpecific ? `
            <span class="notification-specific-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              For you
            </span>
          ` : ''}
        </div>
        <span class="notification-timestamp">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${timestamp}
        </span>
      </div>
    `;

    // Add dismiss handler
    const dismissButton = item.querySelector('.notification-item-dismiss') as HTMLElement;
    dismissButton.addEventListener('click', () => this.dismissNotification(notification.id));

    return item;
  }

  private async dismissNotification(notificationId: number): Promise<void> {
    try {
      const item = document.querySelector(`[data-notification-id="${notificationId}"]`) as HTMLElement;
      const dismissButton = item?.querySelector('.notification-item-dismiss') as HTMLButtonElement;

      if (dismissButton) {
        dismissButton.disabled = true;
      }

      // Add dismissing animation
      if (item) {
        item.classList.add('dismissing');
      }

      const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: this.userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss notification');
      }

      // Wait for animation to complete
      setTimeout(() => {
        // Remove notification from local state
        this.notifications = this.notifications.filter((n) => n.id !== notificationId);

        // Update UI
        this.updateBadge(this.notifications.length);

        if (this.notifications.length === 0) {
          this.showState('empty');
        } else {
          // Remove the item from DOM
          if (item) {
            item.remove();
          }
        }
      }, 300);
    } catch (error) {
      console.error('Error dismissing notification:', error);
      
      // Re-enable button on error
      const item = document.querySelector(`[data-notification-id="${notificationId}"]`) as HTMLElement;
      const dismissButton = item?.querySelector('.notification-item-dismiss') as HTMLButtonElement;
      
      if (dismissButton) {
        dismissButton.disabled = false;
      }
      
      if (item) {
        item.classList.remove('dismissing');
      }

      // Show error message (you could make this more user-friendly)
      alert('Failed to dismiss notification. Please try again.');
    }
  }

  private isNotificationNew(createdAt: string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  }

  private formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private handleTabKey(e: KeyboardEvent): void {
    if (!this.isOpen) return;

    const focusableElements = this.panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
}

// Initialize the notification panel when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new NotificationPanel();
  });
} else {
  new NotificationPanel();
}
