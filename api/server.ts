import express from 'express';
import cors from 'cors';
import {add_user, check_user, get_users, verify_user} from "./controllers/user_controller";
import {
    accept_gift,
    add_family,
    add_gift,
    delete_gift,
    deny_gift,
    get_families,
    get_family,
    get_member_data,
    post_member_message,
    remove_from_family
} from "./controllers/family_controller";
import {
    accept_family_invitation,
    accept_user_group_request,
    create_invitation,
    delete_family_invitation,
    get_family_invitations,
    get_user_family_invitations,
    get_user_group_requests
} from "./controllers/invitations_controller";
import {authenticated} from "./controllers/controllers";
import * as dotenv from 'dotenv'
import { logger } from './lib/logger';
import { uuid } from 'uuidv4';

const app = express();
const PORT = 3000;

dotenv.config()

// Middleware
app.use(cors({ origin: process.env.VITE_FRONT_URL })); // Autorise toutes les requêtes cross-origin
app.use(express.json()); // Permet de lire le JSON dans les requêtes POST
app.use((req, res, next) => {
    const reqId = uuid();
    logger.info(`> [${reqId}] ${req.method} ${req.url} `);
    next();
    logger.info(`< [${reqId}] ${res.statusCode} ${res.statusMessage}`);
});
const apiPrefix = '/api';
app.use(apiPrefix, authenticated);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack); // Log de l'erreur pour le débogage
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        },
    });
});
  

(async () => {
    // Récupération de tous les utilisateurs
    app.get(apiPrefix + '/users', get_users);

    // Ajout d'un utilisateur
    app.post('/register', add_user);

    // Vérification de l'authentification
    app.post('/login', check_user);

    // Récupération de toutes les familles dun utilisateur
    app.get(apiPrefix + '/users/:uuid/families', get_families);

    // Récupération des invitations à une famille d'un utilisateur
    app.get(apiPrefix + '/users/:uuid/invitations', get_user_family_invitations);

    // Acceptation d'une invitation à une famille
    app.post(apiPrefix + '/users/:uuid/invitations/:invitationUuid', accept_family_invitation);

    // Ajout d'une nouvelle famille
    app.post(apiPrefix + '/users/:uuid/families', add_family);

    // Suppression d'un lien avec une famille d'un utilisateur
    app.delete(apiPrefix + '/users/:uuid/families/:familyUuid', remove_from_family);

    // Récupération des informations de la famille
    app.get(apiPrefix + '/family/:uuid', get_family);

    // Récupération des demandes d'ajout à un groupe d'un utilisateur
    app.get(apiPrefix + '/users/:uuid/family/:familyUuid/requests', get_user_group_requests);

    // Acceptation d'une demande d'ajout à un groupe
    app.post(apiPrefix + '/users/:userUuid/groups/:groupUuid/accept', accept_user_group_request);

    // Récupération des informations d'un membre d'une famille
    app.get(apiPrefix + '/family/:familyUuid/member/:userUuid', get_member_data);

    // Création d'une invitation à une famille
    app.post(apiPrefix + '/families/:familyUuid/invitations', create_invitation);

    // Récupération des invitations à une famille
    app.get(apiPrefix +  '/families/:familyUuid/invitations', get_family_invitations);

    // Suppression d'un invitation à une famille
    app.delete(apiPrefix + '/invitations/:uuid', delete_family_invitation);

    // Envoi d'un message
    app.post(apiPrefix + '/family/:familyUuid/member/:userUuid/gift/:giftUuid/message', post_member_message);

    // Acceptation d'un cadeau
    app.post(apiPrefix + '/family/:familyUuid/member/:userUuid/gift/:giftUuid/accept', accept_gift);

    // Deny d'un cadeau
    app.post(apiPrefix + '/family/:familyUuid/member/:userUuid/gift/:giftUuid/deny', deny_gift);

    // Création d'un cadeau
    app.post(apiPrefix + '/family/:familyUuid/member/:userUuid/gift', add_gift);

    // Suppression d'un cadeau
    app.delete(apiPrefix + '/family/:familyUuid/member/:userUuid/gift/:giftUuid', delete_gift);

    // vérification utilisateur
    app.post(apiPrefix + '/users/verify', verify_user);

    // Démarrer le serveur
    app.listen(PORT, () => {
        logger.info(`API running on http://localhost:${PORT}`);
    });
})();