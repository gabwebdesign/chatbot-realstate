import fetch from 'node-fetch';

const HUBSPOT_API_BASE_URL = 'https://api.hubapi.com';
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY; // Asegúrate de configurar esta variable de entorno

// Tipos de datos
interface Contact {
    email: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    company?: string;
}

interface Deal {
    dealName: string;
    amount: number;
    stage: string;
    closeDate: string;
    associatedContactIds: string[];
}

// Obtener todos los productos (products)
export const getProducts = async () => {
    try {
        const response = await fetch(`${HUBSPOT_API_BASE_URL}/crm/v3/objects/products`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${HUBSPOT_API_KEY}`,
            },
        });
        const data = await response.json();
        console.log('Productos encontrados:', data);
        return data;
    } catch (error) {
        console.error('Error en getProducts:', error);
        throw error;
    }
};

// Crear un contacto en HubSpot
export const createContact = async (contact: Contact) => {
    try {
        const response = await fetch(`${HUBSPOT_API_BASE_URL}/crm/v3/objects/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${HUBSPOT_API_KEY}`,
            },
            body: JSON.stringify({
                properties: {
                    email: contact.email,
                    firstname: contact.firstName,
                    lastname: contact.lastName,
                    phone: contact.phone,
                    company: contact.company,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Error creando contacto: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Contacto creado:', data);
        return data;
    } catch (error) {
        console.error('Error en createContact:', error);
        throw error;
    }
};

// Obtener un contacto por email
export const getContactByEmail = async (email: string) => {
    try {
        const response = await fetch(
            `${HUBSPOT_API_BASE_URL}/crm/v3/objects/contacts/search`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${HUBSPOT_API_KEY}`,
                },
                body: JSON.stringify({
                    filterGroups: [
                        {
                            filters: [
                                {
                                    propertyName: 'email',
                                    operator: 'EQ',
                                    value: email,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Error obteniendo contacto: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Contacto encontrado:', data);
        return data;
    } catch (error) {
        console.error('Error en getContactByEmail:', error);
        throw error;
    }
};

// Crear un negocio (deal) en HubSpot
export const createDeal = async (deal: Deal) => {
    try {
        const response = await fetch(`${HUBSPOT_API_BASE_URL}/crm/v3/objects/deals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${HUBSPOT_API_KEY}`,
            },
            body: JSON.stringify({
                properties: {
                    dealname: deal.dealName,
                    amount: deal.amount,
                    dealstage: deal.stage,
                    closedate: deal.closeDate,
                },
                associations: deal.associatedContactIds.map((contactId) => ({
                    to: { id: contactId },
                    types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
                })),
            }),
        });

        if (!response.ok) {
            throw new Error(`Error creando negocio: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Negocio creado:', data);
        return data;
    } catch (error) {
        console.error('Error en createDeal:', error);
        throw error;
    }
};


// Obtener todos los negocios (deals)
export const getDeals = async () => {
    try {
        const response = await fetch(`${HUBSPOT_API_BASE_URL}/crm/v3/objects/deals`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${HUBSPOT_API_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo negocios: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Negocios encontrados:', data);
        return data;
    } catch (error) {
        console.error('Error en getDeals:', error);
        throw error;
    }
};