import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

export type AuthUserRole = 'coach' | 'athlete';
export type AthleteStatus = 'active' | 'paused';
export type TrainingSessionStatus = 'planned' | 'in_progress' | 'completed';
export type ExerciseLoadMode = 'fixed' | 'percentage' | 'rpe';

export interface PersonalRecords {
  squat: number | null;
  bench: number | null;
  deadlift: number | null;
  press: number | null;
}

const emptyRecords = (): PersonalRecords => ({ squat: null, bench: null, deadlift: null, press: null });

export interface AuthUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: AuthUserRole;
  bodyWeight: number | null;
  category: string | null;
  records: PersonalRecords;
  /** "YYYY-MM" they started training, or null if not given. */
  powerliftingSince: string | null;
  /** False until the person has filled in their own profile (weight class, focus, etc). */
  profileComplete: boolean;
}

export interface Athlete {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  bodyWeight: number | null;
  category: string | null;
  records: PersonalRecords;
  powerliftingSince: string | null;
  status: AthleteStatus;
  lastSessionDate: string | null;
  nextSessionDate: string | null;
  progress: number;
  profileComplete: boolean;
}

export interface AthleteUpdate {
  firstName?: string;
  lastName?: string;
  bodyWeight?: number | null;
  category?: string | null;
  records?: PersonalRecords;
  powerliftingSince?: string | null;
  status?: AthleteStatus;
}

export interface ProfileInput {
  bodyWeight?: number | null;
  category?: string | null;
  records?: PersonalRecords;
  powerliftingSince?: string | null;
}

export interface Exercise {
  id: number;
  sessionId: number;
  name: string;
  category: string;
  order: number;
  sets: number;
  reps: number;
  loadMode: ExerciseLoadMode;
  loadValue: number | null;
  percentage: number | null;
  targetRpe: number | null;
  restSeconds: number;
  tempo: string | null;
  notes: string | null;
  completed: boolean;
  actualLoad: number | null;
  actualReps: number | null;
  actualRpe: number | null;
  comment: string | null;
}

export interface TrainingSession {
  id: number;
  athleteId: number;
  programId: number;
  name: string;
  sessionDate: string;
  status: TrainingSessionStatus;
  notes: string | null;
  weekNumber: number;
  exercises: Exercise[];
}

export interface ProgramBlock {
  id: number;
  name: string;
  weekNumber: number;
  sessions: TrainingSession[];
}

export interface Program {
  id: number;
  athleteId: number;
  name: string;
  method: string;
  trainingMaxes: { squat: number; bench: number; deadlift: number };
  blocks: ProgramBlock[];
}

export interface ExerciseInput {
  name: string;
  category: string;
  order: number;
  sets: number;
  reps: number;
  loadMode: ExerciseLoadMode;
  loadValue?: number | null;
  percentage?: number | null;
  targetRpe?: number | null;
  restSeconds: number;
  tempo?: string | null;
  notes?: string | null;
}

export interface SessionInput {
  name: string;
  sessionDate: string;
  weekNumber: number;
  notes?: string | null;
  exercises: ExerciseInput[];
}

export interface SessionUpdate {
  name?: string;
  sessionDate?: string;
  status?: TrainingSessionStatus;
  notes?: string | null;
}

export interface ExerciseUpdate {
  name?: string;
  category?: string;
  order?: number;
  sets?: number;
  reps?: number;
  loadMode?: ExerciseLoadMode;
  loadValue?: number | null;
  percentage?: number | null;
  targetRpe?: number | null;
  restSeconds?: number;
  tempo?: string | null;
  notes?: string | null;
}

export interface PerformanceInput {
  actualLoad: number;
  actualReps: number;
  actualRpe?: number | null;
  comment?: string | null;
}

export interface ExerciseLibraryItem {
  id: number;
  name: string;
  category: string;
  isMainLift: boolean;
}

export interface ExerciseLibraryInput {
  name: string;
  category: string;
  isMainLift?: boolean;
}

export interface LiftStats {
  best1rm: number;
  best3rm: number;
  best5rm: number;
  trend: Array<{ date: string; value: number }>;
}

export interface Stats {
  squat: LiftStats;
  bench: LiftStats;
  deadlift: LiftStats;
  totalVolume: number;
  totalTonnage: number;
  bodyWeight: number | null;
  period: string;
}

interface Activity {
  id: number;
  label: string;
  detail: string;
  date: string;
  kind: string;
}

interface Dashboard {
  role: AuthUserRole;
  athleteCount: number;
  activeAthleteCount: number;
  sessionsToday: number;
  completedToday: number;
  volumeThisWeek: number;
  nextSession: TrainingSession | null;
  recentActivity: Activity[];
}

