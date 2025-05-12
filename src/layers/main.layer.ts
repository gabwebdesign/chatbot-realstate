import { BotContext, BotMethods } from "@bot-whatsapp/bot/dist/types"
import { getHistoryParse } from "../utils/handleHistory"
import AIClass from "../services/ai"
import { flowSeller } from "../flows/seller.flow"
import { flowSchedule } from "../flows/schedule.flow"
import { flowSocial } from "src/flows/social.flow"
import { flowConfirm } from "src/flows/confirm.flow"

/**
 * Determina que flujo va a iniciarse basado en el historial que previo entre el bot y el humano
 */
export default async (_: BotContext, { state, gotoFlow, extensions }: BotMethods) => {
    const ai = extensions.ai as AIClass
    const history = getHistoryParse(state)    
    const prompt = `Como una inteligencia artificial avanzada, tu tarea es analizar el contexto de una conversación y determinar cuál de las siguientes acciones es más apropiada para realizar:
    --------------------------------------------------------
    Historial de conversación:
    {HISTORY}
    
    Posibles acciones a realizar:
    1. AGENDAR: Esta acción se debe realizar cuando el cliente expresa su deseo de programar una cita.
    2. BUSCAR PROPIEDAD: Esta acción se debe realizar cuando el cliente pregunta por una propiedad.
    3. CONFIRMAR: Esta acción se debe realizar cuando el cliente y el vendedor llegaron a un acuerdo mutuo proporcionando una fecha, dia y hora exacta sin conflictos de hora.
    5. NEUTRO: Se debe elegir cuando el cliente no ha dado suficiente información para tomar una acción, por ejemplo, si solo dice "Hola" o "Buenos días".
    -----------------------------
    Tu objetivo es comprender la intención del cliente y seleccionar la acción más adecuada en respuesta a su declaración.
    
    Respuesta ideal (AGENDAR|BUSCAR PROPIEDAD|CONFIRMAR):`.replace('{HISTORY}', history);

    const text = await ai.createChat([
            {
                role: 'system',
                content: prompt
            }
        ])
    
        console.log('DECISION --- ', text)
    
        if (text.includes('BUSCAR PROPIEDAD')) {
            await state.update({ currentFlow: flowSeller });
            return gotoFlow(flowSeller)
        }
    
        if (text.includes('LINK')) {
            await state.update({ currentFlow: flowSocial });
            return gotoFlow(flowSocial)
        }
        
        if (text.includes('AGENDAR')){
            await state.update({ currentFlow: flowSchedule });
            return gotoFlow(flowSchedule)
        }

        if (text.includes('CONFIRMAR')) {
            await state.update({ currentFlow: flowConfirm });
            return gotoFlow(flowConfirm)
        }
}