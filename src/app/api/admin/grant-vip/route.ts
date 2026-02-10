import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const { email, grant } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
        }

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

        // Use admin client to list users
        const adminClient = createAdminClient();
        const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();

        if (usersError) {
            console.error('Error listing users:', usersError);
            return NextResponse.json({ error: 'Error buscando usuario' }, { status: 500 });
        }

        const targetUser = users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!targetUser) {
            return NextResponse.json({ error: `Usuario no encontrado: ${email}` }, { status: 404 });
        }

        // Update profile using admin client
        const { error: updateError } = await adminClient
            .from('profiles')
            .update({ manual_override: grant })
            .eq('id', targetUser.id);

        if (updateError) {
            console.error('Error updating profile:', updateError);
            return NextResponse.json({ error: 'Error actualizando perfil' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: grant ? `Acceso VIP otorgado a ${email}` : `Acceso VIP revocado de ${email}`,
        });
    } catch (error: any) {
        console.error('Grant VIP error:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