interface LocalDb {
  users: Array<AuthUser & { password: string }>;
  athletes: Athlete[];
  programs: Program[];
  sessions: TrainingSession[];
  exerciseLibrary: ExerciseLibraryItem[];
  nextId: number;
}

const DB_KEY = 'sn-power-static-db-v1';
const USER_KEY = 'sn-power-static-user-v1';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function seedDb(): LocalDb {
  // No demo data: a brand-new install starts completely empty.
  // The very first person to open the app creates the real coach account
  // (see useGetSetupStatus / useRegister below), and every athlete,
  // program, and session from then on is real data the coach enters.
  return {
    users: [],
    athletes: [],
    programs: [],
    sessions: [],
    exerciseLibrary: [
      // Squat
      { id: 1, name: 'Back Squat', category: 'squat', isMainLift: true },
      { id: 2, name: 'Front Squat', category: 'squat', isMainLift: false },
      { id: 3, name: 'Box Squat', category: 'squat', isMainLift: false },
      { id: 4, name: 'Pause Squat', category: 'squat', isMainLift: false },
      { id: 5, name: 'Safety Bar Squat', category: 'squat', isMainLift: false },
      { id: 6, name: 'Bulgarian Split Squat', category: 'squat', isMainLift: false },
      { id: 7, name: 'Leg Press', category: 'squat', isMainLift: false },
      { id: 8, name: 'Walking Lunge', category: 'squat', isMainLift: false },
      // Bench
      { id: 9, name: 'Bench Press', category: 'bench', isMainLift: true },
      { id: 10, name: 'Close-Grip Bench Press', category: 'bench', isMainLift: false },
      { id: 11, name: 'Incline Bench Press', category: 'bench', isMainLift: false },
      { id: 12, name: 'Spoto Press', category: 'bench', isMainLift: false },
      { id: 13, name: 'Board Press', category: 'bench', isMainLift: false },
      { id: 14, name: 'Dumbbell Bench Press', category: 'bench', isMainLift: false },
      { id: 15, name: 'Push-Up', category: 'bench', isMainLift: false },
      // Deadlift
      { id: 16, name: 'Deadlift', category: 'deadlift', isMainLift: true },
      { id: 17, name: 'Sumo Deadlift', category: 'deadlift', isMainLift: false },
      { id: 18, name: 'Romanian Deadlift', category: 'deadlift', isMainLift: false },
      { id: 19, name: 'Deficit Deadlift', category: 'deadlift', isMainLift: false },
      { id: 20, name: 'Rack Pull', category: 'deadlift', isMainLift: false },
      { id: 21, name: 'Good Morning', category: 'deadlift', isMainLift: false },
      { id: 22, name: 'Stiff-Leg Deadlift', category: 'deadlift', isMainLift: false },
      // Press
      { id: 23, name: 'Overhead Press', category: 'press', isMainLift: true },
      { id: 24, name: 'Push Press', category: 'press', isMainLift: false },
      { id: 25, name: 'Seated Dumbbell Press', category: 'press', isMainLift: false },
      { id: 26, name: 'Arnold Press', category: 'press', isMainLift: false },
      { id: 27, name: 'Lateral Raise', category: 'press', isMainLift: false },
      // Pull / back
      { id: 28, name: 'Barbell Row', category: 'pull', isMainLift: false },
      { id: 29, name: 'Pendlay Row', category: 'pull', isMainLift: false },
      { id: 30, name: 'Pull-Up', category: 'pull', isMainLift: false },
      { id: 31, name: 'Chin-Up', category: 'pull', isMainLift: false },
      { id: 32, name: 'Lat Pulldown', category: 'pull', isMainLift: false },
      { id: 33, name: 'Seated Cable Row', category: 'pull', isMainLift: false },
      { id: 34, name: 'Face Pull', category: 'pull', isMainLift: false },
      // Accessory / arms
      { id: 35, name: 'Barbell Curl', category: 'accessory', isMainLift: false },
      { id: 36, name: 'Hammer Curl', category: 'accessory', isMainLift: false },
      { id: 37, name: 'Triceps Pushdown', category: 'accessory', isMainLift: false },
      { id: 38, name: 'Skull Crusher', category: 'accessory', isMainLift: false },
      { id: 39, name: 'Dip', category: 'accessory', isMainLift: false },
      // Posterior chain / legs
      { id: 40, name: 'Hip Thrust', category: 'accessory', isMainLift: false },
      { id: 41, name: 'Glute Ham Raise', category: 'accessory', isMainLift: false },
      { id: 42, name: 'Leg Curl', category: 'accessory', isMainLift: false },
      { id: 43, name: 'Leg Extension', category: 'accessory', isMainLift: false },
      { id: 44, name: 'Calf Raise', category: 'accessory', isMainLift: false },
      // Core
      { id: 45, name: 'Plank', category: 'core', isMainLift: false },
      { id: 46, name: 'Ab Wheel Rollout', category: 'core', isMainLift: false },
      { id: 47, name: 'Hanging Leg Raise', category: 'core', isMainLift: false },
      { id: 48, name: 'Cable Woodchop', category: 'core', isMainLift: false },
    ],
    nextId: 49,
  };
}

