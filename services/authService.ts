import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserRole, AccountStatus } from "../types";

/* =========================
   TYPES
========================= */
export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status?: AccountStatus;
}

/* =========================
   ⚠️ ADMIN LOCAL (DEV ONLY)
========================= */
const ADMIN_ACCOUNT = {
  email: "huynhvannhan",
  password: "huynhvannhan2020",
};

const isAdminLogin = (email: string, password: string) =>
  email === ADMIN_ACCOUNT.email &&
  password === ADMIN_ACCOUNT.password;

/* =========================
   INTERNAL ERROR HELPER
========================= */
const authError = (code: string) => {
  const err = new Error(code);
  (err as any).code = code;
  return err;
};

/* =========================
   MAP FIREBASE USER → APP USER
========================= */
const mapFirebaseUser = async (
  fbUser: FirebaseUser
): Promise<AppUser> => {
  if (!db) throw authError("db-not-ready");

  const userRef = doc(db, "users", fbUser.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw authError("account-not-exist");
  }

  const data = snap.data();

  if (data.deleted === true) {
    throw authError("account-deleted");
  }

  if (
    data.role === UserRole.TEACHER &&
    data.status !== AccountStatus.APPROVED
  ) {
    throw authError("teacher-pending");
  }

  return {
    uid: fbUser.uid,
    email: fbUser.email ?? data.email ?? "",
    role: data.role,
    status: data.status,
  };
};

/* =========================
   LOGIN
========================= */
export const login = async (
  email: string,
  password: string
): Promise<AppUser> => {
  /* ===== ADMIN LOCAL ===== */
  if (isAdminLogin(email, password)) {
    localStorage.setItem("ADMIN_LOGIN", "true");
    return {
      uid: "ADMIN",
      email,
      role: UserRole.ADMIN,
    };
  }

  /* ===== FIREBASE AUTH ===== */
  const cred = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return await mapFirebaseUser(cred.user);
};

/* =========================
   REGISTER (BASE)
========================= */
export const register = async (
  email: string,
  password: string,
  role: UserRole
): Promise<void> => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    role,
    status:
      role === UserRole.TEACHER
        ? AccountStatus.PENDING
        : AccountStatus.APPROVED,
    deleted: false,
    createdAt: serverTimestamp(),
  });
};

/* =========================
   REGISTER HELPERS
========================= */
export const registerTeacher = (
  email: string,
  password: string
) => register(email, password, UserRole.TEACHER);

export const registerStudent = (
  email: string,
  password: string
) => register(email, password, UserRole.STUDENT);

/* =========================
   OBSERVE AUTH STATE
========================= */
export const observeAuth = (
  callback: (user: AppUser | null) => void
) => {
  /* ===== ADMIN SESSION ===== */
  if (localStorage.getItem("ADMIN_LOGIN") === "true") {
    callback({
      uid: "ADMIN",
      email: ADMIN_ACCOUNT.email,
      role: UserRole.ADMIN,
    });
    return () => {};
  }

  /* ===== FIREBASE SESSION ===== */
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }

    try {
      const user = await mapFirebaseUser(fbUser);
      callback(user);
    } catch (err) {
      await signOut(auth);
      callback(null);
    }
  });
};

/* =========================
   LOGOUT
========================= */
export const logout = async () => {
  localStorage.removeItem("ADMIN_LOGIN");
  await signOut(auth);
};
