export function renderMarketingEmail(input: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const preheader = input.preheader ? `<span style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent">${input.preheader}</span>` : "";
  const cta = input.ctaUrl && input.ctaLabel
    ? `<p style="margin:28px 0 0"><a href="${input.ctaUrl}" style="display:inline-block;background:#cf8c6c;color:#1c1917;text-decoration:none;padding:13px 22px;border-radius:6px;font-size:14px;font-weight:600">${input.ctaLabel}</a></p>`
    : "";
  return `<!doctype html><html lang="es"><head><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;background:#f5f1e8;color:#1c1917;font-family:Arial,Helvetica,sans-serif"><div style="display:none!important;max-height:0;overflow:hidden">${preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f1e8"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:0 4px 18px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="38" height="38" align="center" valign="middle" style="background:#1c1917;color:#fafaf9;font-family:Georgia,serif;font-size:21px">K</td><td style="padding-left:10px;color:#1c1917;font-family:Georgia,serif;font-size:22px;letter-spacing:-.02em">Kakebo</td></tr></table></td></tr><tr><td style="background:#fff;border:1px solid #e7e5e4;border-radius:10px;padding:36px 34px"><p style="margin:0 0 12px;color:#cf8c6c;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700">Método Kakebo</p><h1 style="margin:0;color:#1c1917;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;font-weight:400;letter-spacing:-.02em">${input.title}</h1><div style="margin-top:22px;color:#44403c;font-size:16px;line-height:1.65">${input.bodyHtml}</div>${cta}</td></tr><tr><td style="padding:22px 4px 0;color:#78716c;font-size:12px;line-height:1.55;text-align:center">Recibes este email porque aceptaste recibir comunicaciones de Kakebo.<br><a href="${input.unsubscribeUrl}" style="color:#57534e;text-decoration:underline">Darse de baja de estos emails</a></td></tr></table></td></tr></table></body></html>`;
}