function clone<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeDb(db: LocalDb): LocalDb {
  for (const user of db.users as Array<{ records?: Partial<PersonalRecords>; powerliftingSince?: string | null }>) {
    if (!user.records) user.records = emptyRecords();
    else if (user.records.press === undefined) user.records.press = null;
    if (user.powerliftingSince === undefined) user.powerliftingSince = null;
  }
  for (const athlete of db.athletes as Array<{ records?: Partial<PersonalRecords>; powerliftingSince?: string | null }>) {
    if (!athlete.records) athlete.records = emptyRecords();
    else if (athlete.records.press === undefined) athlete.records.press = null;
    if (athlete.powerliftingSince === undefined) athlete.powerliftingSince = null;
  }
  return db;
}

function readDb(): LocalDb {
  if (typeof window === 'undefined') return seedDb();
  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = seedDb();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return normalizeDb(JSON.parse(raw) as LocalDb);
  } catch {
    const seeded = seedDb();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeDb(db: LocalDb) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function currentUser(db = readDb()): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const userId = Number(window.localStorage.getItem(USER_KEY));
  const user = db.users.find(item => item.id === userId);
  if (!user) return null;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function visibleAthleteIds(db: LocalDb) {
  const user = currentUser(db);
  return user?.role === 'athlete' ? [user.id] : db.athletes.map(item => item.id);
}

function athleteSummary(db: LocalDb, athlete: Athlete): Athlete {
  const sessions = db.sessions.filter(item => item.athleteId === athlete.id);
  const completed = sessions.filter(item => item.status === 'completed');
  const upcoming = sessions.filter(item => item.status !== 'completed').sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))[0];
  return {
    ...athlete,
    lastSessionDate: completed.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0]?.sessionDate ?? athlete.lastSessionDate,
    nextSessionDate: upcoming?.sessionDate ?? athlete.nextSessionDate,
  };
}

function withBlocks(db: LocalDb, program: Program): Program {
  const sessions = db.sessions.filter(item => item.programId === program.id);
  const byWeek = new Map<number, TrainingSession[]>();
  sessions.forEach(session => byWeek.set(session.weekNumber, [...(byWeek.get(session.weekNumber) ?? []), clone(session)]));
  return {
    ...clone(program),
    blocks: Array.from(byWeek.entries()).sort(([a], [b]) => a - b).map(([weekNumber, weekSessions], index) => ({
      id: program.id * 100 + weekNumber,
      name: `Training week ${weekNumber}`,
      weekNumber,
      sessions: weekSessions.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate)),
    })).concat(sessions.length ? [] : [{
      id: program.id * 100 + 1,
      name: 'Training week 1',
      weekNumber: 1,
      sessions: [],
    }]),
  };
}

function calculateStats(db: LocalDb, athleteId: number): Stats {
  const athlete = db.athletes.find(item => item.id === athleteId);
  const sessions = db.sessions.filter(item => item.athleteId === athleteId);
  const lifts = (category: string): LiftStats => {
    const rows = sessions.flatMap(session => session.exercises.filter(item => item.category === category && (item.actualLoad ?? item.loadValue) != null).map(item => ({
      date: session.sessionDate,
      value: item.actualLoad ?? item.loadValue ?? 0,
      reps: item.actualReps ?? item.reps,
    })));
    const best = rows.reduce((max, row) => Math.max(max, row.value * (1 + row.reps / 30)), 0);
    const sorted = rows.sort((a, b) => a.date.localeCompare(b.date));
    return {
      best1rm: Math.round(best || 0),
      best3rm: Math.round((best || 0) * 0.93),
      best5rm: Math.round((best || 0) * 0.87),
      trend: sorted.slice(-12).map(row => ({ date: row.date, value: Math.round(row.value) })),
    };
  };
  const completed = sessions.filter(session => session.status === 'completed');
  const totalVolume = completed.reduce((total, session) => total + session.exercises.reduce((sum, item) => sum + (item.actualLoad ?? item.loadValue ?? 0) * (item.actualReps ?? item.reps) * item.sets, 0), 0);
  return {
    squat: lifts('squat'),
    bench: lifts('bench'),
    deadlift: lifts('deadlift'),
    totalVolume: Math.round(totalVolume),
    totalTonnage: Math.round(totalVolume),
    bodyWeight: athlete?.bodyWeight ?? null,
    period: 'Current cycle',
  };
}

type QueryOptions = { query?: { enabled?: boolean; queryKey?: readonly unknown[] } };
type MutationVariables<T> = { data: T };

