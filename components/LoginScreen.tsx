const [fullName, setFullName] = useState("");

const handleRegisterStudent = async () => {
  try {
    await authService.register(email, password, "student", fullName);
    alert("Đăng ký thành công. Chờ duyệt.");
  } catch (err: any) {
    setError(err.message);
  }
};
