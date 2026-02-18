"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Shield, Check, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface VIPUser {
    id: string;
    email: string;
    tier: string;
    manual_override: boolean;
    created_at: string;
}

export default function AdminClient() {
    const t = useTranslations("Admin");
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [vipUsers, setVipUsers] = useState<VIPUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        async function checkAdmin() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            // Check admin emails from env or hardcoded list
            const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
            const userIsAdmin = adminEmails.includes(user.email || '');
            setIsAdmin(userIsAdmin);
            setLoading(false);

            if (userIsAdmin) {
                loadVIPUsers();
            }
        }
        checkAdmin();
    }, []);

    async function loadVIPUsers() {
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/admin/list-vip-users');
            const { users } = await res.json();
            setVipUsers(users || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingUsers(false);
        }
    }

    async function grantVIP() {
        if (!email.trim()) return;

        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/grant-vip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), grant: true }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t("grantVip.error"));
            }

            setMessage({ type: 'success', text: t("grantVip.success", { email }) });
            setEmail('');
            loadVIPUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSubmitting(false);
        }
    }

    async function revokeVIP(userId: string, userEmail: string) {
        if (!confirm(t("vipUsers.revokeConfirm", { email: userEmail }))) return;

        try {
            const res = await fetch('/api/admin/grant-vip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, grant: false }),
            });

            if (!res.ok) {
                throw new Error(t("vipUsers.revokeError"));
            }

            setMessage({ type: 'success', text: t("vipUsers.revokeSuccess", { email: userEmail }) });
            loadVIPUsers();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md text-center space-y-4">
                    <Shield className="w-16 h-16 mx-auto text-destructive" />
                    <h1 className="text-2xl font-serif font-medium">{t("accessDenied.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("accessDenied.desc")}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen px-4 sm:px-8 py-8 sm:py-12">
            <div className="mx-auto max-w-4xl space-y-8">
                <header className="border-b border-border pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-serif font-medium text-foreground">
                            {t("title")}
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t("subtitle")}
                    </p>
                </header>

                {/* Grant VIP Access */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                    <h2 className="text-xl font-serif font-medium">{t("grantVip.title")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("grantVip.desc")}
                    </p>

                    <div className="flex gap-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t("grantVip.placeholder")}
                            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            disabled={submitting}
                        />
                        <button
                            onClick={grantVIP}
                            disabled={submitting || !email.trim()}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-900 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{t("grantVip.granting")}</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>{t("grantVip.button")}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {message && (
                        <div
                            className={`p-3 rounded-md text-sm ${message.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}
                </div>

                {/* VIP Users List */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-serif font-medium">{t("vipUsers.title")}</h2>
                        <button
                            onClick={loadVIPUsers}
                            disabled={loadingUsers}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {loadingUsers ? t("vipUsers.refreshing") : t("vipUsers.refresh")}
                        </button>
                    </div>

                    {loadingUsers ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : vipUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            {t("vipUsers.empty")}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {vipUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/50"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{user.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t("vipUsers.tier", { tier: user.tier })} · {t("vipUsers.created", { date: new Date(user.created_at).toLocaleDateString() })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => revokeVIP(user.id, user.email)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                        <span>{t("vipUsers.revoke")}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
