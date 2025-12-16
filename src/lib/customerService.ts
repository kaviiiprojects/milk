

import prisma from "./prisma";
import { type Customer } from "./types";

export const CustomerService = {
  async getAllCustomers(): Promise<Customer[]> {
    const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
    return customers.map(c => ({
      id: c.id,
      avatar: c.avatar || undefined,
      name: c.name,
      phone: c.phone,
      address: c.address || undefined,
      shopName: c.shopName || undefined,
      status: c.status as Customer["status"],
      createdAt: c.createdAt || undefined,
      updatedAt: c.updatedAt || undefined,
      name_lowercase: c.name_lowercase || undefined,
      shopName_lowercase: c.shopName_lowercase || undefined,
    }));
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const c = await prisma.customer.findUnique({ where: { id } });
    return c
      ? {
          id: c.id,
          avatar: c.avatar || undefined,
          name: c.name,
          phone: c.phone,
          address: c.address || undefined,
          shopName: c.shopName || undefined,
          status: c.status as Customer["status"],
          createdAt: c.createdAt || undefined,
          updatedAt: c.updatedAt || undefined,
          name_lowercase: c.name_lowercase || undefined,
          shopName_lowercase: c.shopName_lowercase || undefined,
        }
      : null;
  },

  async createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
    const created = await prisma.customer.create({
      data: {
        name: customerData.name,
        phone: customerData.phone,
        status: (customerData.status || 'active') as any,
        address: customerData.address ?? null,
        shopName: customerData.shopName ?? null,
        avatar: customerData.avatar ?? null,
        name_lowercase: customerData.name.toLowerCase(),
        shopName_lowercase: customerData.shopName ? customerData.shopName.toLowerCase() : null,
      },
    });
    return {
      id: created.id,
      avatar: created.avatar || undefined,
      name: created.name,
      phone: created.phone,
      address: created.address || undefined,
      shopName: created.shopName || undefined,
      status: created.status as Customer["status"],
      createdAt: created.createdAt || undefined,
      updatedAt: created.updatedAt || undefined,
      name_lowercase: created.name_lowercase || undefined,
      shopName_lowercase: created.shopName_lowercase || undefined,
    };
  },

  async updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
    await prisma.customer.update({
      where: { id },
      data: {
        avatar: customerData.avatar,
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        shopName: customerData.shopName,
        status: customerData.status as any,
        name_lowercase: customerData.name ? customerData.name.toLowerCase() : undefined,
        shopName_lowercase: customerData.shopName ? customerData.shopName.toLowerCase() : undefined,
      },
    });
  },

  async deleteCustomer(id: string): Promise<void> {
    await prisma.customer.delete({ where: { id } });
  }
};