function localQuery<T>(queryKey: readonly unknown[], queryFn: () => T, options?: QueryOptions): UseQueryResult<T, Error> & { queryKey: readonly unknown[] } {
  const result = useQuery({
    queryKey: options?.query?.queryKey ?? queryKey,
    queryFn: async () => clone(queryFn()),
    enabled: options?.query?.enabled ?? true,
    retry: false,
  });
  return Object.assign(result, { queryKey: options?.query?.queryKey ?? queryKey });
}

function localMutation<TVariables, TData>(mutationFn: (variables: TVariables) => TData) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => clone(mutationFn(variables)),
    onSuccess: () => { void queryClient.invalidateQueries(); },
  });
}

export const getGetAthleteQueryKey = (id: number) => ['local', 'athlete', id] as const;
export const getGetAthleteStatsQueryKey = (id: number) => ['local', 'stats', id] as const;
export const getGetCurrentUserQueryKey = () => ['local', 'current-user'] as const;
export const getGetDashboardQueryKey = () => ['local', 'dashboard'] as const;
export const getGetProgramQueryKey = (id: number) => ['local', 'program', id] as const;
export const getGetSessionQueryKey = (id: number) => ['local', 'session', id] as const;
export const getListAthletesQueryKey = () => ['local', 'athletes'] as const;
export const getListExerciseLibraryQueryKey = () => ['local', 'exercise-library'] as const;
export const getListSessionsQueryKey = (id: number) => ['local', 'sessions', id] as const;

export function useGetCurrentUser(options?: QueryOptions) {
  return localQuery(getGetCurrentUserQueryKey(), () => currentUser(), options);
}

export const getGetSetupStatusQueryKey = () => ['local', 'setup-status'] as const;

/** Whether this browser has never had a coach account created yet. */
export function useGetSetupStatus() {
  return localQuery(getGetSetupStatusQueryKey(), () => ({ needsSetup: readDb().users.length === 0 }));
}

/** Creates the one real coach account for this workspace. Only works once. */
/** Creates an account. The very first account on this device becomes the coach; every one after that is an athlete. */
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: MutationVariables<{ username: string; password: string; firstName: string; lastName: string }>) => {
      const db = readDb();
      if (db.users.some(item => item.username === data.username)) throw new Error('That username is already taken.');
      const role: AuthUserRole = db.users.length === 0 ? 'coach' : 'athlete';
      const id = db.nextId++;
      const user = { id, username: data.username, password: data.password, firstName: data.firstName, lastName: data.lastName, role, bodyWeight: null, category: null, records: emptyRecords(), powerliftingSince: null, profileComplete: false };
      db.users.push(user);
      if (role === 'athlete') {
        db.athletes.push({ id, username: data.username, firstName: data.firstName, lastName: data.lastName, bodyWeight: null, category: null, records: emptyRecords(), powerliftingSince: null, status: 'active', lastSessionDate: null, nextSessionDate: null, progress: 0, profileComplete: false });
        db.programs.push({ id: id * 10, athleteId: id, name: 'New strength cycle', method: 'Custom', trainingMaxes: { squat: 0, bench: 0, deadlift: 0 }, blocks: [] });
      }
      writeDb(db);
      // Only auto sign-in the very first account (the coach). For every account
      // created after that, we do NOT touch the current session — otherwise,
      // if a coach shares the invite link and an athlete signs up on the SAME
      // browser/device as the coach, it would silently kick the coach out and
      // replace them with the new athlete (this was a real bug: creating an
      // athlete made the coach's roster look empty because the coach was no
      // longer the signed-in user at all). The new athlete simply signs in
      // normally afterwards, from their own device.
      if (role === 'coach') window.localStorage.setItem(USER_KEY, String(id));
      const { password: _password, ...safeUser } = user;
      return safeUser;
    },
    onSuccess: () => { void queryClient.invalidateQueries(); },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: MutationVariables<{ username: string; password: string }>) => {
      const db = readDb();
      const user = db.users.find(item => item.username === data.username && item.password === data.password);
      if (!user) throw new Error('Incorrect username or password.');
      window.localStorage.setItem(USER_KEY, String(user.id));
      const { password: _password, ...safeUser } = user;
      return safeUser;
    },
    onSuccess: () => { void queryClient.invalidateQueries(); },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => { window.localStorage.removeItem(USER_KEY); },
    onSuccess: () => { queryClient.clear(); },
  });
}

