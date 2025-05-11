import { format, addMinutes } from 'date-fns'
import { GlobalState } from 'src/utils/globalManagement'

/**
 * get calendar
 * @returns 
 */
const getCurrentCalendar = async (): Promise<string> => {
    const dataCalendarApi = await fetch('https://hook.eu2.make.com/yvwkwwxs82vw3o23j7ndtv3luhtvucus')
    const json: any[] = await dataCalendarApi.json()
    const list = json.reduce((prev, current) => {
        return prev += [
            `Espacio reservado (no disponible): `,
            `Desde ${format(current.date, 'eeee do h:mm a')} `,
            `Hasta ${format(addMinutes(current.date, 45), 'eeee do h:mm a')} \n`,
        ].join(' ')
    }, '')
    return list
}

/**
 * add to calendar
 * @param text 
 * @returns 
 */
const appToCalendar = async (text: string) => {
    try {
        const payload = JSON.parse(text)
        const response = await fetch('https://api.wasi.co/v1/management/add', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "wasi_token": process.env.WASI_TOKEN,
                "id_company": process.env.WASI_COMPANY_ID,
                "management_type_id": 3,
                "subject": `${payload.name} interesado en Propiedad`,
                "date": payload.startDate,
                "id_user": process.env.WASI_USER_ID,
                "description": GlobalState.getHistory()
            })
        })
        return response
    } catch (err) {
        console.log(`error: `, err)
    }
}

export { getCurrentCalendar, appToCalendar }