import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import { IAsearchingEstates } from "src/services/wasi";
import { handleHistory } from "src/utils/handleHistory";

const flowWasiRequest = addKeyword(EVENTS.WELCOME)
    .addAction(async (_, { state, flowDynamic}) => {
        try {
            const estates = await IAsearchingEstates();
            console.log(`[INFO]:`, estates.trim())
            await flowDynamic([{ body: estates }])
            await handleHistory({ content: estates, role: 'assistant' }, state)
            await flowDynamic([{ body: '¿Desea agendar una cita para mayor información?' }])
            await handleHistory({ content: '¿Desea agendar una cita para mayor información?', role: 'assistant' }, state)
        } catch (err) {
            console.log(`[ERROR]:`, err)
            return;
        }
    }
    );

export { flowWasiRequest };