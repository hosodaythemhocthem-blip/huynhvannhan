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
   MAP USER SAFE
========================= */
const mapFirebaseUser = async (
  fbUser: FirebaseUser
): Promise<AppUser> => {
  if (!db) throw { code: "db-not-ready" };

  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw { code: "account-not-exist" };
  }

  const data = snap.data();

  if (data.deleted === true) {
    throw { code: "account-deleted" };
  }

  if (
    data.role === UserRole.TEACHER &&
    data.status !== AccountStatus.APPROVED
  ) {
    throw { code: "teacher-pending" };
  }

  return {
    uid: fbUser.uid,
    email: fbUser.email || "",
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
  if (isAdminLogin(email, password)) {
    localStorage.setItem("ADMIN_LOGIN", "true");
    return {
      uid: "ADMIN",
      email,
      role: UserRole.ADMIN,
    };
  }

  const cred = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return await mapFirebaseUser(cred.user);
};

/* =========================
   REGISTER
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

export const registerTeacher = (email: string, password: string) =>
  register(email, password, UserRole.TEACHER);

export const registerStudent = (email: string, password: string) =>
  register(email, password, UserRole.STUDENT);

/* =========================
   OBSERVE AUTH
========================= */
export const observeAuth = (
  callback: (user: AppUser | null) => void
) => {
  if (localStorage.getItem("ADMIN_LOGIN") === "true") {
    callback({
      uid: "ADMIN",
      email: ADMIN_ACCOUNT.email,
      role: UserRole.ADMIN,
    });
    return () => {};
  }

  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null);
      return;
    }

    try {
      const user = await mapFirebaseUser(fbUser);
      callback(user);
    } catch {
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
