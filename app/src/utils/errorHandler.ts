/**
 * Error Handler Utilities
 * 處理 API 錯誤訊息格式
 */

/**
 * 從 API 錯誤回應中提取錯誤訊息
 *
 * FastAPI 可能回傳：
 * - 字串: { detail: "Error message" }
 * - 陣列: { detail: [{ msg: "Error", loc: [...] }] }
 */
export function extractErrorMessage(error: any, defaultMessage = '發生錯誤，請稍後再試'): string {
  // 優先檢查 response.data.detail
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    // Pydantic 驗證錯誤格式
    return detail
      .map((err: any) => {
        const field = err.loc ? err.loc[err.loc.length - 1] : '';
        const message = err.msg || err.message || '驗證失敗';
        return field ? `${field}: ${message}` : message;
      })
      .join('\n');
  }

  // 檢查 error.message
  if (error?.message) {
    return error.message;
  }

  return defaultMessage;
}

/**
 * 判斷錯誤類型
 */
export function getErrorType(error: any): 'network' | 'validation' | 'server' | 'unknown' {
  if (!error?.response) {
    return 'network';
  }

  const status = error.response.status;
  if (status >= 400 && status < 500) {
    return 'validation';
  }
  if (status >= 500) {
    return 'server';
  }

  return 'unknown';
}
