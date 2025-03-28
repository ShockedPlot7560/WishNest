import { logger } from "../lib/logger";
import { AuthenticatedRequest, BaseResponse } from "./controllers";
import {prepareAndAll, prepareAndGet, prepareAndRun} from "../lib/db";

export type SaveSubscriptionRequest = AuthenticatedRequest<object, {
    subscription: {
        endpoint: string,
        keys: {
            auth: string,
            p256dh: string
        }
    },
    deviceUuid: string
}>

export type SaveSubscriptionResponse = BaseResponse<{
    success: boolean
}>


export async function subscribe_push(req: SaveSubscriptionRequest, res: SaveSubscriptionResponse) {
    const {subscription, deviceUuid} = req.body;

    if(!subscription || !deviceUuid){
        res.status(400).json({error: "Bad parameter"});
        return;
    }
    
    logger.info("Subscription saved for user " + req.body.jwt.uuid);

    const deviceInfo = await prepareAndGet(`
        SELECT * FROM push_subscriptions WHERE user_uuid = ? AND device_id = ? 
    `, [req.body.jwt.uuid, deviceUuid]);

    if(deviceInfo){
        await prepareAndRun(`
            UPDATE push_subscriptions SET
                endpoint = ?,
                p256dh = ?,
                auth = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_uuid = ? AND device_id = ?
        `, [
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth,
            req.body.jwt.uuid,
            deviceUuid
        ]);
    }else{
        await prepareAndRun(`
            INSERT INTO push_subscriptions (user_uuid, device_id, endpoint, p256dh, auth)
            VALUES (?, ?, ?, ?, ?)
        `, [
            req.body.jwt.uuid,
            deviceUuid,
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth
        ]);
    }

    res.json({
        success: true
    });
}

export type AppServerKeyRequest = AuthenticatedRequest;

export type AppServerKeyResponse = BaseResponse;

export async function app_server_key(req: AppServerKeyRequest, res: AppServerKeyResponse) {
    res.status(200).json({
        key: process.env.VAPID_PRIVATE_KEY
    });
}

export type UnsubscribePushRequest = AuthenticatedRequest<object, {
    deviceUuid: string
}>

export type UnsubscribePushResponse = BaseResponse<{
    success: boolean
}>

export async function unsubscribe_push(req: UnsubscribePushRequest, res: UnsubscribePushResponse) {
    const {deviceUuid} = req.body;

    if(!deviceUuid){
        res.status(400).json({error: "Bad parameter"});
        return;
    }

    logger.info("Subscription deleted for user " + req.body.jwt.uuid);

    await prepareAndRun(`
        DELETE FROM push_subscriptions WHERE user_uuid = ? AND device_id = ?
    `, [
        req.body.jwt.uuid,
        deviceUuid
    ]);

    res.json({
        success: true
    });
}