# Follow System & Notifications Implementation

## Overview
This document describes the Instagram-like follow system and mobile notification system implemented for HoopLink.

## Follow System

### Core Features
- **Follow/Unfollow**: Users can follow/unfollow other users with a single click
- **Real-time Stats**: Track followers, following, and mutual followers
- **Follow Suggestions**: Smart suggestions based on who your followers follow
- **Bulk Actions**: Follow/unfollow multiple users at once (e.g., team rosters)
- **Achievements & Gamification**: Automatic point awards and achievement checks on follow actions

### Key Files
- `lib/follow-system.ts` - Core follow system utilities
- `lib/user-profile.ts` - User profile management including `toggleFollowUser()`
- `components/FollowButton.tsx` - Reusable follow button component
- `components/FollowList.tsx` - Followers/Following list display
- `components/FollowSuggestions.tsx` - Smart follow suggestions widget

### How It Works
1. User clicks "Follow" button on a profile
2. `toggleFollowUser()` updates both users' Firestore documents:
   - Adds target UID to current user's `following` array
   - Adds current user's UID to target user's `followers` array
3. Creates a notification for the target user
4. Awards 5 points to the user who followed
5. Updates activity streak and checks for achievements

## Notification System

### Core Features
- **Real-time Notifications**: Firestore onSnapshot listeners for instant updates
- **Smart Grouping**: Groups similar notifications (e.g., "5 new followers")
- **Priority Levels**: Urgent, important, and info categories
- **Action Buttons**: Quick actions like "Follow back" directly from notifications
- **Read/Archive/Snooze**: Full notification management
- **Category Filtering**: Filter by social, recruiting, messages, etc.

### Key Files
- `lib/notifications.ts` - Core notification utilities
- `app/notifications/page.tsx` - Full notification center UI
- `components/NotificationBell.tsx` - Bell icon with unread count badge
- `app/api/notifications/push/route.ts` - Push notification API endpoint
- `app/api/notifications/send/route.ts` - Send push notifications API

### Notification Types
- `follow` - When someone follows you
- `like` - When someone likes your post
- `comment` - When someone comments on your post
- `mention` - When someone mentions you
- `message` - When you receive a new message
- `booking` - Booking updates
- `profile_view` - When someone views your profile
- And many more...

## Mobile Push Notifications

### Features
- **Web Push API**: Uses browser's native push notification support
- **Service Worker**: Handles push events and notification display
- **Permission Management**: Request and track notification permissions
- **Token Storage**: Stores push subscription tokens in localStorage
- **Deep Linking**: Notifications link to relevant app sections

### Key Files
- `hooks/usePushNotifications.ts` - React hook for push notification management
- `public/sw.js` - Service worker for push event handling
- `capacitor.config.json` - Capacitor mobile app configuration

### How It Works
1. User grants notification permission
2. App subscribes to push notifications via Service Worker
3. Push subscription token is stored in localStorage
4. When a notification is created in Firestore:
   - In-app notification appears instantly via Firestore listener
   - Push notification is sent to user's device (requires push service integration)
5. User clicks notification → opens app to relevant page

## Integration Points

### Follow Button Component
```tsx
import { FollowButton } from "@/components/FollowButton";

<FollowButton
  targetUid="user123"
  isFollowing={false}
  onFollowChange={(isFollowing) => console.log(isFollowing)}
  displayName="John Doe"
/>
```

### Notification Bell Component
```tsx
import { NotificationBell } from "@/components/NotificationBell";

// Add to navbar or bottom nav
<NotificationBell />
```

### Using Push Notifications Hook
```tsx
import { usePushNotifications } from "@/hooks/usePushNotifications";

function MyComponent() {
  const { 
    supported, 
    permission, 
    token, 
    requestPermission, 
    unregister 
  } = usePushNotifications();

  // Request permission on user action
  const enableNotifications = async () => {
    const token = await requestPermission();
    if (token) {
      // Send token to backend to store in Firestore
      await fetch('/api/notifications/register', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
    }
  };
}
```