export function useGetDashboard() {
  return localQuery(getGetDashboardQueryKey(), () => {
    const db = readDb();
    const user = currentUser(db);
    const ids = visibleAthleteIds(db);
    const sessions = db.sessions.filter(item => ids.includes(item.athleteId));
    const recentActivity = sessions.slice().sort((a, b) => b.sessionDate.localeCompare(a.sessionDate)).slice(0, 5).map(session => ({
      id: session.id,
      label: session.name,
      detail: `${session.exercises.length} exercises · ${session.sessionDate}`,
      date: session.sessionDate,
      kind: 'session',
    }));
    return {
      role: user?.role ?? 'coach',
      athleteCount: ids.length,
      activeAthleteCount: db.athletes.filter(item => ids.includes(item.id) && item.status === 'active').length,
      sessionsToday: sessions.filter(item => item.sessionDate === today()).length,
      completedToday: sessions.filter(item => item.sessionDate === today() && item.status === 'completed').length,
      volumeThisWeek: sessions.reduce((total, session) => total + session.exercises.reduce((sum, item) => sum + (item.loadValue ?? 0) * item.reps * item.sets, 0), 0),
      nextSession: sessions.filter(item => item.status !== 'completed').sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))[0] ?? null,
      recentActivity,
    } satisfies Dashboard;
  });
}

export function useListAthletes() {
  return localQuery(getListAthletesQueryKey(), () => {
    const db = readDb();
    return db.athletes.filter(item => visibleAthleteIds(db).includes(item.id)).map(item => athleteSummary(db, item));
  });
}

export function useGetAthlete(id: number) {
  return localQuery(getGetAthleteQueryKey(id), () => {
    const db = readDb();
    return db.athletes.find(item => item.id === id && visibleAthleteIds(db).includes(id)) ?? null;
  });
}

export function useGetAthleteStats(id: number, options?: QueryOptions) {
  return localQuery(getGetAthleteStatsQueryKey(id), () => calculateStats(readDb(), id), options);
}

export function useListSessions(id: number, options?: QueryOptions) {
  return localQuery(getListSessionsQueryKey(id), () => {
    const db = readDb();
    return db.sessions.filter(item => item.athleteId === id && visibleAthleteIds(db).includes(id)).sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
  }, options);
}

export function useGetProgram(id: number) {
  return localQuery(getGetProgramQueryKey(id), () => {
    const db = readDb();
    const program = db.programs.find(item => item.athleteId === id && visibleAthleteIds(db).includes(id));
    return program ? withBlocks(db, program) : null;
  });
}

export function useGetSession(id: number) {
  return localQuery(getGetSessionQueryKey(id), () => {
    const db = readDb();
    return db.sessions.find(item => item.id === id && visibleAthleteIds(db).includes(item.athleteId)) ?? null;
  });
}

export function useListExerciseLibrary() {
  return localQuery(getListExerciseLibraryQueryKey(), () => readDb().exerciseLibrary);
}

/** The signed-in person fills in or edits their own profile: weight class, body weight, current 1RMs, and how long they've trained. Used both for the mandatory first-time onboarding and for later edits from Settings. */
export function useCompleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: MutationVariables<ProfileInput>) => {
      const db = readDb();
      const userId = Number(window.localStorage.getItem(USER_KEY));
      const user = db.users.find(item => item.id === userId);
      if (!user) throw new Error('You are not signed in.');
      const patch = { bodyWeight: data.bodyWeight ?? null, category: data.category ?? null, records: data.records ?? user.records ?? emptyRecords(), powerliftingSince: data.powerliftingSince ?? null, profileComplete: true };
      Object.assign(user, patch);
      const athlete = db.athletes.find(item => item.id === userId);
      if (athlete) Object.assign(athlete, patch);
      writeDb(db);
      const { password: _password, ...safeUser } = user;
      return safeUser;
    },
    onSuccess: () => { void queryClient.invalidateQueries(); },
  });
}

export function useUpdateAthlete() {
  return localMutation(({ id, data }: { id: number; data: AthleteUpdate }) => {
    const db = readDb();
    const athlete = db.athletes.find(item => item.id === id);
    if (!athlete) throw new Error('Athlete not found');
    Object.assign(athlete, data);
    const user = db.users.find(item => item.id === id);
    if (user) Object.assign(user, { firstName: data.firstName ?? user.firstName, lastName: data.lastName ?? user.lastName, bodyWeight: data.bodyWeight ?? user.bodyWeight, category: data.category ?? user.category, records: data.records ?? user.records, powerliftingSince: data.powerliftingSince ?? user.powerliftingSince });
    writeDb(db);
    return athlete;
  });
}

export function useDeleteAthlete() {
  return localMutation(({ id }: { id: number }) => {
    const db = readDb();
    db.athletes = db.athletes.filter(item => item.id !== id);
    db.users = db.users.filter(item => item.id !== id);
    db.sessions = db.sessions.filter(item => item.athleteId !== id);
    db.programs = db.programs.filter(item => item.athleteId !== id);
    writeDb(db);
  });
}

