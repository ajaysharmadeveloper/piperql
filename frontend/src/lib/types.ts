export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  target_database: string | null;
  access_mode: 'read_only' | 'crud' | 'full_access';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sql_query: string | null;
  query_result: Record<string, unknown>[] | null;
  chart_config: ChartConfig | null;
  confirmation_status: 'pending' | 'confirmed' | 'cancelled' | null;
  created_at: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar' | 'radial_bar' | 'donut' | 'stacked_bar' | 'composed';
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  title?: string;
}

export interface SSEEvent {
  type: 'token' | 'sql' | 'confirm' | 'result' | 'chart' | 'error' | 'done';
  content?: string;
  data?: Record<string, unknown>;
  confirmation_id?: string;
}
