// Nơi lưu đường dẫn: services/googleDriveService.ts

/**
 * Service xử lý các tương tác với Google Drive API
 * (Bản chuẩn bị để fix lỗi build Vercel và tích hợp sau này)
 */

export const uploadToGoogleDrive = async (folderId: string, file: File) => {
  console.log("Đang giả lập upload file lên Drive:", file.name);
  // Code thực tế gọi Google API sẽ nằm ở đây
  return { success: true, url: "https://drive.google.com/..." };
};

export const fetchDriveFiles = async (folderId: string) => {
  console.log("Đang lấy danh sách file từ thư mục:", folderId);
  return [];
};

export const deleteDriveFile = async (fileId: string) => {
  console.log("Đang xóa file:", fileId);
  return true;
};

// Export mặc định để ClassManagement.tsx import không bị lỗi
const googleDriveService = {
  uploadToGoogleDrive,
  fetchDriveFiles,
  deleteDriveFile
};

export default googleDriveService;
