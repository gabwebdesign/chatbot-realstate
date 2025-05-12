export type Estates = {
    id_company: string;
    for_sale: boolean;
    for_rent: boolean;
    title: string;
    region_label: string;
    city_label: string;
    address: string;
    sale_price_label: number;
    rent_price_label: number;
    bedrooms: number;
    bathrooms: number;
  };

export type Task = {
    management_status_id: string;
    subject: string;
    date: Date;
    id_user: number;
}

export type User = {
    id_user: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
}

export type Customer = {
    email: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    company?: string;
}