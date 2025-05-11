import { format } from 'date-fns'

const getFullCurrentDate = (): string => {
    const currentD = new Date();
    const formatDate = format(currentD, 'yyyy/MM/dd HH:mm'); // Formato "dd/MM/yyyy HH:mm:ss"
    const day = format(currentD, 'EEEE'); // Obtener el día de la semana

    return [
        formatDate,
        day,
    ].join(' ')

}

const getFullCurrentDateFromTwoWeeks = (): string => {
    const currentD = new Date();
    const dateFromTwoWeeks = new Date(currentD.setDate(currentD.getDate() + 14));
    const formatDate = format(dateFromTwoWeeks, 'yyyy/MM/dd HH:mm'); // Formato "dd/MM/yyyy HH:mm:ss"
    const dayFromTwoWeek = format(currentD, 'EEEE'); // Obtener el día dentro de 2 semana

    return [
        formatDate,
        dayFromTwoWeek,
    ].join(' ')
}

export { getFullCurrentDate, getFullCurrentDateFromTwoWeeks }