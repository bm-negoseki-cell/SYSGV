/**
 * SERVICE FOR CENTRALIZED DATA EXPORT
 * 
 * Instruções para configurar o salvamento automático no SEU Google Drive/Gmail:
 * 
 * 1. Crie um script em https://script.google.com/
 * 2. Cole o código de backend (doPost) fornecido.
 * 3. Publique como "App da Web" -> Executar como "Eu" -> Acesso "Qualquer pessoa".
 * 4. Cole a URL gerada na variável CENTRAL_WEBHOOK_URL abaixo.
 */

// COLE AQUI A URL DO SEU GOOGLE APPS SCRIPT (ex: https://script.google.com/macros/s/.../exec)
const CENTRAL_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby4H-zhiZ6ejhiHN6JEKTlAHfBXyKHim3w6p6wEfEY1NDodimkcsG-5IEJgqZCm-Cd0/exec'; 

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
    try {
      // Usamos 'no-cors' pois o Google Apps Script não suporta CORS padrão facilmente para POST
      // Isso significa que enviaremos os dados ("fire and forget"), mas não leremos a resposta detalhada.
      await fetch(CENTRAL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Apps Script lê melhor como text/plain no corpo
        },
        body: JSON.stringify({
          filename: fileName,
          content: csvContent,
          timestamp: new Date().toISOString()
        }),
        mode: 'no-cors' 
      });
      console.log("Dados enviados para o servidor central (Google Drive/Gmail).");
      return true;
    } catch (error) {
      console.error("Erro ao enviar para o servidor central:", error);
      // Não lançamos erro para o usuário final, pois o download local já garantiu os dados.
      return false;
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