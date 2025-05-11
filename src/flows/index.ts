import { createFlow } from "@bot-whatsapp/bot";
import  { flowWelcome } from "./welcome.flow";
import { flowSeller } from "./seller.flow";
import { flowConfirmDate, flowSchedule } from "./schedule.flow";
import { flowAskEmail, flowConfirm, flowNotification, flowValidatingEmail } from "./confirm.flow";
import { flowWasiRequest } from "./wasi-request.flow";
import { flowSocial, flowVoiceSocial } from "./social.flow";

/**
 * Declaramos todos los flujos que vamos a utilizar
 */
export default createFlow([
    flowWelcome,
    flowSocial,
    flowVoiceSocial,
    flowSeller, 
    flowSchedule,
    flowConfirm,
    flowAskEmail,
    flowNotification,
    flowValidatingEmail,
    flowConfirmDate, 
    flowWasiRequest])