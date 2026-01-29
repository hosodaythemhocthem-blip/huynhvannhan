import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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
   ADMIN BYPASS
========================= */
const ADMIN_ACCOUNT = {
  email: "huynhvannhan",
  password: "huynhvannhan2020",
};

/* =========================
   MAP FIREBASE USER → APP USER
========================= */
const mapFirebaseUser = async (fbUser: FirebaseUser): Promise<AppUser> => {
  const snap = await getDoc(doc(db, "users", fbUser.uid));

  if (!snap.exists()) {
    throw new Error("Tài khoản chưa được cấp quyền");
  }

  const data = snap.data();

  if (data.deleted) {
    throw new Error("Tài khoản đã bị khóa");
  }

  if (data.role === UserRole.TEACHER && data.status !== AccountStatus.APPROVED) {
    throw new Error("Tài khoản giáo viên đang chờ duyệt");
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
  // Admin bypass
  if (email === ADMIN_ACCOUNT.email && password === ADMIN_ACCOUNT.password) {
    localStorage.setItem("ADMIN_LOGIN", "true");
    return {
      uid: "ADMIN",
      email,
      role: UserRole.ADMIN,
    };
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  return await mapFirebaseUser(cred.user);
};

/* =========================
   REGISTER CORE
========================= */
export const register = async (
  email: string,
  password: string,
  role: UserRole
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

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
   ALIAS EXPORT (Fix lỗi build)
========================= */
export const registerTeacher = (email: string, password: string) => {
  return register(email, password, UserRole.TEACHER);
};

export const registerStudent = (email: string, password: string) => {
  return register(email, password, UserRole.STUDENT);
};

/* =========================
   OBSERVE AUTH STATE
========================= */
export const observeAuth = (callback: (user: AppUser | null) => void) => {
  // Admin session
  if (localStorage.getItem("ADMIN_LOGIN") === "true") {
    callback({
      uid: "ADMIN",
      email: ADMIN_ACCOUNT.email,
      role: UserRole.ADMIN,
    });
    return () => {};
  }

  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) return callback(null);

    try {
      const appUser = await mapFirebaseUser(fbUser);
      callback(appUser);
    } catch (err) {
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
