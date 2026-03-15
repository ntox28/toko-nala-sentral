import { supabase } from './supabase';
import { Product, Size, Expense, Transaction, TransactionDetail, User, UserRole, View, PaymentMethod } from './types';

// --- Sizes ---
export const getSizes = async (): Promise<Size[]> => {
  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
};

export const saveSize = async (size: Partial<Size>): Promise<Size> => {
  if (size.id) {
    const { data, error } = await supabase
      .from('sizes')
      .update({ name: size.name })
      .eq('id', size.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('sizes')
      .insert([{ name: size.name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const deleteSize = async (id: string): Promise<void> => {
  const { error } = await supabase.from('sizes').delete().eq('id', id);
  if (error) throw error;
};

// --- Products ---
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
};

export const saveProduct = async (product: Partial<Product>): Promise<Product> => {
  const productData = {
    name: product.name,
    barcode: product.barcode,
    size: product.size,
    price: product.price,
    cost_price: product.cost_price,
    stock: product.stock,
    low_stock_threshold: product.low_stock_threshold,
    is_active: product.is_active,
    image_url: product.image_url,
    updated_at: new Date().toISOString(),
  };

  if (product.id) {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', product.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...productData, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

// --- Expenses ---
export const getExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const saveExpense = async (expense: Partial<Expense>): Promise<Expense> => {
  const expenseData = {
    date: expense.date,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
  };

  if (expense.id) {
    const { data, error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', expense.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expenseData, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
};

// --- Transactions ---
export const getTransactions = async (): Promise<Transaction[]> => {
  // Fetch transactions and their details
  // We avoid the join with profiles here because it sometimes causes relationship errors in Supabase
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      details:transaction_details (*)
    `)
    .order('date', { ascending: false });

  if (error) throw error;

  // Fetch profiles to map cashier names manually
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, name');
  
  const profileMap = (profilesData || []).reduce((acc: Record<string, string>, p: any) => {
    acc[p.id] = p.name;
    return acc;
  }, {});

  return (data || []).map((t: any) => ({
    ...t,
    cashier_name: profileMap[t.cashier_id] || 'Unknown',
    details: t.details || [],
  }));
};

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> => {
  // 1. Insert transaction
  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .insert([{
      transaction_code: transaction.transaction_code,
      date: transaction.date,
      cashier_id: transaction.cashier_id,
      total: transaction.total,
      discount_type: transaction.discount_type,
      discount_value: transaction.discount_value,
      discount_amount: transaction.discount_amount,
      payment_method: transaction.payment_method,
      amount_received: transaction.amount_received,
      change: transaction.change
    }])
    .select()
    .single();

  if (txError) {
    console.error('Error inserting transaction:', txError);
    throw txError;
  }

  // 2. Insert details
  const detailsToInsert = transaction.details.map(d => ({
    transaction_id: txData.id,
    product_id: d.product_id,
    quantity: d.quantity,
    unit_price: d.unit_price,
    cost_price: d.cost_price,
    subtotal: d.subtotal
  }));

  const { data: detailsData, error: detailsError } = await supabase
    .from('transaction_details')
    .insert(detailsToInsert)
    .select();

  if (detailsError) {
    console.error('Error inserting transaction details:', detailsError);
    // We don't throw here yet, we want to try to clean up or at least log it
    // But since transactions are already in, it's better to throw so the UI knows
    throw detailsError;
  }

  // 3. Update product stocks
  try {
    for (const detail of transaction.details) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        row_id: detail.product_id,
        amount: detail.quantity
      });
      
      if (stockError) {
          const { data: pData } = await supabase.from('products').select('stock').eq('id', detail.product_id).single();
          if (pData) {
              await supabase.from('products').update({ stock: Math.max(0, pData.stock - detail.quantity) }).eq('id', detail.product_id);
          }
      }
    }
  } catch (stockErr) {
    console.error('Error updating stock:', stockErr);
    // Stock update failure shouldn't necessarily fail the whole transaction UI-wise if data is saved
  }

  return { ...txData, details: detailsData };
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

// --- Profiles / Users ---
export const getProfiles = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
};

export const saveProfile = async (profile: Partial<User>): Promise<User> => {
  const profileData = {
    name: profile.name,
    role: profile.role,
    allowed_views: profile.allowed_views,
  };

  if (profile.id) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', profile.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // This part is tricky because profiles usually depend on auth.users
    // For now, we assume the user is created via Supabase Auth and we just update the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...profileData, id: profile.id }]) // id must be provided from auth
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// --- App Settings ---
export const getAppSetting = async (key: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching app setting:', error);
    return null;
  }
  return data?.value || null;
};

export const saveAppSetting = async (key: string, value: string): Promise<void> => {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  
  if (error) {
    console.error('Error saving app setting:', error);
    throw error;
  }
};
