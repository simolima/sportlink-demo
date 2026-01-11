// ============================================================================
// CONSTANTS & ENUMS - SPRINTA REFACTORED
// ============================================================================

// Sport disponibili

// Sport supportati
export const SUPPORTED_SPORTS = [
  'Calcio', 'Basket', 'Pallavolo'
] as const;

export type SupportedSport = typeof SUPPORTED_SPORTS[number];


// Ruoli professionali principali (solo quelli consentiti)
export const PROFESSIONAL_ROLES = [
  'Player',
  'Coach',
  'Agent',
  'Sporting Director',
  'Athletic Trainer',
  'Nutritionist',
  'Physio/Masseur',
  'Talent Scout'
] as const;

export type ProfessionalRole = typeof PROFESSIONAL_ROLES[number];


// Ruoli professionali tradotti (per UI)
export const ROLE_TRANSLATIONS: Record<ProfessionalRole, string> = {
  'Player': 'Giocatore',
  'Coach': 'Allenatore',
  'Agent': 'Agente',
  'Sporting Director': 'Direttore Sportivo',
  'Athletic Trainer': 'Preparatore Atletico',
  'Nutritionist': 'Nutrizionista',
  'Physio/Masseur': 'Fisioterapista/Massaggiatore',
  'Talent Scout': 'Talent Scout'
};

// Tipi di opportunità
export const OPPORTUNITY_TYPES = [
  'Player Search',
  'Coach Search',
  'Staff Search',
  'Collaboration',
  'Scouting'
] as const;

export type OpportunityType = typeof OPPORTUNITY_TYPES[number];

// Traduzioni tipi opportunità
export const OPPORTUNITY_TYPE_TRANSLATIONS: Record<OpportunityType, string> = {
  'Player Search': 'Cercasi Giocatore',
  'Coach Search': 'Cercasi Allenatore',
  'Staff Search': 'Cercasi Staff',
  'Collaboration': 'Collaborazione',
  'Scouting': 'Scouting Event'
};

// Tipi di contratto
export const CONTRACT_TYPES = [
  'Full-time',
  'Part-time',
  'Volunteer',
  'Internship'
] as const;

export type ContractType = typeof CONTRACT_TYPES[number];

// Livelli
export const LEVELS = [
  'Professional',
  'Semi-Professional',
  'Amateur',
  'Youth'
] as const;

export type Level = typeof LEVELS[number];

// Stati disponibilità
export const AVAILABILITY_STATUS = [
  'Available',
  'Unavailable',
  'Open to Offers'
] as const;

export type AvailabilityStatus = typeof AVAILABILITY_STATUS[number];

// Ruoli nel club (membership roles)
export const CLUB_ROLES = [
  'Admin',
  'Manager',
  'Player',
  'Coach',
  'Staff',
  'Scout'
] as const;

export type ClubRole = typeof CLUB_ROLES[number];

// Permessi club
export const CLUB_PERMISSIONS = [
  'create_opportunities',
  'manage_applications',
  'manage_members',
  'edit_club_info'
] as const;

export type ClubPermission = typeof CLUB_PERMISSIONS[number];

// Stati affiliazione
export const AFFILIATION_STATUS = [
  'pending',
  'accepted',
  'rejected',
  'blocked'
] as const;

export type AffiliationStatus = typeof AFFILIATION_STATUS[number];

