import { EVENTS, addKeyword } from "@bot-whatsapp/bot";
import { handleHistory } from "../utils/handleHistory";
import conversationalLayer from "src/layers/conversational.layer";
import mainLayer from "src/layers/main.layer";
import { GlobalState } from "src/utils/globalManagement";

const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { state, flowDynamic }) => {
        const history = GlobalState.getHistory();
        const context = ctx as any;
        const name = context.name? context.name : '';

        const hasGreeted = history.some(entry => entry.content.includes('Hola, te saluda tu agente de Roca Forte Real State'));        
        if (!hasGreeted) {
            await flowDynamic([
                { body: `Hola ${name}, te saluda tu agente de Casa Forte Real State,🫡 Es un verdadero gusto atenderte.!` },
                { body: `Cuenta con todo nuestro apoyo para hacer realidad tu casa 🙏` },
                { body: `Cuéntame en que te puedo ayudar 🙌` }
            ]);
            await handleHistory({ content: 'Hola, te saluda tu agente de Roca Forte Real State', role: 'assistant' }, state);
        }
    })
    .addAction(conversationalLayer)
    .addAction(mainLayer);

export { flowWelcome };