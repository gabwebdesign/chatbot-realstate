import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import axios from 'axios';
import fetch from 'node-fetch';
import { fileTypeFromBuffer } from 'file-type'; // Importa la función específica

// Configura la API de OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPEN_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Descarga un archivo de audio y lo guarda temporalmente
 * @param {string} url - URL del audio
 * @returns {Promise<string>} - Ruta del archivo descargado
 */
const downloadAudio = async (url: string): Promise<string> => {
    try {
        if (!url) throw new Error('URL de audio no válida');

        const response = await axios.get(url, { responseType: 'arraybuffer' });
        
        const fileName = `audio_${Date.now()}.opus`;
        const dir = path.join(__dirname, '../../../temp');
        
        // Verificar si la carpeta existe, si no, crearla
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Archivo original y convertido
        const originalFilePath = path.join(dir, fileName);
        const convertedFilePath = originalFilePath.replace('.opus', '.mp3');

        // Use Buffer.from to ensure correct encoding
        const buffer = Buffer.from(response.data);
        fs.writeFileSync(convertedFilePath, buffer);

        // Convertir a mp3 usando FFmpeg
        //await new Promise((resolve, reject) => {
        //    exec(`ffmpeg -i "${originalFilePath}" -acodec libmp3lame "${originalFilePath.replace('.opus','.mp3')}"`, (error, stdout, stderr) => {
        //        if (error) {
        //            console.error('❌ Error convirtiendo el audio:', stderr);
        //            reject(error);
        //        } else {
        //            fs.unlinkSync(originalFilePath); // Elimina el archivo original
        //            resolve(true);
        //        }
        //    });
        //});

        return convertedFilePath;
    } catch (error) {
        console.error('❌ Error descargando el audio:', error);
        throw new Error('No se pudo descargar el audio');
    }
};

/**
 * Transcribe un archivo de audio usando Whisper
 * @param {string} filePath - Ruta del archivo de audio
 * @returns {Promise<string>} - Texto transcrito
 */
const transcribeAudio = async (filePath: string): Promise<string> => {
    const audioStream = fs.createReadStream(filePath);

    const response = await openai.audio.transcriptions.create({
        file: audioStream,
        model: "whisper-1",
        language: "es", // Cambia según el idioma del audio
    });

    fs.unlinkSync(filePath); // Elimina el archivo temporal
    return response.text;
};

export { downloadAudio, transcribeAudio };