// Stati candidatura
export const APPLICATION_STATUS = [
  'pending',
  'in_review',
  'accepted',
  'rejected',
  'withdrawn'
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[number];

// Tipi notifica
// Per aggiungere un nuovo tipo di notifica:
// 1. Aggiungi il tipo qui sotto in NOTIFICATION_TYPES
// 2. Aggiorna getNotificationDestination() e getNotificationColor() in lib/notification-utils.ts
// 3. Crea la notifica nel punto appropriato (es. API route) chiamando POST /api/notifications
export const NOTIFICATION_TYPES = [
  'affiliation_request',
  'affiliation_accepted',
  'affiliation_rejected',
  'club_join_request',
  'club_join_accepted',
  'club_join_rejected',
  'application_received',
  'application_status_changed',
  'new_opportunity',
  'permission_granted',
  'permission_revoked',
  'new_follower', // Notifica quando un utente inizia a seguirti
  'new_application', // Notifica per Sporting Director quando riceve una candidatura a un annuncio
  'candidacy_accepted', // Notifica per candidato quando la sua candidatura viene accettata
  'candidacy_rejected', // Notifica per candidato quando la sua candidatura viene rifiutata
  'message_received' // Notifica quando ricevi un nuovo messaggio in chat
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

// ============================================================================
// AUTH & SIGNUP TYPES (per migrazione Supabase)
// ============================================================================

/**
 * Dati temporanei di registrazione salvati in localStorage
 * durante il flusso di onboarding multi-step.
 */
export type SignupDraft = {
  firstName: string
  lastName: string
  email: string
  password: string
  birthDate?: string
  role: ProfessionalRole
}

/**
 * Payload per la creazione di un nuovo utente via API.
 * Usato da auth-service.ts -> POST /api/users
 */
export type CreateUserPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  birthDate?: string
  professionalRole: ProfessionalRole
  sports: string[]
  verified?: boolean
}

/**
 * Utente restituito dall'API dopo la creazione.
 * Usato per popolare la sessione localStorage.
 */
export type CreatedUser = {
  id: string | number
  email: string
  firstName: string
  lastName: string
  professionalRole: ProfessionalRole
  sports: string[]
  avatarUrl?: string
}

// ============================================================================
// CORE DATA MODELS
// ============================================================================


// User/Profile
export type User = {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string;
  sports: SupportedSport[];
  professionalRole: ProfessionalRole;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  city?: string;
  country?: string;
  availability?: AvailabilityStatus;
  level?: Level;
  dominantFoot?: 'destro' | 'sinistro' | 'ambidestro';
  secondaryRole?: string;
  // --- Calcio specifici ---
  footballPrimaryPosition?: 'Portiere' | 'Difensore' | 'Centrocampista' | 'Attaccante';
  footballSecondaryPosition?: string;
  verified?: boolean;
  createdAt: string;
  updatedAt?: string;
  /** Ruolo specifico per sport (es. playmaker, centrale, etc) */
  specificRole?: string;
  /** Mano dominante (basket, volley) */
  dominantHand?: 'destra' | 'sinistra' | 'ambidestra';
};

// Club Membership - relazione User <-> Club
export type ClubMembership = {
  id: number | string;
  clubId: number | string;
  userId: number | string;
  role: ClubRole;
  position?: string; // es. "Attaccante", "Portiere", "Preparatore Atletico"
  permissions: ClubPermission[];
  joinedAt: string;
  isActive: boolean;
};

// Club Join Request - richiesta di ingresso nel club
export type ClubJoinRequest = {
  id: number | string;
  clubId: number | string;
  userId: number | string;
  requestedRole: ClubRole;
  requestedSports?: SupportedSport[];
  requestedPosition?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: number | string;
};

// Club/Society
export type Club = {
  id: number | string;
  name: string;
  sports: SupportedSport[]; // Multi-sport support
  city: string;
  country: string;
  region?: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  founded?: number;
  website?: string;
  email?: string;
  phone?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  verified?: boolean;
  followersCount: number;
  membersCount: number;
  createdAt: string;
  createdBy: number | string; // User ID che ha creato il club (diventa automaticamente admin)
};

// Club Follower - utenti che seguono il club (non membri)
export type ClubFollower = {
  id: number | string;
  clubId: number | string;
  userId: number | string;
  followedAt: string;
};

// Opportunity (ex Announcement)
export type Opportunity = {
  id: number | string;
  clubId: number | string;
  title: string;
  type: OpportunityType;
  sport: SupportedSport;
  roleRequired: ProfessionalRole;
  position?: string; // es. "Attaccante", "Centrocampista"
  description: string;
  location: string;
  city?: string;
  country?: string;
  salary?: string;
  contractType?: ContractType;
  level?: Level;
  requirements?: string;
  expiryDate: string; // max 6 mesi dalla creazione
  isActive: boolean;
  createdBy: number | string;
  createdAt: string;
  updatedAt?: string;
};

// Application/Candidatura
export type Application = {
  id: number | string;
  opportunityId: number | string;
  applicantId: number | string; // User ID del candidato
  agentId?: number | string; // Se candidatura via agente
  status: ApplicationStatus;
  message?: string;
  appliedAt: string;
  updatedAt?: string;
  reviewedBy?: number | string;
};

// Affiliation - relazione Agente <-> Player
export type Affiliation = {
  id: number | string;
  agentId: number | string;
  playerId: number | string;
  status: AffiliationStatus;
  message?: string; // Messaggio dell'agente nella richiesta
  requestedAt: string;
  respondedAt?: string;
  affiliatedAt?: string; // quando accepted
  notes?: string;
};

// Blocked Agent - giocatori che hanno bloccato agenti
export type BlockedAgent = {
  id: number | string;
  playerId: number | string;
  agentId: number | string;
  blockedAt: string;
  reason?: string;
};

// Notification
export type Notification = {
  id: number | string;
  userId: number | string; // Destinatario
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>; // Dati aggiuntivi specifici del tipo di notifica
  read: boolean; // Stato lettura
  createdAt: string;
};

// ============================================================================
// HELPER & EXTENDED TYPES
// ============================================================================

// User con dettagli club e agenti (per visualizzazione profilo)
export type UserWithDetails = User & {
  clubMemberships?: Array<ClubMembership & { club: Club }>;
  affiliatedAgents?: Array<User>; // Lista agenti affiliati (se player)
  affiliatedPlayers?: Array<User>; // Lista giocatori affiliati (se agent)
};

// Opportunity con dettagli club
export type OpportunityWithDetails = Opportunity & {
  club: Club;
  applicationsCount: number;
};

// @deprecated - Usa OpportunityWithDetails
export type AnnouncementWithDetails = OpportunityWithDetails;

// Application con dettagli user e club
export type ApplicationWithDetails = Application & {
  player: User;
  agent?: User;
  opportunity: Opportunity & { club: Club };
};

// Club con contatori e membri
export type ClubWithDetails = Club & {
  memberships?: ClubMembership[];
  activeOpportunities?: Opportunity[];
  pendingJoinRequests?: number;
};

// Notification con dettagli correlati
export type NotificationWithDetails = Notification & {
  relatedUser?: User;
  relatedClub?: Club;
  relatedOpportunity?: Opportunity;
};

// ============================================================================
// LEGACY TYPES (da rimuovere gradualmente)
// ============================================================================

export type Message = {
  id: number | string
  senderId: string
  receiverId: string
  text: string
  timestamp: string
  read: boolean
}

export type ConversationSummary = {
  peerId: string
  lastMessage: Message
  unread: number
}
