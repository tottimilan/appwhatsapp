import { supabase } from './supabase';
import { normalizePhoneNumber } from '../utils/phoneUtils';

// Obtener todos los contactos
export const getContacts = async () => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo contactos:', error);
    return [];
  }
};

// Obtener un contacto por número
export const getContactByNumber = async (phoneNumber) => {
  try {
    const normalized = normalizePhoneNumber(phoneNumber);
    
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone_number', normalized)
      .maybeSingle(); // Cambiado de .single() a .maybeSingle()
    
    if (error) {
      console.error('Error obteniendo contacto:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error en getContactByNumber:', error);
    return null;
  }
};

// Crear o actualizar un contacto
export const upsertContact = async (phoneNumber, name, profilePictureUrl = null) => {
  try {
    const normalized = normalizePhoneNumber(phoneNumber);
    
    const contactData = {
      phone_number: normalized,
      name: name.trim(),
      profile_picture_url: profilePictureUrl,
      updated_at: new Date().toISOString()
    };
    
    // Primero intentamos actualizar
    const { data: updateData, error: updateError } = await supabase
      .from('contacts')
      .update({
        name: contactData.name,
        profile_picture_url: contactData.profile_picture_url,
        updated_at: contactData.updated_at
      })
      .eq('phone_number', normalized)
      .select();
    
    if (updateError || !updateData || updateData.length === 0) {
      // Si no existe el registro, intentamos insertar
      const { data: insertData, error: insertError } = await supabase
        .from('contacts')
        .insert([{
          ...contactData,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (insertError) {
        throw insertError;
      }
      return { success: true, data: insertData };
    }
    
    return { success: true, data: updateData };
  } catch (error) {
    console.error('Error guardando contacto:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar un contacto
export const deleteContact = async (phoneNumber) => {
  try {
    const normalized = normalizePhoneNumber(phoneNumber);
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('phone_number', normalized);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error eliminando contacto:', error);
    return { success: false, error: error.message };
  }
};

// Obtener mapa de contactos (para búsquedas rápidas)
export const getContactsMap = async () => {
  try {
    const contacts = await getContacts();
    const contactsMap = new Map();
    
    contacts.forEach(contact => {
      contactsMap.set(contact.phone_number, contact);
    });
    
    return contactsMap;
  } catch (error) {
    console.error('Error creando mapa de contactos:', error);
    return new Map();
  }
};