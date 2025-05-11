import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// ✅ Define __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadAndDecryptAudio(audioMessage: any) {
    if (!audioMessage.url || !audioMessage.mediaKey) {
        console.error('❌ No hay URL o mediaKey en el mensaje de audio.');
        return;
    }

    const filePath = path.resolve(__dirname, `./../../../storage/audio_${Date.now()}.opus`);

    try {
        console.log('📥 Descargando el archivo de WhatsApp...');
        const response = await axios.get(audioMessage.url, { responseType: 'arraybuffer' });
        const encryptedBuffer = Buffer.from(response.data);

        console.log(`📏 Tamaño del archivo cifrado: ${encryptedBuffer.length} bytes`);

        // 🔍 Verificar si el tamaño del buffer es válido para AES
        if (encryptedBuffer.length < 16 || encryptedBuffer.length % 16 !== 0) {
            console.warn("⚠️ El archivo cifrado tiene un tamaño inesperado. Puede estar corrupto o comprimido.");
            return;
        }

        console.log('🔑 Desencriptando el audio...');
        const mediaKeyBuffer = Buffer.from(audioMessage.mediaKey);
        
        
        const decryptedBuffer = decryptMedia(encryptedBuffer, mediaKeyBuffer);

        console.log(`✅ Audio guardado en: ${filePath}`);
        fs.writeFileSync(filePath, decryptedBuffer);

        return filePath;
    } catch (error) {
        console.error('❌ Error procesando el audio:', error);
    }
}

function decryptMedia(encryptedBuffer: Buffer, mediaKeyBuffer: Buffer) {
    // 📌 Usa HKDF para derivar la clave (necesario para WhatsApp)
    const expandedMediaKey = hkdf(mediaKeyBuffer, 112, 'WhatsApp Audio Keys');

    const iv = expandedMediaKey.slice(0, 16);
    const cipherKey = expandedMediaKey.slice(16, 48); // ✅ Aseguramos que tiene 32 bytes

    // 🛠️ Evitar errores de padding
    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
        let decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
        return decryptedBuffer;
    } catch (error) {
        console.error("❌ Error al desencriptar: ", error.message);
        throw error;
    }
}

// 📌 Implementamos HKDF (HMAC-based Key Derivation Function)
function hkdf(key: Buffer, length: number, info: string) {
    const prk = crypto.createHmac('sha256', Buffer.alloc(32)).update(key).digest();
    let t = Buffer.alloc(0);
    let okm = Buffer.alloc(0);

    for (let i = 0; i < Math.ceil(length / 32); i++) {
        t = crypto.createHmac('sha256', prk).update(Buffer.concat([t, Buffer.from(info), Buffer.from([i + 1])])).digest();
        okm = Buffer.concat([okm, t]);
    }

    return okm.subarray(0, length);
}

export { downloadAndDecryptAudio };
