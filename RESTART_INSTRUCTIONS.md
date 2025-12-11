# 🔧 Instructions de Redémarrage du Serveur

## Problème Identifié

Le bot Telegram ne fonctionne pas car la variable d'environnement `TELEGRAM_BOT_TOKEN` n'a pas été chargée par le serveur Next.js.

![Erreur de bot non initialisé](C:/Users/vic2l/.gemini/antigravity/brain/85acb66f-f015-446b-9ec5-e43d33865292/bot_status_check_1765386880337.webp)

## Solution: Redémarrer Complètement le Serveur

### Étape 1: Arrêter le serveur actuel

Dans votre terminal où `npm run dev` est en cours d'exécution:

1. Appuyez sur **Ctrl + C** pour arrêter le serveur
2. Attendez que le processus se termine complètement

### Étape 2: Vérifier que le serveur est bien arrêté

Vous devriez voir un message indiquant que le processus est terminé.

### Étape 3: Redémarrer le serveur

```bash
npm run dev
```

### Étape 4: Vérifier que le bot démarre

Vous devriez voir dans les logs du serveur des messages indiquant que le bot Telegram est connecté. Cherchez des messages comme:
- "Telegram bot initialized"
- Ou des logs de connexion au bot

### Étape 5: Tester le bot

1. Visitez: `http://localhost:3000/api/telegram/init`
   - Vous devriez voir un JSON avec les informations du bot (username, id)
   
2. Sur Telegram:
   - Cherchez votre bot avec le username affiché
   - Envoyez `/start`
   - Testez `/nouvelle_livraison`

## Si le problème persiste

### Vérifier le fichier .env

Le fichier `.env` doit contenir:
```
TELEGRAM_BOT_TOKEN=8464116979:AAGL1AEbC4skBC4rNn0jRBRxYWC2h2LxyOI
```

### Vérifier les logs du serveur

Après le redémarrage, regardez attentivement les logs pour toute erreur liée à Telegram.

### Tester manuellement le token

Visitez cette URL dans votre navigateur:
```
https://api.telegram.org/bot8464116979:AAGL1AEbC4skBC4rNn0jRBRxYWC2h2LxyOI/getMe
```

Vous devriez voir les informations de votre bot. Si cette URL ne fonctionne pas, le token est invalide.

## Pourquoi ce redémarrage est nécessaire?

Next.js charge les variables d'environnement au démarrage du serveur. Les modifications du fichier `.env` faites pendant que le serveur tourne ne sont pas prises en compte automatiquement.

Le token a été ajouté au `.env` pendant que le serveur était déjà en cours d'exécution, donc un redémarrage complet est nécessaire.
