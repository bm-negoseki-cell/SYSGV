/**
 * SERVICE FOR CENTRALIZED DATA EXPORT
 * 
 * Conectado ao Google Apps Script para backup automático no Google Drive e Gmail.
 */

// URL do Webhook configurada
const CENTRAL_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby4H-zhiZ6ejhiHN6JEKTlAHfBXyKHim3w6p6wEfEY1NDodimkcsG-5IEJgqZCm-Cd0/exec'; 

/**
 * Envia dados para o servidor.
 * @param fileName Nome do arquivo para backup local e drive (CSV).
 * @param csvContent Conteúdo do arquivo CSV.
 */
export const uploadToCentral = async (fileName: string, csvContent: string): Promise<boolean> => {
  // 1. ALWAYS Force Local Download first (Critical Data Safety)
  // Isso garante que o guarda-vidas tenha o arquivo mesmo se ficar sem internet.
  try {
    const bom = "\uFEFF"; // Byte Order Mark para UTF-8 no Excel
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (e) {
    console.error("Local download failed", e);
  }

  // 2. Upload to Central Server (Google Drive/Gmail via Apps Script)
  if (CENTRAL_WEBHOOK_URL) {
    // OTIMIZAÇÃO DE PERFORMANCE (Fire-and-Forget):
    // Não usamos 'await' no fetch para não bloquear a interface do usuário.
    // O usuário percebe o encerramento como "imediato".
    // A flag 'keepalive: true' garante que o envio termine mesmo se o app fechar.
    
    const payload = {
      filename: fileName,
      content: csvContent, 
      timestamp: new Date().toISOString()
    };

    fetch(CENTRAL_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
      keepalive: true, 
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    })
    .then(() => console.log("Upload em background iniciado."))
    .catch((error) => console.error("Erro no upload em background:", error));

    // Retornamos true imediatamente para liberar a UI
    return true;
  } else {
    console.log("URL do Webhook não configurada. Apenas salvo localmente.");
    return true; 
  }
};

// Deprecated functions kept as stubs
export const initGoogleDrive = (cb: any) => { if(cb) cb(false); };
export const signInToDrive = async () => false;
export const getDriveToken = () => null;
export const uploadCSVToDrive = async () => "";