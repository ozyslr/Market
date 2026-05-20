"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCustomNotification = exports.onOrderStatusChange = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
/**
 * Send a push notification via Expo Push API.
 */
async function sendExpoPush(message) {
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
    }
    catch (err) {
        functions.logger.error('Failed to send Expo push:', err);
    }
}
/**
 * Build notification title and body based on order status.
 */
function buildOrderNotification(status, orderId) {
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
exports.onOrderStatusChange = functions.firestore
    .document('orders/{orderId}')
    .onWrite(async (change, context) => {
    var _a;
    const { orderId } = context.params;
    // Skip if no change (first creation without status change needed)
    if (!change.before.exists) {
        // New order created — no notification needed for initial creation
        return;
    }
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!afterData)
        return; // Document deleted
    const oldStatus = beforeData === null || beforeData === void 0 ? void 0 : beforeData.status;
    const newStatus = afterData.status;
    // Only notify on actual status change
    if (oldStatus === newStatus)
        return;
    // Skip 'pending' → anything (pending is the initial state)
    if (oldStatus === 'pending' && newStatus === 'pending')
        return;
    // Get buyer's push token
    const buyerId = afterData.buyerId;
    if (!buyerId)
        return;
    let pushToken;
    try {
        const buyerDoc = await admin
            .firestore()
            .doc(`users/${buyerId}`)
            .get();
        pushToken = (_a = buyerDoc.data()) === null || _a === void 0 ? void 0 : _a.pushToken;
    }
    catch (err) {
        functions.logger.error(`Failed to fetch user ${buyerId}:`, err);
        return;
    }
    if (!pushToken)
        return; // User hasn't registered for push
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
    functions.logger.info(`Push sent to user ${buyerId} for order ${orderId}: ${oldStatus} → ${newStatus}`);
});
/**
 * HTTP-callable function for sending custom notifications
 * (e.g., promotions from admin panel).
 */
exports.sendCustomNotification = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // Only admins can send broadcast notifications
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Giriş yapmalısınız.');
    }
    const callerDoc = await admin
        .firestore()
        .doc(`users/${context.auth.uid}`)
        .get();
    const callerRole = (_a = callerDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (callerRole !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Bu işlem için admin yetkisi gereklidir.');
    }
    const { title, body, targetUserId } = data;
    if (!title || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'Title ve body zorunludur.');
    }
    if (targetUserId) {
        // Send to specific user
        const userDoc = await admin
            .firestore()
            .doc(`users/${targetUserId}`)
            .get();
        const pushToken = (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.pushToken;
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
    }
    else {
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
});
//# sourceMappingURL=index.js.map