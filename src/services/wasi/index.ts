import 'dotenv/config';
import AIClass from "../ai";
import { GlobalState } from 'src/utils/globalManagement';
import parseToArray from 'src/utils/parseToArray';
import { getFullCurrentDate, getFullCurrentDateFromTwoWeeks } from 'src/utils/getDates';
import { Customer, Estates, Task, User } from 'src/utils/types';

async function fetchEstates() {

    const response = await fetch("https://api.wasi.co/v1/property/search",{
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "wasi_token": process.env.WASI_TOKEN,
            "id_company": process.env.WASI_COMPANY_ID,
            "order_by": "created_at",
            "order": "asc"
        })
    });
    const data = await response.json();
    const propertiesArray = Object.values(data);

    // reducir los datos
    const filteredProperties: Estates[] = 
        propertiesArray.map((property: any) => ({
            id_company: property.id_company,
            for_sale: property.for_sale,
            for_rent: property.for_rent,
            title: property.title,
            region_label: property.region_label,
            city_label: property.city_label,
            address: property.address,
            sale_price_label: property.sale_price_label,
            rent_price_label: property.rent_price_label,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms
        }));
  
    return JSON.stringify(filteredProperties, null, 2);
}

async function IAsearchingEstates() {
    const extensions = { ai: new AIClass( process.env.OPEN_API_KEY, 'gpt-3.5-turbo-16k')};
    const estates = await fetchEstates();
    const ai = extensions.ai as AIClass;

     // Extraer el historial del usuario desde botStage
     const userHistory = GlobalState.getHistory();

     // Si no hay historial, usar un mensaje por defecto
     if (userHistory.length === 0) {
         return "No hay historial de búsqueda disponible.";
     }

    const prompt = `Eres un asistente inmobiliario inteligente. Tu tarea es analizar el historial de búsqueda del usuario y encontrar las propiedades más relevantes.

    📌 **Historial de búsqueda del usuario:**
    ${JSON.stringify(userHistory, null, 2)}

    🏡 **Propiedades disponibles en la API:**
    ${JSON.stringify(estates, null, 2)}

    🎯 **Tarea:**  
    - Selecciona hasta 3 propiedades que mejor coincidan con las preferencias del usuario.  
    - Si no hay coincidencias exactas, ofrece las más cercanas. 
    - Si no hubo ninguna coincidencias devuelve un mensaje adecuado explicando que las disponibles son las opciones disponibles son las más aproximadas.
    - Si hubo aunque sea una coincidencia, devuelve un mensaje adecuado con las propiedades encontradas.
    - Devuelve en la respuesta cada coincidencias (si has encontrado) en el siguiente formato:
            \n
            🏠: "title"\n
            📍: "city_label"\n
            📍: "region_label"\n
            📍: "address"\n
            💰 Precio de Venta: "sale_price"\n
            💰 Precio de Renta: "rent_price"\n
            🛏️ Habitaciones: "bedrooms"\n
            🛁 Baños: "bathrooms" \n
            \n`;

    const text = await ai.createChat([
        {
            role: 'system',
            content: prompt
        }
    ])

    return text;
}

async function getEstatesById(id: string) {
    try {
        const response = await fetch(`https://api.wasi.co/v1/property/get/${id}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "wasi_token": process.env.WASI_TOKEN,
                "id_company": process.env.WASI_COMPANY_ID,
                "id_user": process.env.WASI_USER_ID,
                "id_property": id
            })
        });
        return await response.json();
    } catch (error) {
        console.error(`An error occurred while fetching estate by ID: ${error}`);
        throw error;
    }
}

async function gettingAgenda() {
    try {
        const users = await gettingAllUsers();

        const userList = users.map((user: User) => ({
            id_user: user.id_user,
            first_name: user.first_name,
            last_name: user.last_name
        }));

        const tasks: Task[] = [];

        if (users.length) {
            const taskAvailable = await Promise.all(userList.map(async (user: User) => {
                try {
                    const start = getFullCurrentDate()[0];
                    const end = getFullCurrentDateFromTwoWeeks()[0];
                    const wasi_token = process.env.WASI_TOKEN;
                    const id_company = process.env.WASI_COMPANY_ID;
                    const url = `https://api.wasi.co/v1/management/tasks?id_user=${user.id_user}&start=${start}&end=${end}&wasi_token=${wasi_token}&id_company=${id_company}`;

                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            "Content-Type": "application/json",
                        }
                    });

                    if (!response.ok) {
                        console.error(`Error fetching tasks for user ${user.id_user}: ${response.statusText}`);
                        return [];
                    }

                    const data = await response.json();
                    return parseToArray(data) as User[];
                } catch (error) {
                    console.error(`An error occurred while fetching tasks for user ${user.id_user}: ${error}`);
                    return [];
                }
            }));
            console.log(taskAvailable[0]);
            return taskAvailable[0];
        }
    } catch (error) {
        console.error(`An error occurred in gettingAgenda: ${error}`);
        throw error;
    }
}

const gettingAllUsers= async(): Promise<User[]> => {
    const response = await fetch("https://api.wasi.co/v1/user/all-users",{
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "wasi_token": process.env.WASI_TOKEN,
            "id_company": process.env.WASI_COMPANY_ID,
            "id_user": process.env.WASI_USER_ID,
        })
    });

    const data = await response.json();
    return parseToArray(data) as User[];
}

async function createClient(user: Customer) {
    try {
        const response = await fetch("https://api.wasi.co/v1/client/add", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "wasi_token": process.env.WASI_TOKEN,
                "id_company": process.env.WASI_COMPANY_ID,
                "first_name": user.firstName,
                "email": user.email,
                "phone": user.phone,
                "id_user": process.env.WASI_USER_ID,
                "id_country": 36,  // Costa Rica, dato temporal
                "id_region": 1793, // Escazu, dato temporal
                "id_city": 554651 // San Rafael, dato temporal
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`An error occurred while creating the client: ${error}`);
        throw error;
    }
}

const relateClientToProperty = async (id_client: string, id_property: string) => {
    try {
        console.log(`Relacionando cliente ${id_client} con propiedad ${id_property}`);

        const response = await fetch(`https://api.wasi.co/v1/client/${id_client}/add-property/${id_property}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "wasi_token": process.env.WASI_TOKEN,
                "id_company": process.env.WASI_COMPANY_ID,
                "id_client": id_client,
                "id_property": id_property
            })
        });

        if (!response.ok) {
            console.error(`Error relacionando cliente con propiedad: ${response.statusText}`);
            throw new Error(`Error relacionando cliente con propiedad: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error(`An error occurred while relating client to property: ${error}`);
        throw error;
    }
};

async function createTask(task: Task) {
    const response = await fetch("https://api.wasi.co/v1/management/tasks",{
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "wasi_token": process.env.WASI_TOKEN,
            "id_company": process.env.WASI_COMPANY_ID,
            "management_status_id": task.management_status_id,
            "subject": task.subject,
            "date": task.date,
            "id_user": task.id_user
        })
    });

    return response;
}

export { 
    fetchEstates, 
    IAsearchingEstates, 
    getEstatesById, 
    gettingAllUsers,
    createClient, 
    gettingAgenda, 
    createTask,
    relateClientToProperty
};
