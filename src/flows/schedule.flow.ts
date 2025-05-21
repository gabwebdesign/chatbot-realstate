import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import { getHistoryParse, handleHistory } from "../utils/handleHistory.js";
import { generateTimer } from "../utils/generateTimer.js";
import { getFullCurrentDate } from "src/utils/getDates.js";
import { gettingAgenda } from "src/services/wasi/index.js";
import { flowConfirm } from "./confirm.flow.js";

const PROMPT_SCHEDULE = `
Como ingeniero de inteligencia artificial especializado en la programación de reuniones, tu objetivo sugerir una fecha y hora para programar una reunión. La reunión durará aproximadamente 45 minutos y solo puede ser programada entre las 9am y las 4pm, de lunes a viernes.

Fecha de hoy: {CURRENT_DAY}

Reuniones ya agendadas:
-----------------------------------
{AGENDA_ACTUAL}

Historial de Conversacion:
-----------------------------------
{HISTORIAL_CONVERSACION}

Ejemplos de respuestas adecuadas para sugerir horarios y verificar disponibilidad:
----------------------------------
"Por supuesto, tengo un espacio disponible mañana a las 10am. ¿Te parece bien?"
"Sí, tengo un espacio disponible hoy a las 3pm. ¿Te gustaría reservarlo?"

INSTRUCCIONES:
- NO saludes
- Debes decirle al usuario que confirme
- Revisar detalladamente el historial de conversación y calcular el día fecha y hora que no tenga conflicto con otra hora ya agendada
- Respuestas cortas ideales para enviar por whatsapp con emojis

-----------------------------
Respuesta útil en primera persona:`;

const generatePromptToFormatDate = (history: string) => {
    const prompt = `Fecha de Hoy:${getFullCurrentDate()}, Basado en el Historial de conversacion: 
    ${history}
    ----------------
    Devuelve solo Fecha y hora para la cita en el siguiente formato: dd / mm hh:mm`

    return prompt
}

const generateSchedulePrompt = (summary: any, history: string) => {
    const nowDate = getFullCurrentDate()
    const mainPrompt = PROMPT_SCHEDULE
        .replace('{AGENDA_ACTUAL}', summary)
        .replace('{HISTORIAL_CONVERSACION}', history)
        .replace('{CURRENT_DAY}', nowDate)

    return mainPrompt
}

/**
 * Hable sobre todo lo referente a agendar citas, revisar historial saber si existe huecos disponibles
 */
const flowSchedule = addKeyword(EVENTS.ACTION).addAction(async (ctx, { extensions, state, gotoFlow, flowDynamic }) => {
    
    console.log('📅  In Flow Schedule');
    
    await flowDynamic('dame un momento...')
    const ai = extensions.ai as AIClass;
    const history = getHistoryParse(state)
    const list = await gettingAgenda()
    const promptSchedule = generateSchedulePrompt(list, history)

    const text = await ai.createChat([
        {
            role: 'system',
            content: promptSchedule
        }
    ], 'gpt-4');

    await handleHistory({ content: text, role: 'assistant' }, state)
    await flowDynamic([{ body: text, delay: generateTimer(150, 250) }]);
    return gotoFlow(flowConfirmDate);
    
})

const flowConfirmDate =  addKeyword(EVENTS.ACTION)
    .addAction({ capture: true }, async (ctx, { state, gotoFlow, extensions }) => {

        console.log('📅  En Flow Confirm Fecha');
        const ai = extensions.ai as AIClass
        await handleHistory({ content: ctx.body, role: 'user' }, state) 
        const history = getHistoryParse(state)

        const observer = await ai.createChat([
            {
                role: 'system',
                content: `Tu tarea es analizar la interacción entre el Vendedor y el Cliente y determinar si el cliente ha confirmado una fecha y hora para la cita.
                -----
                HISTORIAL DE LA CONVERSACION: ${history}
                -----
                INSTRUCCIONES:
                - Si el cliente ha respondido con "sí", "me parece bien", "confirmo", "está bien", "ok", "de acuerdo", "perfecto", "listo", "sí confirmado", "lo agendamos", o cualquier variación afirmativa, devuelve "[CONFIRMADO]".
                - Si el cliente responde con "no puedo", "otro día", "tengo otro compromiso", "no me sirve", "cambiemos de fecha", "prefiero otro día", o cualquier variación negativa, devuelve "[NO TODAVÍA]".
                - Si el cliente pregunta por otra fecha o menciona un día específico como "¿Tienes algún campo este jueves?", "¿Puede ser el viernes?", "Prefiero la próxima semana", devuelve "[NO TODAVÍA]".
                - Si la respuesta del cliente no es clara o no menciona explícitamente una confirmación, devuelve "[NO TODAVÍA]".
                - NO asumas que la cita está confirmada a menos que el usuario lo diga claramente.`
            }
        ], 'gpt-4-turbo');

        const convertDate = await ai.createChat([
            {
                role: 'system',
                content: generatePromptToFormatDate(history)
            }
        ],'gpt-3.5-turbo-16k');

        console.log('history  ',history)
        console.log('observer  ', observer)
        if(observer.includes('[CONFIRMADO]')){
            //await handleHistory({ content: observer, role: 'assistant' }, state)
            await state.update({ startDate: convertDate })
            console.log('Fecha y hora confirmada:', convertDate)
            return gotoFlow(flowConfirm);
        }else{
            return gotoFlow(flowSchedule);
        }
    })

export { flowSchedule, flowConfirmDate }