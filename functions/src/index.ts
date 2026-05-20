import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}

/**
 * Send a push notification via Expo Push API.
 */
async function sendExpoPush(message: ExpoPushMessage): Promise<void> {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const result = await response.json();
    if (result.errors) {
      functions.logger.warn('Expo push error:', result.errors);
    }
  } catch (err) {
    functions.logger.error('Failed to send Expo push:', err);
  }
}

/**
 * Build notification title and body based on order status.
 */
function buildOrderNotification(
  status: string,
  orderId: string
): { title: string; body: string } {
  const shortId = orderId.slice(0, 8).toUpperCase();

  switch (status) {
    case 'confirmed':
      return {
        title: 'Sipariş Onaylandı 🎉',
        body: `#${shortId} numaralı siparişiniz onaylandı.`,
      };
    case 'processing':
      return {
        title: 'Sipariş Hazırlanıyor',
        body: `#${shortId} siparişiniz hazırlanmaya başlandı.`,
      };
    case 'shipped':
      return {
        title: 'Siparişiniz Kargoda 🚚',
        body: `#${shortId} siparişiniz kargoya verildi.`,
      };
    case 'delivered':
      return {
        title: 'Sipariş Teslim Edildi ✅',
        body: `#${shortId} siparişiniz teslim edildi. Keyfini çıkarın!`,
      };
    case 'cancelled':
      return {
        title: 'Sipariş İptal Edildi',
        body: `#${shortId} siparişiniz iptal edildi.`,
      };
    case 'refunded':
      return {
        title: 'İade İşlemi Tamamlandı',
        body: `#${shortId} sipariş iadeniz tamamlandı.`,
      };
    default:
      return {
        title: 'Sipariş Güncellendi',
        body: `#${shortId} siparişinizin durumu: ${status}`,
      };
  }
}

/**
 * Firestore trigger: when an order document is written, detect status
 * changes and send a push notification to the buyer.
 */
export const onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onWrite(async (change, context) => {
    const { orderId } = context.params;

    // Skip if no change (first creation without status change needed)
    if (!change.before.exists) {
      // New order created — no notification needed for initial creation
      return;
    }

    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!afterData) return; // Document deleted

    const oldStatus = beforeData?.status;
    const newStatus = afterData.status;

    // Only notify on actual status change
    if (oldStatus === newStatus) return;

    // Skip 'pending' → anything (pending is the initial state)
    if (oldStatus === 'pending' && newStatus === 'pending') return;

    // Get buyer's push token
    const buyerId = afterData.buyerId;
    if (!buyerId) return;

    let pushToken: string | undefined;
    try {
      const buyerDoc = await admin
        .firestore()
        .doc(`users/${buyerId}`)
        .get();
      pushToken = buyerDoc.data()?.pushToken;
    } catch (err) {
      functions.logger.error(`Failed to fetch user ${buyerId}:`, err);
      return;
    }

    if (!pushToken) return; // User hasn't registered for push

    // Send notification
    const { title, body } = buildOrderNotification(newStatus, orderId);
    await sendExpoPush({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: {
        type: 'order',
        orderId,
        status: newStatus,
      },
      channelId: 'orders',
    });

    functions.logger.info(
      `Push sent to user ${buyerId} for order ${orderId}: ${oldStatus} → ${newStatus}`
    );
  });

/**
 * HTTP-callable function for sending custom notifications
 * (e.g., promotions from admin panel).
 */
export const sendCustomNotification = functions.https.onCall(
  async (data, context) => {
    // Only admins can send broadcast notifications
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Giriş yapmalısınız.'
      );
    }

    const callerDoc = await admin
      .firestore()
      .doc(`users/${context.auth.uid}`)
      .get();
    const callerRole = callerDoc.data()?.role;

    if (callerRole !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Bu işlem için admin yetkisi gereklidir.'
      );
    }

    const { title, body, targetUserId } = data;
    if (!title || !body) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Title ve body zorunludur.'
      );
    }

    if (targetUserId) {
      // Send to specific user
      const userDoc = await admin
        .firestore()
        .doc(`users/${targetUserId}`)
        .get();
      const pushToken = userDoc.data()?.pushToken;
      if (pushToken) {
        await sendExpoPush({
          to: pushToken,
          sound: 'default',
          title,
          body,
          data: { type: 'custom' },
          channelId: 'promotions',
        });
      }
    } else {
      // Broadcast to all users with push tokens
      const usersSnapshot = await admin
        .firestore()
        .collection('users')
        .where('pushToken', '!=', null)
        .get();

      const promises = usersSnapshot.docs.map((doc) => {
        const token = doc.data().pushToken;
        if (token) {
          return sendExpoPush({
            to: token,
            sound: 'default',
            title,
            body,
            data: { type: 'custom' },
            channelId: 'promotions',
          });
        }
        return Promise.resolve();
      });

      await Promise.allSettled(promises);
      return { sent: promises.length };
    }

    return { sent: 1 };
  }
);