export function useCreateSession() {
  return localMutation(({ athleteId, data }: { athleteId: number; data: SessionInput }) => {
    const db = readDb();
    const id = db.nextId++;
    const program = db.programs.find(item => item.athleteId === athleteId);
    if (!program) throw new Error('Program not found');
    const session: TrainingSession = { id, athleteId, programId: program.id, ...data, notes: data.notes ?? null, status: 'planned', exercises: [] };
    db.sessions.push(session);
    writeDb(db);
    return session;
  });
}

/**
 * Jim Wendler's 5/3/1 "Triumvirat" template: 4 training days a week (Overhead
 * Press, Deadlift, Bench Press, Squat), one 4-week cycle. Training max = 90%
 * of the athlete's current 1RM. Percentages/reps per week follow the
 * published program exactly (last set of weeks 1-3 is AMRAP; week 4 is the
 * deload). Requires the athlete to already have at least one lift recorded
 * (see records / Settings / Edit athlete).
 */
export function useApplyFiveThreeOne() {
  return localMutation(({ athleteId }: { athleteId: number }) => {
    const db = readDb();
    const athlete = db.athletes.find(item => item.id === athleteId);
    if (!athlete) throw new Error('Athlete not found');
    const r = athlete.records;
    if (!r.squat && !r.bench && !r.deadlift && !r.press) throw new Error("Set this athlete's current lifts first (Edit athlete, or ask them to fill it in from Settings).");
    const round = (v: number) => Math.round(v / 2.5) * 2.5;
    const tm = { squat: round((r.squat ?? 0) * 0.9), bench: round((r.bench ?? 0) * 0.9), deadlift: round((r.deadlift ?? 0) * 0.9), press: round((r.press ?? 0) * 0.9) };
    const weeks: Array<{ label: string; percents: number[]; reps: number[]; deload: boolean }> = [
      { label: 'Week 1 · 3x5', percents: [65, 75, 85], reps: [5, 5, 5], deload: false },
      { label: 'Week 2 · 3x3', percents: [70, 80, 90], reps: [3, 3, 3], deload: false },
      { label: 'Week 3 · 5/3/1', percents: [75, 85, 95], reps: [5, 3, 1], deload: false },
      { label: 'Week 4 · Deload', percents: [40, 50, 60], reps: [5, 5, 5], deload: true },
    ];
    const days: Array<{ key: keyof typeof tm; name: string; category: string; accessories: Array<[string, string, number]> }> = [
      { key: 'press', name: 'Overhead Press', category: 'press', accessories: [['Dip', 'accessory', 10], ['Chin-Up', 'pull', 10]] },
      { key: 'deadlift', name: 'Deadlift', category: 'deadlift', accessories: [['Good Morning', 'deadlift', 12], ['Leg Extension', 'accessory', 15]] },
      { key: 'bench', name: 'Bench Press', category: 'bench', accessories: [['Dumbbell Bench Press', 'bench', 10], ['Seated Cable Row', 'pull', 10]] },
      { key: 'squat', name: 'Back Squat', category: 'squat', accessories: [['Leg Press', 'squat', 15], ['Leg Curl', 'accessory', 10]] },
    ];
    let program = db.programs.find(item => item.athleteId === athleteId);
    if (!program) { program = { id: db.nextId++, athleteId, name: '5/3/1 · Triumvirat', method: '5/3/1 (Wendler)', trainingMaxes: { squat: tm.squat, bench: tm.bench, deadlift: tm.deadlift }, blocks: [] }; db.programs.push(program); }
    // Clear any sessions from a previous template run for this program, so re-applying doesn't duplicate weeks.
    db.sessions = db.sessions.filter(item => item.programId !== program!.id);
    program.name = '5/3/1 · Triumvirat';
    program.method = '5/3/1 (Wendler) — training max = 90% of 1RM';
    program.trainingMaxes = { squat: tm.squat, bench: tm.bench, deadlift: tm.deadlift };
    const startDate = new Date();
    weeks.forEach((week, weekIdx) => {
      days.forEach((day, dayIdx) => {
        const sessionId = db.nextId++;
        const mainTM = tm[day.key];
        const mainExercises: Exercise[] = week.percents.map((p, i) => ({
          id: db.nextId++, sessionId, name: day.name, category: day.category, order: i + 1,
          sets: 1, reps: week.reps[i], loadMode: 'percentage', loadValue: mainTM ? round(mainTM * p / 100) : null, percentage: p, targetRpe: null, restSeconds: 180, tempo: null,
          notes: !week.deload && i === week.percents.length - 1 ? 'AMRAP — as many good reps as possible' : null,
          completed: false, actualLoad: null, actualReps: null, actualRpe: null, comment: null,
        }));
        const accessoryExercises: Exercise[] = day.accessories.map(([name, category, reps], i) => ({
          id: db.nextId++, sessionId, name, category, order: mainExercises.length + i + 1,
          sets: 5, reps, loadMode: 'fixed', loadValue: null, percentage: null, targetRpe: 7, restSeconds: 90, tempo: null,
          notes: 'Pick a challenging weight for the rep range.',
          completed: false, actualLoad: null, actualReps: null, actualRpe: null, comment: null,
        }));
        const date = new Date(startDate);
        date.setDate(date.getDate() + weekIdx * 7 + dayIdx * 2);
        const session: TrainingSession = {
          id: sessionId, athleteId, programId: program!.id, name: `${day.name} day`,
          sessionDate: date.toISOString().slice(0, 10), status: 'planned', notes: week.label, weekNumber: weekIdx + 1,
          exercises: [...mainExercises, ...accessoryExercises],
        };
        db.sessions.push(session);
      });
    });
    writeDb(db);
    return program;
  });
}

