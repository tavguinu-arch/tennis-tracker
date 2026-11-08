// ==========================================
// FICHEIRO: lib/supabaseClient.js
// DESCRIÇÃO: Inicializa a ligação ao Supabase usando as chaves de ambiente
// ==========================================

import { createClient } from '@supabase/supabase-js'

// Lê o URL e a Chave Pública que configuramos na aplicação
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cria o cliente que nos vai permitir ler e escrever dados no Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
