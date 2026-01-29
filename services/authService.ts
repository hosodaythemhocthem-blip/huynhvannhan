import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { UserRole } from "../types";

const auth = getAuth();
const db = getFirestore();

/* =========================
   ADMIN HARD CODE
========================= */
const ADMIN_USERNAME = "huynhvannhan";
const ADMIN_PASSWORD = "huynhvannhan2020";

/* =========================
   LOGIN
========================= */
export async function login(
  role: UserRole,
  username: string,
  password: string
): Promise<{ role: UserRole; userName: string }> {
  // 👉 ADMIN bypass Firestore
  if (role === "ADMIN") {
    if (
      username === ADMIN_USERNAME &&
      password === ADMIN_PASSWORD
    ) {
      return { role: "ADMIN", userName: "Admin" };
    }
    throw new Error("Sai tài khoản hoặc mật khẩu Admin");
  }

  // 👉 Teacher / Student dùng Firebase Auth
  const email = `${username}@lms.edu`;

  const cred = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const userRef = doc(db, "users", cred.user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error("Không tìm thấy dữ liệu người dùng");
  }

  const data = snap.data();

  if (data.role === "TEACHER" && data.status === "PENDING") {
    throw new Error(
      "Tài khoản Giáo viên đang chờ Quản trị viên phê duyệt"
    );
  }

  return {
    role: data.role,
    userName: data.username,
  };
}

/* =========================
   REGISTER (Teacher / Student)
========================= */
export async function register(
  role: UserRole,
  username: string,
  password: string
) {
  if (role === "ADMIN") {
    throw new Error("Không thể đăng ký Admin");
  }

  const email = `${username}@lms.edu`;

  const cred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await setDoc(doc(db, "users", cred.user.uid), {
    username,
    role,
    status: role === "TEACHER" ? "PENDING" : "ACTIVE",
    createdAt: serverTimestamp(),
  });
}
