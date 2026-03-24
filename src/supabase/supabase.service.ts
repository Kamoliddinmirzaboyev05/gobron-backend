import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: ReturnType<typeof createClient>;

  constructor(private config: ConfigService) {
    this.client = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'), // service role — full access
    );
  }

  get supabase(): ReturnType<typeof createClient> {
    return this.client;
  }

  // Realtime subscription — bookings o'zgarishini kuzatish
  subscribeToBookings(ownerId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`bookings:owner:${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `field_id=in.(${ownerId})`,
        },
        callback,
      )
      .subscribe();
  }
}
