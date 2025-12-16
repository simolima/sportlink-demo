# 📘 Bibbia del Database - Progetto Sport

## 1. Principi Fondamentali
* **Identificatori:** Usiamo UUID per tutto (utenti, club, annunci) eccetto per le tabelle di lookup (numeri o stringhe fisse).
* **Cancellazione:** Non cancelliamo quasi mai i dati (`DELETE`). Usiamo il *Soft Delete* (campi `deleted_at` o `status`) per mantenere lo storico.
* **Privacy:** La privacy è gestita a livello di riga (RLS) e tramite il campo `privacy_settings` nel profilo.

## 2. Struttura dei Profili
Il cuore del sistema è la divisione tra **CHI SEI** e **COSA FAI**.

### La Tassonomia dei Ruoli
1.  **Macro-Ruolo (`lookup_roles`):** Definisce l'account dell'utente.
    * Valori fissi: `player`, `coach`, `agent`, `sporting_director`, `athletic_trainer`, `nutritionist`, `physio`.
    * *Nota:* Questo determina cosa l'utente vede nella Dashboard.
2.  **Posizione Specifica (`lookup_positions`):** Definisce il ruolo in campo.
    * Esempio: Un utente con ruolo `player` può avere posizione `Portiere` (calcio) o `Playmaker` (basket).

### Gestione Multi-Sport
Un profilo non ha un campo "sport", ma una tabella collegata `profile_sports`.
* Questo permette a un Agente di operare su Calcio E Basket.
* Permette a un Giocatore di essere "Pro" nel Calcio e "Amateur" nel Padel.

## 3. Logica Club e Membership
* **Polisportive:** Un Club ha un array `sport_ids` (es. `[1, 2]`) per gestire più sport sotto la stessa pagina.
* **Membership:** Collega Utente -> Club.
    * Ha uno stato: `active` (gioca ora) o `past` (ex giocatore).
    * Ha date reali: `career_start_date` permette di inserire esperienze passate (es. "Ho giocato qui nel 2015").

## 4. Annunci (Opportunities)
Gli annunci usano i filtri tassonomici.
* Campo `role_id`: Indica a CHI è rivolto l'annuncio (es. "Cerco un Nutrizionista").
* Campo `position_id`: Indica il dettaglio (es. "Cerco un Portiere").
* Campo `status`: `viewed` nelle candidature serve a dare feedback "Visualizzato" al candidato (stile spunte blu).

## 5. Social
* **Follow:** Relazione a senso unico. Se A e B si seguono, ci sono due righe nella tabella `follows`.
* **Affiliazioni:** Relazione formale Agente-Giocatore. Può essere 1:N (un giocatore può avere più agenti per scopi diversi).
* **Messaggi:** Tabella unica per tutte le chat. La privacy è garantita dalle Policies RLS (solo mittente e destinatario leggono).