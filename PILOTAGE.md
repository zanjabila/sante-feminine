# Santé Féminine — passage au pilote

## Avant d'inviter les testeuses

1. Faire une sauvegarde Supabase (schéma + données).
2. Exécuter `supabase/migrations/20260907_pilot_security.sql` dans le SQL Editor.
3. Dans **Authentication > URL Configuration**, autoriser :
   - `https://zanjabila.github.io/sante-feminine/email-confirme.html`
   - `https://zanjabila.github.io/sante-feminine/reset-password.html`
4. Créer le compte administrateur dans Supabase Auth et définir dans ses
   `app_metadata` la valeur `{ "role": "admin" }` (jamais dans `user_metadata`).
5. Configurer un SMTP dédié avant une montée en charge. Le quota email de test
   Supabase ne convient pas à un pilote avec plusieurs inscriptions rapprochées.
6. Faire valider les textes médicaux et juridiques destinés au public belge.

## Limites volontaires du pilote

- Aucun numéro de carte n'est collecté : l'abonnement réel n'est pas encore activé.
- L'accès médecin est limité à 14 jours tant qu'un paiement/abonnement actif
  n'est pas enregistré côté serveur.
- Les journaux, alertes, sauvegardes automatiques et le paiement devront être
  finalisés avant commercialisation publique.