## Testing Checklist

### Follow System
- [ ] Follow button toggles correctly
- [ ] Followers count updates in real-time
- [ ] Following count updates in real-time
- [ ] Notification is created when someone follows you
- [ ] Follow suggestions load correctly
- [ ] Bulk follow/unfollow works
- [ ] Cannot follow yourself
- [ ] Points are awarded on follow
- [ ] Achievements are checked after follow

### In-App Notifications
- [ ] Notifications appear in real-time
- [ ] Unread count updates correctly
- [ ] Clicking bell marks notifications as read
- [ ] Notification center loads all notifications
- [ ] Grouping works (multiple likes, follows, etc.)
- [ ] Filter by category works
- [ ] Mark all as read works
- [ ] Archive/Delete/Snooze work
- [ ] Follow back button works from notification
- [ ] Deep links open correct pages

### Push Notifications (Mobile/Desktop)
- [ ] Service worker registers successfully
- [ ] Permission prompt appears
- [ ] Push subscription is created
- [ ] Token is stored in localStorage
- [ ] Push notification displays on follow event
- [ ] Clicking notification opens app
- [ ] Notification permission can be revoked
- [ ] Works on iOS Safari (requires user gesture)
- [ ] Works on Android Chrome
- [ ] Works on desktop Chrome/Firefox/Edge

## Production Deployment

### Required Environment Variables
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
PUSH_DELIVERY_WEBHOOK_URL=your_push_delivery_service_url
```

### Push Service Integration
For production, integrate with a push notification service:
- **Firebase Cloud Messaging (FCM)** - Recommended for mobile apps
- **OneSignal** - Easy setup, good analytics
- **Web Push Direct** - For pure web apps

### Service Worker Registration
Add to your main app entry point:
```tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}
```

### Firestore Indexes
Ensure these Firestore indexes exist:
```
Collection: notifications
Fields: recipientId (Ascending), createdAt (Descending)

Collection: users  
Fields: followers (Array), following (Array)
```

## Future Enhancements
1. **Push Notification Preferences**: Let users choose which notification types to receive via push
2. **Rich Notifications**: Add images, action buttons, and custom sounds
3. **Notification Scheduling**: Send digest emails for inactive users
4. **Analytics**: Track notification open rates and engagement
5. **A/B Testing**: Test different notification messages and timing
6. **In-App Notification Center Enhancements**: Pull-to-refresh, infinite scroll, swipe actions

## Troubleshooting

### Notifications not appearing
- Check Firestore security rules allow read access to notifications
- Verify user is authenticated
- Check browser console for errors
- Ensure service worker is registered

### Push notifications not working
- Verify VAPID keys are configured
- Check service worker is handling push events
- Ensure HTTPS is used (required for push API)
- Test on supported browsers (Chrome, Firefox, Edge, Safari 16+)

### Follow button not working
- Check user is authenticated
- Verify Firestore rules allow write access to users collection
- Check browser console for errors
- Ensure `toggleFollowUser` is being called

## Architecture Diagram

```
User Action (Follow)
    ↓
FollowButton Component
    ↓
toggleFollowUser() [lib/user-profile.ts]
    ↓
├─→ Update Firestore (users collection)
├─→ Create Notification [lib/notifications.ts]
├─→ Award Points [lib/gamification.ts]
└─→ Check Achievements [lib/gamification.ts]

Notification Created
    ↓
├─→ Firestore onSnapshot Listener
│   └─→ In-App Notification UI Updates
└─→ Push Notification Service
    └─→ Service Worker (public/sw.js)
        └─→ System Notification Display
            └─→ User Clicks → Deep Link to App
```

## Summary
The follow system and notifications are fully functional with:
- ✅ Instagram-like follow/unfollow functionality
- ✅ Real-time in-app notifications
- ✅ Mobile push notification support via Service Worker
- ✅ Smart notification grouping and prioritization
- ✅ Full notification management UI
- ✅ Integration with existing gamification system
- ✅ Ready for production deployment with proper push service integration