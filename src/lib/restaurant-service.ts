
import { supabase } from "@/integrations/supabase/client";
import { 
  RestaurantSection, 
  RestaurantTable, 
  MenuCategory, 
  MenuItem, 
  Order, 
  OrderItem, 
  OrderWithItems 
} from "./types";

// Restaurant Sections
export const getSections = async (): Promise<RestaurantSection[]> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_sections')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    
    return data.map(section => ({
      id: section.id,
      name: section.name,
      createdAt: section.created_at
    }));
  } catch (error) {
    console.error('Error fetching restaurant sections:', error);
    throw error;
  }
};

export const createSection = async (name: string): Promise<RestaurantSection> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_sections')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error creating restaurant section:', error);
    throw error;
  }
};

export const updateSection = async (id: string, name: string): Promise<RestaurantSection> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_sections')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error updating restaurant section:', error);
    throw error;
  }
};

export const deleteSection = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('restaurant_sections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting restaurant section:', error);
    throw error;
  }
};

// Restaurant Tables
export const getTables = async (sectionId?: string): Promise<RestaurantTable[]> => {
  try {
    let query = supabase
      .from('restaurant_tables')
      .select('*')
      .order('table_number', { ascending: true });
    
    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    
    return data.map(table => ({
      id: table.id,
      sectionId: table.section_id,
      tableNumber: table.table_number,
      seats: table.seats,
      createdAt: table.created_at
    }));
  } catch (error) {
    console.error('Error fetching restaurant tables:', error);
    throw error;
  }
};

export const createTable = async (sectionId: string, tableNumber: number, seats: number): Promise<RestaurantTable> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({ 
        section_id: sectionId,
        table_number: tableNumber,
        seats
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      sectionId: data.section_id,
      tableNumber: data.table_number,
      seats: data.seats,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error creating restaurant table:', error);
    throw error;
  }
};

export const updateTable = async (id: string, tableNumber: number, seats: number): Promise<RestaurantTable> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update({ 
        table_number: tableNumber,
        seats
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      sectionId: data.section_id,
      tableNumber: data.table_number,
      seats: data.seats,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error updating restaurant table:', error);
    throw error;
  }
};

export const deleteTable = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting restaurant table:', error);
    throw error;
  }
};

// Menu Categories
export const getMenuCategories = async (): Promise<MenuCategory[]> => {
  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    
    return data.map(category => ({
      id: category.id,
      name: category.name,
      displayOrder: category.display_order,
      createdAt: category.created_at
    }));
  } catch (error) {
    console.error('Error fetching menu categories:', error);
    throw error;
  }
};

// Menu Items
export const getMenuItems = async (categoryId?: string): Promise<MenuItem[]> => {
  try {
    let query = supabase
      .from('menu_items')
      .select('*')
      .order('name', { ascending: true });
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      description: item.description,
      price: item.price,
      available: item.available,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

// Orders
export const getActiveOrder = async (tableId: string): Promise<OrderWithItems | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          menu_item:menu_items(*)
        ),
        table:restaurant_tables(*)
      `)
      .eq('table_id', tableId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    
    if (!data) return null;
    
    return {
      id: data.id,
      tableId: data.table_id,
      employeeId: data.employee_id,
      status: data.status,
      stillWater: data.still_water,
      sparklingWater: data.sparkling_water,
      bread: data.bread,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      items: data.items.map((item: any) => ({
        id: item.id,
        orderId: item.order_id,
        menuItemId: item.menu_item_id,
        quantity: item.quantity,
        notes: item.notes,
        createdAt: item.created_at,
        menuItem: {
          id: item.menu_item.id,
          categoryId: item.menu_item.category_id,
          name: item.menu_item.name,
          description: item.menu_item.description,
          price: item.menu_item.price,
          available: item.menu_item.available,
          createdAt: item.menu_item.created_at
        }
      })),
      table: {
        id: data.table.id,
        sectionId: data.table.section_id,
        tableNumber: data.table.table_number,
        seats: data.table.seats,
        createdAt: data.table.created_at
      }
    };
  } catch (error) {
    console.error('Error fetching active order:', error);
    throw error;
  }
};

export const createOrder = async (
  tableId: string, 
  employeeId: string,
  stillWater: number = 0,
  sparklingWater: number = 0,
  bread: number = 0
): Promise<Order> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({ 
        table_id: tableId,
        employee_id: employeeId,
        still_water: stillWater,
        sparkling_water: sparklingWater,
        bread: bread,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      tableId: data.table_id,
      employeeId: data.employee_id,
      status: data.status,
      stillWater: data.still_water,
      sparklingWater: data.sparkling_water,
      bread: data.bread,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrder = async (
  id: string,
  stillWater?: number,
  sparklingWater?: number,
  bread?: number,
  status?: 'active' | 'completed' | 'cancelled'
): Promise<Order> => {
  try {
    const updateData: any = {};
    
    if (stillWater !== undefined) updateData.still_water = stillWater;
    if (sparklingWater !== undefined) updateData.sparkling_water = sparklingWater;
    if (bread !== undefined) updateData.bread = bread;
    if (status !== undefined) updateData.status = status;
    
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      tableId: data.table_id,
      employeeId: data.employee_id,
      status: data.status,
      stillWater: data.still_water,
      sparklingWater: data.sparkling_water,
      bread: data.bread,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const addOrderItem = async (
  orderId: string,
  menuItemId: string,
  quantity: number,
  notes?: string
): Promise<OrderItem> => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .insert({ 
        order_id: orderId,
        menu_item_id: menuItemId,
        quantity,
        notes
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      orderId: data.order_id,
      menuItemId: data.menu_item_id,
      quantity: data.quantity,
      notes: data.notes,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error adding order item:', error);
    throw error;
  }
};

export const updateOrderItem = async (
  id: string,
  quantity: number,
  notes?: string
): Promise<OrderItem> => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .update({ 
        quantity,
        notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      orderId: data.order_id,
      menuItemId: data.menu_item_id,
      quantity: data.quantity,
      notes: data.notes,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('Error updating order item:', error);
    throw error;
  }
};

export const deleteOrderItem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting order item:', error);
    throw error;
  }
};
