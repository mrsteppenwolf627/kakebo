/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAllAuthUsers } from '@/lib/admin/auth-users';

export async function GET() {
    try {
        const supabase = await createClient();

        // Verify caller is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
        if (!adminEmails.includes(user.email || '')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Use admin client to get VIP users
        const adminClient = createAdminClient();

        const { data: profiles, error: profilesError } = await adminClient
            .from('profiles')
            .select('id, tier, manual_override, created_at')
            .eq('manual_override', true)
            .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Get emails from auth.users (paginated: listUsers() alone only returns the first 50 users).
        const authUsers = await listAllAuthUsers(adminClient);
        const emailById = new Map(authUsers.map((u) => [u.id, u.email]));

        const usersWithEmails = profiles?.map((profile) => {
            return {
                ...profile,
                email: emailById.get(profile.id) || 'Unknown',
            };
        }) || [];

        return NextResponse.json({ users: usersWithEmails });
    } catch (error: any) {
        console.error('List VIP users error:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
