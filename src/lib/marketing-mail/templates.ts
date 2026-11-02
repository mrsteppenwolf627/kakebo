export function renderMarketingEmail(input: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  unsubscribeUrl: string;
}): string {
  const preheader = input.preheader ? `<span style="display:none;max-height:0;overflow:hidden">${input.preheader}</span>` : "";
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f7f5f0;color:#292524;font-family:Arial,sans-serif"><div style="display:none">${preheader}</div><main style="max-width:600px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:32px"><p style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#78716c">Kakebo</p><h1 style="font-family:Georgia,serif;font-weight:500">${input.title}</h1><div style="font-size:16px;line-height:1.6">${input.bodyHtml}</div></div><p style="font-size:12px;color:#78716c;text-align:center;margin:20px 0"><a href="${input.unsubscribeUrl}" style="color:inherit">Darse de baja de estos emails</a></p></main></body></html>`;
}
