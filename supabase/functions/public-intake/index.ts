import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const allowedOrigins = new Set([
  "https://elainesjewellerybox.co.za",
  "https://www.elainesjewellerybox.co.za",
  "https://sabruwer-hue.github.io"
]);
const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://elainesjewellerybox.co.za",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin"
});
const json = (body: unknown, status = 200, origin = "") =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);

  const keyHeader = req.headers.get("apikey") ?? "";
  let publishableKeys: Record<string, string> = {};
  try { publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}"); } catch { /* legacy fallback */ }
  const acceptedKeys = Object.values(publishableKeys);
  const legacyAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (![...acceptedKeys, legacyAnon].filter(Boolean).includes(keyHeader))
    return json({ error: "A valid public application key is required." }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  let secretKey = "";
  try { secretKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? ""; } catch { /* legacy fallback */ }
  secretKey ||= Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !secretKey) return json({ error: "Service is not configured." }, 503, origin);
  const admin = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function notifyAdmin(eventType: string, title: string, message: string, reference?: string) {
  try {
    const { error } = await admin.from("admin_notifications").insert({
      event_type: eventType, title, message, reference: reference ?? null
    });
    if (error) { console.error("Admin notification could not be saved:", error.message); return; }
    const publicKey = Deno.env.get("EBJ_VAPID_PUBLIC_KEY") ?? "";
    const privateKey = Deno.env.get("EBJ_VAPID_PRIVATE_KEY") ?? "";
    if (!publicKey || !privateKey) return;
    webpush.setVapidDetails("https://elainesjewellerybox.co.za", publicKey, privateKey);
    const { data: subscriptions, error: subscriptionError } = await admin.from("admin_push_subscriptions").select("id,user_id,endpoint,subscription");
    if (subscriptionError) { console.error("Could not load admin push subscriptions:", subscriptionError.message); return; }
    const userIds = [...new Set((subscriptions ?? []).map((row: any) => row.user_id))];
    const { data: preferences } = await admin.from("admin_notification_preferences").select("user_id,enabled_events").in("user_id", userIds);
    const preferenceByUser = new Map((preferences ?? []).map((p: any) => [p.user_id, p.enabled_events as string[]]));
    const payload = JSON.stringify({ title, body: message, url: "/admin.html", tag: eventType });
    await Promise.all((subscriptions ?? []).filter((row: any) => {
      const enabled = preferenceByUser.get(row.user_id);
      return !enabled || enabled.includes(eventType);
    }).map(async (row: any) => {
      try { await webpush.sendNotification(row.subscription as any, payload); }
      catch (pushError) {
        const status = (pushError as {statusCode?:number}).statusCode;
        if (status === 404 || status === 410) await admin.from("admin_push_subscriptions").delete().eq("id", row.id);
        else console.error("Admin push delivery failed:", pushError);
      }
    }));
  } catch (error) { console.error("Admin notification failed:", error); }
}


  if (req.method === "GET") {
    const [reviews, announcements, products] = await Promise.all([
      admin.from("customer_reviews").select("id,display_name,rating,title,review_text,created_at").eq("status","published").order("created_at",{ascending:false}).limit(12),
      admin.from("business_announcements").select("id,title,body,published_at").eq("is_published",true).not("published_at","is",null).lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}).limit(6),
      admin.from("products").select("id,name,description,slug,product_variants(id,variant_name,price_minor,stock_on_hand)").eq("is_published",true).order("created_at",{ascending:false}).limit(60)
    ]);
    if (reviews.error || announcements.error || products.error)
      return json({ error: "Unable to load public shop content." }, 500, origin);
    return json({ reviews: reviews.data, announcements: announcements.data, products: products.data }, 200, origin);
  }
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > 12000) return json({ error: "Submission is too large." }, 413, origin);
  const ip = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const ipHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
  const { data: rateAllowed, error: rateError } = await admin.rpc("consume_public_intake_rate_limit", {
    p_ip_hash: ipHash, p_limit: 8, p_window_seconds: 600
  });
  if (rateError) {
    console.error("Persistent rate-limit check failed:", rateError.message);
    return json({ error: "The submission service is temporarily unavailable. Please try again shortly." }, 503, origin);
  }
  if (rateAllowed !== true) return json({ error: "Too many submissions. Please wait a little and try again." }, 429, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid submission." }, 400, origin); }
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true }, 200, origin);
  const text = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0,max) : "";
  const email = text(body.email,254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400, origin);
  const name = text(body.name,120);
  if (name.length < 2) return json({ error: "Please enter your name." }, 400, origin);


  if (body.type === "subscribe_new_arrivals") {
    const subscriberEmail = text(body.email,254).toLowerCase();
    const subscriberName = text(body.name,100);
    if (body.consent !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subscriberEmail))
      return json({ error: "Please enter a valid email and confirm your consent." }, 400, origin);
    const { data: existing } = await admin.from("customer_marketing_subscriptions").select("id").ilike("email",subscriberEmail).maybeSingle();
    let saved;
    if (existing) {
      saved = await admin.from("customer_marketing_subscriptions").update({first_name:subscriberName||null,is_active:true,consent_at:new Date().toISOString(),unsubscribed_at:null,unsubscribe_token:crypto.randomUUID(),updated_at:new Date().toISOString(),source:"storefront"}).eq("id",existing.id);
    } else {
      saved = await admin.from("customer_marketing_subscriptions").insert({email:subscriberEmail,first_name:subscriberName||null,source:"storefront"});
    }
    if (saved.error) return json({error:"We couldn't save your subscription. Please try again."},500,origin);
    return json({ok:true,message:"You're on Elaine's new-arrivals list. Thank you for joining us."},201,origin);
  }
  if (body.type === "unsubscribe_new_arrivals") {
    const token = text(body.token,80);
    if (!/^[0-9a-f-]{36}$/i.test(token)) return json({error:"This unsubscribe link is invalid."},400,origin);
    const {data,error} = await admin.from("customer_marketing_subscriptions").update({is_active:false,unsubscribed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("unsubscribe_token",token).eq("is_active",true).select("id").maybeSingle();
    if (error) return json({error:"We couldn't update your email preferences."},500,origin);
    return json({ok:true,message:data?"You have been unsubscribed from new-arrival emails.":"This email subscription is already inactive."},200,origin);
  }
  if (body.type === "publish_new_stock") {
    const authHeader = req.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!accessToken) return json({error:"Sign in as an authorised EBJ administrator first."},401,origin);
    const {data:{user},error:userError} = await admin.auth.getUser(accessToken);
    if (userError || !user) return json({error:"Your admin session has expired. Please sign in again."},401,origin);
    const {data:staff} = await admin.from("staff_members").select("role,is_active").eq("user_id",user.id).maybeSingle();
    if (!staff?.is_active || !["owner","admin"].includes(staff.role)) return json({error:"Only active EBJ owner/admin accounts can send customer announcements."},403,origin);
    const productId = text(body.product_id,80);
    const {data:product,error:productError} = await admin.from("products").select("id,name,description,slug,is_published,product_variants(variant_name,stock_on_hand,price_minor,is_active)").eq("id",productId).maybeSingle();
    if (productError || !product || !product.is_published) return json({error:"Publish the product before sending its new-arrival announcement."},400,origin);
    const variants = (product.product_variants||[]).filter((v:any)=>v.is_active && v.stock_on_hand>0);
    if (!variants.length) return json({error:"This product has no active stock available to announce."},400,origin);
    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const fromEmail = Deno.env.get("EBJ_FROM_EMAIL") || Deno.env.get("ELB_FROM_EMAIL") || "";
    if (!resendKey || !fromEmail) return json({error:"Customer email delivery is not configured yet. Add RESEND_API_KEY and EBJ_FROM_EMAIL in Supabase Function Secrets, with a verified sending domain."},503,origin);
    const {data:subscribers,error:subscriberError} = await admin.from("customer_marketing_subscriptions").select("id,email,first_name,unsubscribe_token").eq("is_active",true);
    if (subscriberError) return json({error:"Unable to load the opted-in customer list."},500,origin);
    if (!subscribers?.length) return json({error:"No customers have opted in yet. Invite customers to join the new-arrivals list first."},400,origin);
    const safe = (v:string)=>v.replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
    const shopUrl = "https://elainesjewellerybox.co.za/#jewellery";
    const description = safe((product.description||"A new piece has just arrived in Elaine's Jewellery Box.").slice(0,500));
    const results = await Promise.all(subscribers.map(async (subscriber:any)=>{
      const unsubscribeUrl = "https://elainesjewellerybox.co.za/?unsubscribe="+subscriber.unsubscribe_token;
      const greeting = subscriber.first_name ? "Hello "+safe(subscriber.first_name)+"," : "Hello,";
      const html = '<div style="font-family:Arial,sans-serif;color:#17130a;max-width:600px;margin:auto;padding:28px;background:#f8f3e7"><div style="background:#090909;color:#d8b85f;padding:24px;text-align:center;font-size:26px;letter-spacing:4px">EBJ</div><p>'+greeting+'</p><h1 style="font-weight:400">Something lovely has arrived.</h1><h2>'+safe(product.name)+'</h2><p>'+description+'</p><p>Freshly added to Elaine’s Jewellery Box. Take a look before it finds its new home.</p><p><a href="'+shopUrl+'" style="display:inline-block;background:#090909;color:#e5c66f;padding:14px 22px;text-decoration:none">Explore new arrivals</a></p><hr><p style="font-size:12px;color:#6b6250">You received this because you asked to hear about new arrivals from Elaine’s Jewellery Box. <a href="'+unsubscribeUrl+'">Unsubscribe</a>.</p></div>';
      try {
        const response = await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify({from:fromEmail,to:[subscriber.email],subject:"New arrival at Elaine’s Jewellery Box: "+product.name,html})});
        if(!response.ok){console.error("Resend rejected recipient",subscriber.id,await response.text());return false;}
        return true;
      } catch(error){console.error("Resend delivery failed",subscriber.id,error);return false;}
    }));
    const sent = results.filter(Boolean).length, failed = results.length-sent;
    await admin.from("customer_new_arrival_campaigns").insert({product_id:product.id,product_name:product.name,recipient_count:subscribers.length,sent_count:sent,failed_count:failed,sent_by:user.id});
    await notifyAdmin("new_stock_campaign","New-stock announcement sent","Elaine sent a new-arrival announcement for "+product.name+". "+sent+" delivered; "+failed+" failed.",product.id);
    return json({ok:true,recipients:subscribers.length,sent,failed},200,origin);
  }
  if (body.type === "studio_enquiry") {
    const item = text(body.item,500), vision = text(body.vision,5000), phone = text(body.phone,40);
    if (item.length < 2 || vision.length < 5) return json({ error: "Please describe the item and your idea." }, 400, origin);
    const { data, error } = await admin.from("studio_enquiries").insert({
      customer_name:name, customer_email:email, customer_phone:phone || null,
      item_description:item, customer_vision:vision
    }).select("reference").single();
    if (error) return json({ error: "We couldn't save your enquiry. Please try again later." }, 500, origin);
    await notifyAdmin("studio_enquiry", "New studio enquiry", name + " sent a new design or transformation enquiry.", data.reference);
    return json({ ok:true, reference:data.reference }, 201, origin);
  }
  if (body.type === "customer_case") {
    const category = text(body.category,20), subject = text(body.subject,180), message = text(body.message,5000);
    if (!["complaint","suggestion","message"].includes(category) || subject.length < 2 || message.length < 5)
      return json({ error: "Please complete all required fields." }, 400, origin);
    const { data, error } = await admin.from("customer_cases").insert({
      customer_name:name, customer_email:email, category, subject, message
    }).select("reference").single();
    if (error) return json({ error: "We couldn't save your message. Please try again later." }, 500, origin);
    await notifyAdmin("customer_case", "New customer message", name + " sent a " + category + ": " + subject, data.reference);
    return json({ ok:true, reference:data.reference }, 201, origin);
  }
  if (body.type === "review") {
    const rating = Number(body.rating), reviewText = text(body.review_text,3000), title = text(body.title,160);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 5)
      return json({ error: "Please choose a star rating and write a short review." }, 400, origin);
    const { error } = await admin.from("customer_reviews").insert({
      display_name:name, email, rating, title:title || null, review_text:reviewText
    });
    if (error) return json({ error: "We couldn't submit your review. Please try again later." }, 500, origin);
    await notifyAdmin("review", "New customer review", name + " submitted a " + rating + "-star review for approval.");
    return json({ ok:true, message:"Thank you. Your review has been sent to Elaine for approval." }, 201, origin);
  }
  return json({ error: "Unknown submission type." }, 400, origin);
});