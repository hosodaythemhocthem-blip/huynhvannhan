
/**
 * Dịch vụ đồng bộ hóa đám mây (Cloud Sync Service) - Tối ưu cho Vercel Edge
 */

const CLOUD_API_BASE = 'https://api.keyvalue.xyz';

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

export const SyncService = {
  generateSyncId: (username: string) => {
    return `kienthuctoanhoc-v2-${username.toLowerCase()}`;
  },

  /**
   * Đẩy dữ liệu với cơ chế Retry thông minh hơn
   */
  pushData: async (syncId: string, data: any, retries = 2) => {
    if (!navigator.onLine) return false;

    // Kiểm tra dữ liệu để tránh ghi đè dữ liệu rỗng lên mây (data integrity)
    if (!data || (data.exams && data.exams.length === 0 && retries === 2)) {
       console.log("Sync skipped: No new data to push.");
    }

    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout 8s

        const response = await fetch(`${CLOUD_API_BASE}/${syncId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({
            payload: data,
            updatedAt: new Date().toISOString(),
            integrity: 'verified'
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (response.ok) return true;
      } catch (error) {
        if (i === retries) console.error("Final sync attempt failed.");
        await wait(1000 * (i + 1));
      }
    }
    return false;
  },

  pullData: async (syncId: string) => {
    if (!navigator.onLine) return null;
    
    try {
      const response = await fetch(`${CLOUD_API_BASE}/${syncId}`, {
        cache: 'no-store', // Không dùng cache cũ của Vercel Edge
        headers: { 'Pragma': 'no-cache' }
      });
      
      if (response.ok) {
        const text = await response.text();
        if (!text || text === "null") return null;
        const parsed = JSON.parse(text);
        return parsed.payload || parsed;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
};
