import { addKeyword, EVENTS } from "@bot-whatsapp/bot"
import AIClass from "../services/ai/index.js"
import { generateTimer } from "../utils/generateTimer.js"
import { getHistoryParse, handleHistory } from "../utils/handleHistory.js";
import propertyData from "../utils/property.json";
import { flowSchedule } from "./schedule.flow.js";
import { downloadAndDecryptAudio } from "../services/whisper/downloadAndDecryptAudio.js";
import extractWasiLink from "../utils/indentifyLink.js";
import { getEstatesById } from "../services/wasi/index.js";
import { GlobalState } from "../utils/globalManagement.js";


const propiedad = propertyData;


const PROMPT_SOCIAL = `Eres un agente inmobiliaria "Rocaforte Real State". Tu principal responsabilidad es responder al cliente con cada pregunta que tenga sobre la PROPIEDAD.

-----
HISTORIAL DE LA CONVERSACION: {HISTORIAL_CONVERSACION}
-----

-----
DATOS PROPIEDAD: {PROPIEDAD}
-----

Aquí tienes los detalles de la propiedad que el cliente está interesado en comprar: DATOS PROPIEDAD:

DIRECTRICES DE INTERACCIÓN:
Consulta al HISTORIAL DE LA CONVERSACION para tomar la ultima conversacion con el cliente, DEBES responder esa pregunta con los DATOS PROPIEDAD.
Ignora los URLs en el HISTORIAL DE LA CONVERSACION, solo utilizas datos en DATOS PROPIEDAD para formular las respuestas.
Nunca incluyas la palabra "Vendedor:" o "Cliente:" en tus respuestas.
No saludes.
Debes motivarlo a que agende una cita.
No repitas respuestas anteriores, para evitar eso consulta el HISTORIAL DE LA CONVERSACION.
NUNCA pero nunca des el URL o link de la propiedad, solo responde con los datos de la propiedad.
No debes confirmar la cita, solo motivarlo a que agende una cita.
`;


export const generatePromptSeller = (history:string, property:any) => {

    return PROMPT_SOCIAL.replace('{HISTORIAL_CONVERSACION}', history)
    .replace('{PROPIEDAD}', JSON.stringify(property))
};

const flowSocial = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, flowDynamic, gotoFlow, extensions }) => {
    console.log('🔍 En Flow Social')

    try{
        const ai = extensions.ai as AIClass
        const observer = extensions.ai as AIClass
        const history = getHistoryParse(state)
        const urlProvidedValid = extractWasiLink(ctx.body);
        
        if(urlProvidedValid){
            const propertyId = urlProvidedValid.split('/').pop();
            GlobalState.setPropertyId(propertyId);
        }

        const property = await getEstatesById(GlobalState.getPropertyId());
        //console.log('Propiedad:', property)
        const prompt = generatePromptSeller(history,property);

        const text = await ai.createChat([
            {
                role: 'system',
                content: prompt
            }
        ],'gpt-3.5-turbo-16k')

        const observerAgent = await observer.createChat([
            {
                role: 'system',
                content: `Tu tarea es observar la interacción entre el agente y el cliente y detectar si el usuario quiere crear una cita o reunion. 
                -----
                HISTORIAL DE LA CONVERSACION: ${history}
                -----
                Si el cliente quiere quiere agendar una cita devuelve "AGENDAR" de lo contrario "NO TODAVÍA"`
            }
        ], 'gpt-3.5-turbo-16k')

        //console.log('observador:', observerAgent)

        if(observerAgent.includes('AGENDAR')){
            return gotoFlow(flowSchedule)
        }else{
            await handleHistory({ content: text, role: 'assistant' }, state)
            await flowDynamic([{ body: text, delay: generateTimer(50, 150) }]);
        }
        console.log('historial:', history)
        
    } catch (err) {
        console.log(`[ERROR]:`, err)
        return
    }
})

const flowVoiceSocial= addKeyword(EVENTS.VOICE_NOTE)
    .addAction(async (ctx, { flowDynamic, provider, extensions }) => {
        const context = ctx as any;
        const audioFile = context.message?.audioMessage;
        const file =  await downloadAndDecryptAudio(audioFile);
        console.log('🔊 Archivo de audio:', file);
    })


export { flowSocial, flowVoiceSocial };