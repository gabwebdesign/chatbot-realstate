import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { generateTimer } from "../utils/generateTimer";
import { getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/getDates";
import { flowWasiRequest } from "./wasi-request.flow";


const PROMPT_SELLER = `Eres el asistente virtual en la inmobiliaria "Rocaforte Real State", ubicada en San José, Costa Rica. Tu principal responsabilidad es averiguar las caracteristicas de la propiedad que el usuario esta necesitando.

-----
HISTORIAL DE LA CONVERSACION: {HISTORIAL_CONVERSACION}
-----
{CURRENT_DAY}
DIRECTRICES DE INTERACCIÓN:
1. Tu objetivo es buscar en el HISTORIAL DE LA CONVERSACION tres datos esenciales: Localidad de la propiedad, Cantidad de habitaciones y Cantidad de parqueos.
2. Vas a preguntar al usuario amablemente por los datos que no encuentres en el HISTORIAL DE LA CONVERSACION.
3. Si el usuario ha dado una respuesta vaga (ejemplo: "No sé", "Cualquiera", "No importa", "Lo que haya", "No necesito", etc), entonces y solo entonces consideraras que ese dato no es relevante y no lo colocarás como pendiente, sino como que el cliente ya contestó.
4. Interpreta respuestas con números en palabras o dígitos: "dos" o "2" para la cantidad de habitaciones, "tres" o "3" para la cantidad de parqueos.
5. No preguntes por información de contacto, ni por información personal. 
6. Solo debes preguntar por la localidad, cantidad de habitaciones y cantidad de parqueos, nada más.
7. Vas a responder con la frase "INFORMACIÓN COMPLETA" antes de tu pregunta, si en el HISTORIAL DE LA CONVERSACION se encuentran los tres datos esenciales, recuerda ignorar el dato que el cliente respondio vagamente.
8. Vas a responder con la frase  "INFORMACIÓN INCOMPLETA" antes de tu pregunta, si en el HISTORIAL DE LA CONVERSACION no se encuentran los tres datos esenciales, recuerda ignorar el dato que el cliente respondio vagamente.
9. Nunca incluyas la palabra "Vendedor:" o "Cliente:" en tus preguntas, solo la pregunta.
10. No preguntes por el rango de precio.
11. Si el usuario no ha dicho que el dato espacios de parqueo es irrelevante, entonces debes preguntar por la cantidad de parqueos.
`;


export const generatePromptSeller = (history:string) => {
    const nowDate = getFullCurrentDate()
    return PROMPT_SELLER.replace('{HISTORIAL_CONVERSACION}', history).replace('{CURRENT_DAY}', nowDate)
};

/**
 * Hablamos con el PROMPT que sabe sobre las cosas basicas del negocio, info, precio, etc.
 */
const flowSeller = addKeyword(EVENTS.ACTION).addAction(async (_, { state, flowDynamic, gotoFlow, extensions }) => {

    console.log('🔍 En Flow Seller')
    try {
        const ai = extensions.ai as AIClass
        const history = getHistoryParse(state)
        const prompt = generatePromptSeller(history)

        const text = await ai.createChat([
            {
                role: 'system',
                content: prompt
            }
        ],'gpt-3.5-turbo-16k')

        await handleHistory({ content: text, role: 'assistant' }, state)
        console.log('historial:', history)

        if(text.includes('INFORMACIÓN COMPLETA')){
            await flowDynamic('¡Excelente! Procesando su información.')
            return;
        }else{
            console.log('Preguntando por info faltante')
            const response = text.replace("INFORMACIÓN INCOMPLETA", "").trim();
            await flowDynamic([{ body: response, delay: generateTimer(50, 150) }]);
        }
        
    } catch (err) {
        console.log(`[ERROR]:`, err)
        return
    }
}).addAction({ capture: true }, async (message, { state, gotoFlow,flowDynamic,extensions }) => {
    console.log("✍️ Usuario respondió:", message.body);
    await handleHistory({ content: message.body, role: "user" }, state);

    // Verificamos nuevamente si ya se tienen los datos necesarios antes de reiniciar el flujo
    const history = getHistoryParse(state);
    console.log("📌 Historial después de la respuesta del usuario:", history);
    const prompt = generatePromptSeller(history);
    const ai = extensions.ai as AIClass

    const text = await ai.createChat([{ role: "system", content: prompt }], "gpt-3.5-turbo-16k");

    console.log("🔄 Verificación después de la respuesta del usuario:", text);

    if (text.includes("INFORMACIÓN COMPLETA")) {
        await flowDynamic("¡Gracias! ⏳ Procesando su información...");
        gotoFlow(flowWasiRequest);
        return;
    }

    await gotoFlow(flowSeller);
});

export { flowSeller }