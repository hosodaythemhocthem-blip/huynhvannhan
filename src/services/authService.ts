import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * =========================
 * ĐĂNG KÝ GIÁO VIÊN
 * - Lưu vĩnh viễn trong Firestore
 * - Mặc định: pending
 * =========================
 */
export const registerTeacher = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // 🔒 LƯU VĨNH VIỄN – KHÔNG TỰ MẤT
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    role: "teacher",
    status: "pending",     // chờ admin duyệt
    deleted: false,        // chỉ admin mới xóa
    createdAt: serverTimestamp()
  });

  return user;
};

/**
 * =========================
 * ĐĂNG NHẬP
 * - Chỉ ĐỌC Firestore
 * - Không ghi lại user
 * =========================
 */
export const login = async (
  email: string,
  password: string
) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    throw new Error("Tài khoản không tồn tại trong hệ thống");
  }

  const userData = snap.data();

  if (userData.deleted) {
    throw new Error("Tài khoản đã bị admin xóa");
  }

  if (userData.role === "teacher" && userData.status !== "approved") {
    throw new Error("Tài khoản giáo viên đang chờ admin duyệt");
  }

  return userData;
};

/**
 * =========================
 * ĐĂNG XUẤT
 * =========================
 */
export const logout = async () => {
  await signOut(auth);
};
