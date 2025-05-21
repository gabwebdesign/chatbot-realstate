import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import { clearHistory, handleHistory, getHistoryParse } from "../utils/handleHistory.js";
import { getFullCurrentDate } from "../utils/getDates";
import twilio from "twilio";
import { Customer } from "src/utils/types";
import { GlobalState } from "src/utils/globalManagement";
import { isValidEmail } from "src/utils/validEmail";
import { createContact } from "src/services/hubspot/page";

const generatePromptToFormatDate = (history: string) => {
    const prompt = `Fecha de Hoy:${getFullCurrentDate()}, Basado en el Historial de conversacion: 
    ${history}
    ----------------
    Devuelve solo Fecha y hora para la cita en el siguiente formato: dd / mm hh:mm`

    return prompt
}

/**
 * Encargado de preguntar por el nombre al usuario
 */
const flowConfirm = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { state, flowDynamic, gotoFlow }) => {
        
        console.log('📅  In Confirm Flow');
            await flowDynamic('Ok, voy a pedirte unos datos para agendar')
            await flowDynamic('¿Cual es tu nombre?')
            await handleHistory({ content: '¿Cual es tu nombre?', role: 'assistant' }, state)
            return gotoFlow(flowAskEmail);
})

/**
 * Encargado grabar en la base de datos el nombre del usuario y preguntar fecha y hora
 */
const flowConfirmDate =  addKeyword(EVENTS.ACTION)
    .addAction({ capture: true }, async (ctx, { state, flowDynamic,gotoFlow ,extensions }) => {
        await state.update({ name: ctx.body })
        console.log('📅  En Flow Confirm Fecha');
        GlobalState.setUserName(ctx.body)
        const ai = extensions.ai as AIClass
        const history = getHistoryParse(state)

        const text = await ai.createChat([
            {
                role: 'system',
                content: generatePromptToFormatDate(history)
            }
        ], 'gpt-3.5-turbo-16k')

        if(state.get('startDate') == ''){
            await handleHistory({ content: text, role: 'assistant' }, state)
            await flowDynamic(`¿Me confirmas fecha y hora?: ${text}`)
        }
        return gotoFlow(flowAskEmail)

})

/**
 * Encargado de preguntar por el email
 */
const flowAskEmail = addKeyword(EVENTS.ACTION)
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, gotoFlow, extensions }) => {

        console.log('📅  In Flow Ask Email');
 
        await state.update({ name: ctx.body })
        await flowDynamic(`¿Cual es tu e-mail?`)
        await handleHistory({ content: '¿Cual es tu e-mail?', role: 'assistant' }, state)
        return gotoFlow(flowValidatingEmail);

})

const flowValidatingEmail = addKeyword(EVENTS.ACTION)
    .addAction({capture:true},async (ctx, { state, flowDynamic, gotoFlow }) => {
        console.log('📅  Validating Email');
        if(isValidEmail((ctx as any).body)){
            await state.update({ email: ctx.body })
            return gotoFlow(flowNotification)
        }else{ 
            await flowDynamic('Por favor, ingrese un email válido');
            return gotoFlow(flowValidatingEmail)
        }
})

const flowNotification = addKeyword(EVENTS.ACTION)  
    .addAction(async (ctx, { state, flowDynamic, endFlow }) => {

        const customer:Customer = {
            firstName: state.get('name'),
            email: ctx.body,
            phone: ctx.from
        }
        
        const client = twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN);
        const newCustomer = await createContact(customer);
        console.log('newCustomer', newCustomer);    
        
        await flowDynamic('Listo! Un agente de Inmobiliaria Casa Forte gestionará la cita para la hora deseada. Te estaremos informando lo más pronto posible.')
        await client.messages.create({
            body: `Un cliente ha solicitado crear una cita: 
                   Nombre: ${customer.firstName}
                   Posible fecha y hora: ${state.get('startDate')}
                   Email: ${customer.email}
                   Teléfono: ${customer.phone}
                   historial: ${getHistoryParse(state)}`,
            from: `whatsapp:+${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: "whatsapp:+50671386788"  // Inmobiliaria Roca Forte Phone number
        });
        clearHistory(state)
        await flowDynamic('Hasta luego!')
        return endFlow()

})

export { flowConfirm , flowAskEmail , flowValidatingEmail, flowNotification }

