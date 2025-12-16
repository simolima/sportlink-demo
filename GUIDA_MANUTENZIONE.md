# 🛠 Guida alla Manutenzione e Modifiche Future

## 1. Come aggiungere un nuovo SPORT (es. Padel)
Non serve modificare il codice del database.
1.  Apri l'editor SQL di Supabase.
2.  Esegui:
    ```sql
    insert into public.lookup_sports (name) values ('Padel');
    ```
3.  Ora il Padel apparirà automaticamente nei filtri, se il frontend carica la lista dinamicamente.

## 2. Come aggiungere una nuova POSIZIONE (es. Match Analyst)
Verifica prima a quale Macro-Ruolo appartiene (es. Allenatore o Staff Tecnico).
1.  Trova l'ID dello sport (es. Calcio = 1).
2.  Trova l'ID del ruolo (es. 'coach').
3.  Esegui:
    ```sql
    insert into public.lookup_positions (sport_id, role_id, name) values 
    (1, 'coach', 'Match Analyst');
    ```

## 3. Come aggiungere un nuovo MACRO-RUOLO (es. Scout)
⚠️ **Attenzione:** Questa modifica richiede un aggiornamento anche del Frontend (devi creare la dashboard per lo Scout).
1.  Inserisci il ruolo nel database:
    ```sql
    insert into public.lookup_roles (id, label, description) values 
    ('scout', 'Osservatore', 'Cerca talenti per i club.');
    ```
2.  Aggiorna il codice dell'App per gestire il routing di questo nuovo utente.

## 4. Come gestire i Permessi (RLS)
Se devi cambiare chi può fare cosa (es. permettere anche agli Agenti di creare Club):
1.  Non toccare le tabelle.
2.  Vai nella sezione **Authentication > Policies** di Supabase.
3.  Trova la policy sulla tabella `clubs` chiamata "Solo DS creano club".
4.  Modifica la query SQL della policy:
    * *Da:* `auth.jwt() ->> 'role_id' = 'sporting_director'`
    * *A:* `auth.jwt() ->> 'role_id' in ('sporting_director', 'agent')`

## 5. Privacy e GDPR
Se un utente chiede la cancellazione totale:
* Opzione A (Soft Delete - Consigliata): Imposta `deleted_at = NOW()` nel profilo.
* Opzione B (Hard Delete): Esegui `DELETE FROM auth.users WHERE id = '...'`. Grazie al `ON DELETE CASCADE` impostato nel database, questo cancellerà a cascata profilo, messaggi, membership e dati sensibili, pulendo tutto.