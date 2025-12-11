# Configuration Telegram Bot - Guide Complet

## 📋 Prérequis

Votre bot Telegram a déjà été créé et le token est configuré dans `.env`:
```
TELEGRAM_BOT_TOKEN=8464116979:AAGL1AEbC4skBC4rNn0jRBRxYWC2h2LxyOI
```

## 🚀 Démarrage Rapide

### 1. Démarrer le serveur de développement

```bash
npm run dev
```

Le bot Telegram démarre automatiquement en mode **polling** (idéal pour le développement).

### 2. Trouver votre bot sur Telegram

1. Ouvrez Telegram
2. Utilisez l'API Telegram pour obtenir le nom d'utilisateur de votre bot:
   - Visitez: `https://api.telegram.org/bot8464116979:AAGL1AEbC4skBC4rNn0jRBRxYWC2h2LxyOI/getMe`
   - Ou appelez l'API locale: `http://localhost:3000/api/telegram/init`

3. Recherchez votre bot dans Telegram avec le nom d'utilisateur obtenu

### 3. Commencer à utiliser le bot

Envoyez `/start` à votre bot pour commencer!

## 📱 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `/start` | Message de bienvenue et initialisation |
| `/nouvelle_livraison` | Créer une nouvelle demande de livraison |
| `/mes_livraisons` | Voir toutes vos livraisons et leur statut |
| `/aide` | Afficher l'aide complète |

## 🔄 Flux de Création de Livraison

Lorsqu'un client utilise `/nouvelle_livraison`, le bot guide à travers ces étapes:

1. **Nom complet** - Le bot demande le nom du client
2. **Téléphone** - Numéro de téléphone pour contact
3. **Adresse de livraison** - Adresse complète de destination
4. **Produits** - Sélection des produits et quantités
   - Format: `numéro quantité` (ex: "1 2" pour 2x premier produit)
   - Plusieurs produits: "1 2, 3 1"
5. **Instructions** - Instructions spéciales (optionnel)
6. **Confirmation** - Récapitulatif et validation

## 🔔 Notifications Automatiques

Le bot envoie automatiquement:

### 1. Notification ETA (Création de livraison)
- Envoyée immédiatement après création
- Contient: produits, adresse, estimation de livraison
- ETA calculée: +2 heures par défaut

### 2. Mise à jour de statut
- Envoyée quand le statut change (ASSIGNED, IN_TRANSIT, etc.)
- Contient: nouveau statut, informations du livreur

### 3. Compte-rendu de livraison (Status = DELIVERED)
- Photo du point de dépôt
- Localisation GPS exacte
- Distance du point de dépôt
- Description du livreur

## 🛠️ Configuration Technique

### Variables d'environnement (.env)

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET=supersecretkey123456789012345678901234567890
TELEGRAM_BOT_TOKEN=8464116979:AAGL1AEbC4skBC4rNn0jRBRxYWC2h2LxyOI
TELEGRAM_WEBHOOK_SECRET=telegram_webhook_secret_xxxxx
```

### Mode de fonctionnement

**Développement (actuel)**: Mode **Polling**
- Le bot interroge régulièrement les serveurs Telegram
- Aucune configuration de webhook nécessaire
- Parfait pour le développement local

**Production (futur)**: Mode **Webhook**
- Nécessite un serveur accessible publiquement (HTTPS)
- Configuration du webhook: `TELEGRAM_WEBHOOK_URL=https://votre-domaine.com/api/telegram/webhook`
- Plus efficace et scalable

## 📊 Base de Données

### Nouveaux champs ajoutés

**Client**:
- `telegramChatId` (String, unique) - Identifiant Telegram du client
- `telegramUsername` (String) - Nom d'utilisateur Telegram

**Delivery**:
- `estimatedDeliveryTime` (DateTime) - Heure estimée de livraison
- `telegramNotificationSent` (Boolean) - Tracking des notifications

## 🧪 Test du Système

### Test 1: Créer une livraison via Telegram

1. Ouvrez Telegram et trouvez votre bot
2. Envoyez `/nouvelle_livraison`
3. Suivez le flux conversationnel
4. Vérifiez que la livraison apparaît dans le dashboard admin: `http://localhost:3000/dashboard/deliveries`
5. Vérifiez la réception de la notification ETA

### Test 2: Assigner un livreur

1. Dans le dashboard, assignez un livreur à la livraison
2. Le client Telegram devrait recevoir une notification de mise à jour

### Test 3: Marquer comme livrée

1. Dans le dashboard, changez le statut à "DELIVERED"
2. Ajoutez une photo et des coordonnées GPS (HidingSpot)
3. Le client Telegram devrait recevoir:
   - La photo
   - La localisation GPS
   - Le message de confirmation

### Test 4: Consulter les livraisons

1. Envoyez `/mes_livraisons` dans Telegram
2. Vérifiez que toutes les livraisons du client sont listées

## 🔍 Vérification du Bot

### Vérifier que le bot est actif

**Via API**:
```bash
curl http://localhost:3000/api/telegram/init
```

**Via Telegram API directement**:
```bash
curl https://api.telegram.org/bot8464116979:AAGL1AEbC4skBC4rNn0jRBRxYWC2h2LxyOI/getMe
```

## 🐛 Dépannage

### Le bot ne répond pas
1. Vérifiez que `npm run dev` est en cours d'exécution
2. Vérifiez les logs du serveur pour les erreurs
3. Vérifiez que le token est correct dans `.env`

### Les notifications ne sont pas envoyées
1. Vérifiez que le client a un `telegramChatId` dans la base de données
2. Vérifiez les logs du serveur pour les erreurs d'envoi
3. Assurez-vous que le bot n'a pas été bloqué par l'utilisateur

### Erreurs de type TypeScript
- Les erreurs de type disparaîtront après le redémarrage du serveur
- Prisma Client se régénère automatiquement au démarrage

## 📝 Fichiers Importants

- `lib/telegram-bot.ts` - Service principal du bot
- `lib/telegram-notifications.ts` - Utilitaires de notification
- `app/api/telegram/init/route.ts` - Endpoint d'initialisation
- `app/api/telegram/webhook/route.ts` - Endpoint webhook (production)
- `app/api/deliveries/route.ts` - API de création (avec notification)
- `app/api/deliveries/[id]/route.ts` - API de mise à jour (avec notification)

## 🚀 Prochaines Étapes

1. **Tester le flux complet** avec un vrai client Telegram
2. **Personnaliser l'ETA** selon vos besoins métier
3. **Ajouter plus de commandes** si nécessaire
4. **Déployer en production** avec webhook pour meilleure performance
5. **Ajouter des analytics** pour suivre l'utilisation du bot

## 💡 Conseils

- Le bot stocke les conversations en mémoire (Map). En production, utilisez Redis ou une base de données
- Les photos doivent être < 10MB (limite Telegram)
- Utilisez le mode Markdown pour formater les messages
- Testez toujours avec de vraies données avant la production