/**
 * A 3-day full-body powerlifting split: efficient for lifters who don't want
 * a 4-6 day SBD split, following the "top set / back-off" and progressive
 * overload principles (each week's percentages climb by 2 points). Day 1 and
 * 2 build volume on one main lift each plus assistance work; Day 3 is a
 * heavy Squat/Bench/Deadlift day. Requires the athlete's current squat,
 * bench and deadlift to be recorded.
 */
export function useApplyThreeDaySBD() {
  return localMutation(({ athleteId }: { athleteId: number }) => {
    const db = readDb();
    const athlete = db.athletes.find(item => item.id === athleteId);
    if (!athlete) throw new Error('Athlete not found');
    const r = athlete.records;
    if (!r.squat && !r.bench && !r.deadlift) throw new Error("Set this athlete's current squat, bench, and deadlift first (Edit athlete, or ask them to fill it in from Settings).");
    const oneRM = { squat: r.squat ?? 0, bench: r.bench ?? 0, deadlift: r.deadlift ?? 0 };
    const round = (v: number) => Math.round(v / 2.5) * 2.5;
    const pct = (lift: keyof typeof oneRM, p: number) => (oneRM[lift] ? round((oneRM[lift] * p) / 100) : null);

    let program = db.programs.find(item => item.athleteId === athleteId);
    if (!program) { program = { id: db.nextId++, athleteId, name: '3-Day Powerlifting (SBD)', method: 'Full-body 3-day split', trainingMaxes: oneRM, blocks: [] }; db.programs.push(program); }
    db.sessions = db.sessions.filter(item => item.programId !== program!.id);
    program.name = '3-Day Powerlifting (SBD)';
    program.method = 'Full-body 3-day split — intensity climbs +2%/week';
    program.trainingMaxes = oneRM;

    const startDate = new Date();
    const mkEx = (sessionId: number, order: number, name: string, category: string, sets: number, reps: number, loadMode: ExerciseLoadMode, loadValue: number | null, percentage: number | null, restSeconds: number, notes: string | null): Exercise => ({
      id: db.nextId++, sessionId, name, category, order, sets, reps, loadMode, loadValue, percentage, targetRpe: null, restSeconds, tempo: null, notes,
      completed: false, actualLoad: null, actualReps: null, actualRpe: null, comment: null,
    });

    for (let week = 1; week <= 4; week++) {
      const bump = (week - 1) * 2; // progressive overload: +2 percentage points each week
      const s1 = db.nextId++;
      const day1: Exercise[] = [
        mkEx(s1, 1, 'Bench Press', 'bench', 4, 8, 'percentage', pct('bench', 70 + bump), 70 + bump, 180, null),
        mkEx(s1, 2, 'Back Squat', 'squat', 4, 8, 'percentage', pct('squat', 65 + bump), 65 + bump, 180, null),
        mkEx(s1, 3, 'Overhead Press', 'press', 3, 7, 'fixed', null, null, 150, 'Pick a solid, not-maximal weight for 6-8 reps.'),
        mkEx(s1, 4, 'Leg Extension', 'accessory', 3, 10, 'fixed', null, null, 60, 'Superset with Leg Curl.'),
        mkEx(s1, 5, 'Leg Curl', 'accessory', 3, 10, 'fixed', null, null, 60, 'Superset with Leg Extension.'),
      ];
      const s2 = db.nextId++;
      const day2: Exercise[] = [
        mkEx(s2, 1, 'Deadlift', 'deadlift', 4, 6, 'percentage', pct('deadlift', 72 + bump), 72 + bump, 180, null),
        mkEx(s2, 2, 'Pull-Up', 'pull', 4, 9, 'fixed', null, null, 150, null),
        mkEx(s2, 3, 'Barbell Curl', 'accessory', 3, 10, 'fixed', null, null, 90, 'Superset with Triceps Pushdown.'),
        mkEx(s2, 4, 'Triceps Pushdown', 'accessory', 3, 10, 'fixed', null, null, 90, 'Superset with Barbell Curl.'),
        mkEx(s2, 5, 'Hammer Curl', 'accessory', 3, 10, 'fixed', null, null, 90, 'Superset with Skull Crusher.'),
        mkEx(s2, 6, 'Skull Crusher', 'accessory', 3, 10, 'fixed', null, null, 90, 'Superset with Hammer Curl.'),
      ];
      const s3 = db.nextId++;
      const wave: Array<{ p: number; reps: number }> = [{ p: 80, reps: 5 }, { p: 82, reps: 5 }, { p: 84, reps: 4 }, { p: 85, reps: 3 }];
      const day3: Exercise[] = [];
      (['squat', 'bench', 'deadlift'] as const).forEach((lift, liftIdx) => {
        const name = lift === 'squat' ? 'Back Squat' : lift === 'bench' ? 'Bench Press' : 'Deadlift';
        wave.forEach((w, i) => day3.push(mkEx(s3, liftIdx * wave.length + i + 1, name, lift, 1, w.reps, 'percentage', pct(lift, w.p + bump), w.p + bump, 210, i === wave.length - 1 ? 'Top set for today — prioritise solid technique.' : null)));
      });
      const mkSession = (id: number, name: string, exercises: Exercise[], dayOffset: number): TrainingSession => {
        const date = new Date(startDate); date.setDate(date.getDate() + (week - 1) * 7 + dayOffset);
        return { id, athleteId, programId: program!.id, name, sessionDate: date.toISOString().slice(0, 10), status: 'planned', notes: `Week ${week}`, weekNumber: week, exercises };
      };
      db.sessions.push(mkSession(s1, 'Full-Body A', day1, 0));
      db.sessions.push(mkSession(s2, 'Pull & Arms', day2, 2));
      db.sessions.push(mkSession(s3, 'SBD Heavy Day', day3, 4));
    }
    writeDb(db);
    return program;
  });
}

