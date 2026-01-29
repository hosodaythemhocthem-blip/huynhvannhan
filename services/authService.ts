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
   USER CHUẨN TOÀN APP
========================= */
export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status?: AccountStatus;
}

/* =========================
   ADMIN CỨNG (CỨU HỆ THỐNG)
========================= */
const ADMIN_ACCOUNT = {
  username: "huynhvannhan",
  password: "huynhvannhan2020",
};

/* =========================
   MAP FIREBASE → APP USER
========================= */
const mapFirebaseUser = async (
  fbUser: FirebaseUser
): Promise<AppUser> => {
  const snap = await getDoc(doc(db, "users", fbUser.uid));

  if (!snap.exists()) {
    throw new Error("Tài khoản chưa được cấp quyền trong hệ thống");
  }

  const data = snap.data();

  if (data.deleted) {
    throw new Error("Tài khoản đã bị vô hiệu hóa");
  }

  if (
    data.role === UserRole.TEACHER &&
    data.status === AccountStatus.PENDING
  ) {
    throw new Error(
      "Tài khoản Giáo viên đang chờ Quản trị viên phê duyệt"
    );
  }

  return {
    uid: fbUser.uid,
    email: fbUser.email || "",
    role: data.role,
    status: data.status,
  };
};

/* =========================
   LOGIN DUY NHẤT
========================= */
export const login = async (
  usernameOrEmail: string,
  password: string
): Promise<AppUser> => {
  /* 👉 ADMIN ƯU TIÊN */
  if (
    usernameOrEmail === ADMIN_ACCOUNT.username &&
    password === ADMIN_ACCOUNT.password
  ) {
    const adminUser: AppUser = {
      uid: "ADMIN",
      email: "admin@local",
      role: UserRole.ADMIN,
    };

    localStorage.setItem("ADMIN_SESSION", "true");
    return adminUser;
  }

  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      usernameOrEmail,
      password
    );
    return await mapFirebaseUser(cred.user);
  } catch {
    throw new Error("Email hoặc mật khẩu không đúng");
  }
};

/* =========================
   ĐĂNG KÝ GIÁO VIÊN
========================= */
export const registerTeacher = async (
  email: string,
  password: string
) => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    role: UserRole.TEACHER,
    status: AccountStatus.PENDING,
    deleted: false,
    createdAt: serverTimestamp(),
  });
};

/* =========================
   ĐĂNG KÝ HỌC SINH
========================= */
export const registerStudent = async (
  email: string,
  password: string
) => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    role: UserRole.STUDENT,
    status: AccountStatus.APPROVED,
    deleted: false,
    createdAt: serverTimestamp(),
  });
};

/* =========================
   THEO DÕI LOGIN
========================= */
export const observeAuth = (
  callback: (user: AppUser | null) => void
) => {
  // 👉 ADMIN SESSION BỀN
  if (localStorage.getItem("ADMIN_SESSION") === "true") {
    callback({
      uid: "ADMIN",
      email: "admin@local",
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
      const appUser = await mapFirebaseUser(fbUser);
      callback(appUser);
    } catch {
      callback(null);
    }
  });
};

/* =========================
   LOGOUT
========================= */
export const logout = async () => {
  localStorage.removeItem("ADMIN_SESSION");
  await signOut(auth);
};
