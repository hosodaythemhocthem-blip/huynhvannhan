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
   APP USER (CHUẨN ỨNG DỤNG)
========================= */
export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status?: AccountStatus;
}

/* =========================
   ADMIN NỘI BỘ (CỨU HỆ THỐNG)
========================= */
const ADMIN_ACCOUNT = {
  email: "huynhvannhan",
  password: "huynhvannhan2020",
  role: UserRole.ADMIN,
};

/* =========================
   MAP FIREBASE USER → APP USER
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
    data.status !== AccountStatus.APPROVED
  ) {
    throw new Error("Tài khoản giáo viên đang chờ admin duyệt");
  }

  return {
    uid: fbUser.uid,
    email: fbUser.email || "",
    role: data.role,
    status: data.status,
  };
};

/* =========================
   ĐĂNG NHẬP DUY NHẤT
========================= */
export const login = async (
  email: string,
  password: string
): Promise<AppUser> => {
  /* 👉 ADMIN ƯU TIÊN */
  if (
    email === ADMIN_ACCOUNT.email &&
    password === ADMIN_ACCOUNT.password
  ) {
    return {
      uid: "ADMIN",
      email,
      role: UserRole.ADMIN,
    };
  }

  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return await mapFirebaseUser(cred.user);
  } catch (err: any) {
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
   THEO DÕI TRẠNG THÁI LOGIN
========================= */
export const observeAuth = (
  callback: (user: AppUser | null) => void
) => {
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
   ĐĂNG XUẤT
========================= */
export const logout = async () => {
  await signOut(auth);
};