export function useUpdateSession() {
  return localMutation(({ id, data }: { id: number; data: SessionUpdate }) => {
    const db = readDb();
    const session = db.sessions.find(item => item.id === id);
    if (!session) throw new Error('Session not found');
    Object.assign(session, data);
    writeDb(db);
    return session;
  });
}

export function useDeleteSession() {
  return localMutation(({ id }: { id: number }) => {
    const db = readDb();
    db.sessions = db.sessions.filter(item => item.id !== id);
    writeDb(db);
  });
}

export function useAddExercise() {
  return localMutation(({ sessionId, data }: { sessionId: number; data: ExerciseInput }) => {
    const db = readDb();
    const session = db.sessions.find(item => item.id === sessionId);
    if (!session) throw new Error('Session not found');
    const item: Exercise = { id: db.nextId++, sessionId, ...data, loadValue: data.loadValue ?? null, percentage: data.percentage ?? null, targetRpe: data.targetRpe ?? null, tempo: data.tempo ?? null, notes: data.notes ?? null, completed: false, actualLoad: null, actualReps: null, actualRpe: null, comment: null };
    session.exercises.push(item);
    writeDb(db);
    return item;
  });
}

export function useUpdateExercise() {
  return localMutation(({ id, data }: { id: number; data: ExerciseUpdate }) => {
    const db = readDb();
    const session = db.sessions.find(item => item.exercises.some(exerciseItem => exerciseItem.id === id));
    const item = session?.exercises.find(exerciseItem => exerciseItem.id === id);
    if (!item) throw new Error('Exercise not found');
    Object.assign(item, data);
    writeDb(db);
    return item;
  });
}

export function useDeleteExercise() {
  return localMutation(({ id }: { id: number }) => {
    const db = readDb();
    db.sessions.forEach(session => { session.exercises = session.exercises.filter(item => item.id !== id); });
    writeDb(db);
  });
}

export function useLogExercise() {
  return localMutation(({ id, data }: { id: number; data: PerformanceInput }) => {
    const db = readDb();
    const session = db.sessions.find(item => item.exercises.some(exerciseItem => exerciseItem.id === id));
    const item = session?.exercises.find(exerciseItem => exerciseItem.id === id);
    if (!item) throw new Error('Exercise not found');
    Object.assign(item, { ...data, completed: true, actualRpe: data.actualRpe ?? null, comment: data.comment ?? null });
    if (session && session.exercises.every(exerciseItem => exerciseItem.completed)) session.status = 'completed';
    writeDb(db);
    return item;
  });
}

export function useCreateExerciseLibraryItem() {
  return localMutation(({ data }: MutationVariables<ExerciseLibraryInput>) => {
    const db = readDb();
    const item = { id: db.nextId++, name: data.name, category: data.category, isMainLift: data.isMainLift ?? false };
    db.exerciseLibrary.push(item);
    writeDb(db);
    return item;
  });
}