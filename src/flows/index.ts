import { createFlow } from "@bot-whatsapp/bot";
import  { flowWelcome } from "./welcome.flow.js";
import { flowSeller } from "./seller.flow.js";
import { flowConfirmDate, flowSchedule } from "./schedule.flow.js";
import { flowAskEmail, flowConfirm, flowNotification, flowValidatingEmail } from "./confirm.flow.js";
import { flowSocial, flowVoiceSocial } from "./social.flow.js";

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
    flowConfirmDate])