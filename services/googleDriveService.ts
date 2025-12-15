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
 * @param skipLocalDownload Se true, envia apenas para nuvem sem baixar no dispositivo (Útil para testes em lote).
 */
export const uploadToCentral = async (fileName: string, csvContent: string, skipLocalDownload: boolean = false): Promise<boolean> => {
  // 1. Local Download (Backup Safety) - Skipped during stress tests
  if (!skipLocalDownload) {
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

    // Para testes de estresse, usamos uma promessa real para garantir a sequência, 
    // mas mantemos a estrutura original do fire-and-forget para uso normal.
    if (skipLocalDownload) {
      console.log(`[StressTest] Uploading ${fileName} to cloud...`);
      try {
        await fetch(CENTRAL_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        console.log(`[StressTest] Upload finished for ${fileName}`);
        return true;
      } catch (err) {
        console.error(`[StressTest] Failed upload for ${fileName}`, err);
        return false;
      }
    } else {
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
        
        return true;
    }
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