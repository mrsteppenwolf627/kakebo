import { NextRequest, NextResponse } from "next/server";
import { MARKETING_CAMPAIGNS, sendMarketingCampaign, type MarketingCampaignKey } from "@/lib/marketing-mail/campaigns";

const CYCLE_WEEKS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CAMPAIGNS_BY_WEEK: MarketingCampaignKey[] = [
  "usage_reminder",
  "practical_tip",
  "usage_reminder",
  "monthly_summary",
  "practical_tip",
  "usage_reminder",
  "product_news",
  "monthly_summary",
];

function getScheduledCampaign(now: Date) {
  const start = new Date(`${process.env.MARKETING_CYCLE_START_DATE || "2026-11-02"}T08:00:00.000Z`);
  const elapsedWeeks = Math.floor((now.getTime() - start.getTime()) / WEEK_MS);
  if (elapsedWeeks < 0) return null;
  const week = elapsedWeeks % CYCLE_WEEKS;
  const requestedCampaign = CAMPAIGNS_BY_WEEK[week];
  const campaignKey = requestedCampaign === "product_news" && process.env.MARKETING_NEWS_ENABLED !== "true"
    ? "practical_tip"
    : requestedCampaign;
  const cycleNumber = Math.floor(elapsedWeeks / CYCLE_WEEKS) + 1;
  const deliveryKey = `cycle-${cycleNumber}-week-${week + 1}-${campaignKey}`;
  return { campaignKey, deliveryKey, cycleNumber, week: week + 1, definition: MARKETING_CAMPAIGNS[campaignKey] };
}

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.MARKETING_AUTOMATION_ENABLED !== "true") {
    return NextResponse.json({ status: "disabled", message: "Marketing automation is disabled" });
  }

  const scheduled = getScheduledCampaign(new Date());
  if (!scheduled) return NextResponse.json({ status: "waiting", message: "Marketing cycle has not started" });

  const result = await sendMarketingCampaign(
    scheduled.campaignKey,
    Number(process.env.MARKETING_AUTOMATION_BATCH_SIZE) || 100,
    scheduled.deliveryKey,
  );
  return NextResponse.json({ status: "sent", schedule: scheduled, result });
}
