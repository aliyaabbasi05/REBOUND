import { RecoveryStep } from '../types';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface MotivationalNudge {
  id: string;
  title: string;
  body: string;
  topic: string;
  stepNumber?: number;
  timestamp: string;
  actionText?: string;
  actionType?: 'open_recovery' | 'open_practice' | 'open_coach';
}

const NUDGE_TEMPLATES = [
  {
    prefix: 'Keep building momentum',
    emoji: '✨',
    message: (stepTitle: string, topic: string) =>
      `Your plan has a pending step: "${stepTitle}" in ${topic}. A short review is a useful place to start.`,
  },
  {
    prefix: 'Your next rebound step',
    emoji: '🎯',
    message: (stepTitle: string, topic: string) =>
      `When you're ready, try a short session on "${stepTitle}" in ${topic}.`,
  },
  {
    prefix: 'Coordinates for growth',
    emoji: '🚀',
    message: (stepTitle: string, topic: string) =>
      `Review "${stepTitle}" in ${topic}, and check your understanding as you go.`,
  },
  {
    prefix: 'Score rebound checkpoint',
    emoji: '💡',
    message: (stepTitle: string, topic: string) =>
      `The next step in your recovery plan is "${stepTitle}" in ${topic}.`,
  },
];

/** Check if the Notification API is supported in the current environment */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Get the current notification permission */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

/** Request user permission via browser Notification API */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    // Legacy callback fallback
    return new Promise((resolve) => {
      try {
        Notification.requestPermission((res) => {
          resolve(res as NotificationPermissionStatus);
        });
      } catch (err) {
        resolve(getNotificationPermission());
      }
    });
  }
}

/** Format a gentle, encouraging recovery nudge message */
export function createMotivationalNudge(
  topic: string,
  pendingStep?: RecoveryStep,
  studentName?: string
): MotivationalNudge {
  const stepTitle = pendingStep?.title || 'Review weak concepts';
  const stepNum = pendingStep?.stepNumber || 1;
  const template = NUDGE_TEMPLATES[Math.floor(Math.random() * NUDGE_TEMPLATES.length)];

  const title = `REBOUND ${template.emoji} ${template.prefix}`;
  const body = studentName
    ? `${studentName}, ${template.message(stepTitle, topic)}`
    : template.message(stepTitle, topic);

  let actionType: 'open_recovery' | 'open_practice' | 'open_coach' = 'open_recovery';
  let actionText = 'View Recovery Plan';

  if (stepNum === 2 || stepNum === 4) {
    actionType = 'open_practice';
    actionText = 'Start Practice Now';
  } else if (stepNum === 1) {
    actionType = 'open_coach';
    actionText = 'Ask AI Coach';
  }

  return {
    id: 'nudge-' + Date.now(),
    title,
    body,
    topic,
    stepNumber: stepNum,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionText,
    actionType,
  };
}

/** Fire a browser Notification and return the nudge payload */
export function sendBrowserNotification(
  nudge: MotivationalNudge,
  onNotificationClick?: () => void
): boolean {
  if (!isNotificationSupported()) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(nudge.title, {
      body: nudge.body,
      tag: 'rebound-recovery-nudge',
      badge: '/favicon.ico',
      icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
    });

    notification.onclick = () => {
      try {
        window.focus();
      } catch (e) {
        // Ignored
      }
      if (onNotificationClick) {
        onNotificationClick();
      }
      notification.close();
    };

    return true;
  } catch (error) {
    console.warn('Could not display system browser notification:', error);
    return false;
  }
}
