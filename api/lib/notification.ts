import webPush from 'web-push';
import { prepareAndAll } from './db';

webPush.setVapidDetails(
    'mailto:contact@exemple.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

export async function sendNotification(userUuid: string, payload: {
    title: string,
    options: {
        body: string
    }
}) {
    const infos = await prepareAndAll(`
        SELECT * FROM push_subscriptions WHERE user_uuid = ?
    `, [userUuid]); 

    console.log("Push notification to " + infos.length + " devices for user " + userUuid);

    payload.options.badge = "https://localhost:5173/icon.webp";
    payload.options.icon = "https://localhost:5173/icon.webp";

    infos.map((data: {
        endpoint: string,
        p256dh: string,
        auth: string
    }) => {
        webPush.sendNotification({
            endpoint: data.endpoint,
            keys: {
                auth: data.auth,
                p256dh: data.p256dh
            }
        }, JSON.stringify(payload))
            .catch((err) => {
                console.error("Error sending notification", err);
            });
    });
}