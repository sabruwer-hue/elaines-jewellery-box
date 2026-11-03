const adminSupabase = window.supabase.createClient("https://jakcqdeyvbbgdwctomdu.supabase.co", "sb_publishable_-fWvxeQlGA1ocIVgxWguaA_5MUUo67-");
const loginPanel=document.getElementById("loginPanel"),adminShell=document.getElementById("adminShell"),loginStatus=document.getElementById("loginStatus"),logoutButton=document.getElementById("logoutButton"),authStatus=document.getElementById("authStatus");
const $=(id)=>document.getElementById(id);
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function card(title,detail){const el=node("article",undefined,"live-card");el.append(node("h3",title),node("p",detail));return el;}
function money(minor){return "R"+(Number(minor||0)/100).toFixed(2);}
function showMessage(target,message){const el=$(target);if(el)el.textContent=message;}
async function verifyStaff(){const {data:{user},error}=await adminSupabase.auth.getUser();if(error||!user)return false;const {data,error:staffError}=await adminSupabase.from("staff_members").select("role,is_active").eq("user_id",user.id).maybeSingle();if(staffError||!data||!data.is_active||!["owner","admin"].includes(data.role))return false;authStatus.textContent="Signed in · "+data.role;loginPanel.hidden=true;adminShell.hidden=false;logoutButton.hidden=false;await loadDashboard();return true;}
$("ownerLogin")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button");button.disabled=true;loginStatus.textContent="Checking your account…";const values=Object.fromEntries(new FormData(form));const {error}=await adminSupabase.auth.signInWithPassword({email:values.email,password:values.password});if(error){loginStatus.textContent="Sign-in failed. Check your email and password, then try again.";button.disabled=false;return;}const ok=await verifyStaff();if(!ok){await adminSupabase.auth.signOut();loginStatus.textContent="This account is not enabled as an active owner/admin. No access was granted.";}button.disabled=false;});
$("forgotPasswordButton")?.addEventListener("click",async()=>{const email=$("ownerLogin")?.elements.email.value.trim();const button=$("forgotPasswordButton");if(!email){showMessage("passwordResetStatus","Enter your admin email address above first.");$("ownerLogin")?.elements.email.focus();return;}button.disabled=true;showMessage("passwordResetStatus","Sending a secure recovery link…");const redirectTo=new URL("update-password.html",window.location.href).toString();const {error}=await adminSupabase.auth.resetPasswordForEmail(email,{redirectTo});if(error){showMessage("passwordResetStatus","Could not send the recovery email. Please wait a moment and try again.");}else{showMessage("passwordResetStatus","If this email belongs to an account, a recovery link has been sent. Check your inbox and spam folder.");}button.disabled=false;});
logoutButton?.addEventListener("click",async()=>{await adminSupabase.auth.signOut();adminShell.hidden=true;loginPanel.hidden=false;logoutButton.hidden=true;authStatus.textContent="Signed out";});
async function loadDashboard(){await Promise.all([loadStudio(),loadCare(),loadReviews(),loadProducts(),loadOrders(),loadAnnouncements()]);const stats=await Promise.all([adminSupabase.from("orders").select("id",{count:"exact",head:true}).not("order_status","in","(completed,cancelled)"),adminSupabase.from("customer_cases").select("id",{count:"exact",head:true}).eq("status","new"),adminSupabase.from("studio_enquiries").select("id",{count:"exact",head:true}).in("status",["new","under_review"]),adminSupabase.from("products").select("id",{count:"exact",head:true}).eq("is_published",true)]);document.querySelectorAll(".stats article strong").forEach((el,i)=>{el.textContent=stats[i].count??"—";});}
async function loadStudio(){const box=$("studioQueue");if(!box)return;const {data,error}=await adminSupabase.from("studio_enquiries").select("*").order("created_at",{ascending:false}).limit(100);box.innerHTML="";if(error){box.append(node("p","Unable to load enquiries. Check staff permissions."));return;}if(!data.length){box.append(node("p","No studio enquiries yet.","empty"));return;}data.forEach(item=>{const el=card(item.reference+" · "+item.customer_name,item.customer_email+" · "+item.item_description+"\n"+item.customer_vision);const meta=node("small",new Date(item.created_at).toLocaleString("en-ZA")+" · "+item.status);const select=node("select");["new","under_review","accepted","declined","quoted","approved","in_progress","completed","cancelled"].forEach(v=>{const o=node("option",v);o.value=v;o.selected=v===item.status;select.append(o);});select.addEventListener("change",async()=>{const {error}=await adminSupabase.from("studio_enquiries").update({status:select.value,updated_at:new Date().toISOString()}).eq("id",item.id);if(error){meta.textContent="Update failed — "+error.message;select.value=item.status;}else{item.status=select.value;meta.textContent="Updated · "+item.status;}});el.append(meta,select);box.append(el);});}
async function loadCare(){const box=$("careQueue");if(!box)return;const {data,error}=await adminSupabase.from("customer_cases").select("*").order("created_at",{ascending:false}).limit(100);box.innerHTML="";if(error){box.append(node("p","Unable to load customer cases."));return;}if(!data.length){box.append(node("p","No customer-care messages yet.","empty"));return;}data.forEach(item=>{const el=card(item.reference+" · "+item.category+" · "+item.customer_name,item.subject+"\n"+item.message+"\nReply address: "+item.customer_email);const meta=node("small",new Date(item.created_at).toLocaleString("en-ZA")+" · "+item.status);const select=node("select");["new","acknowledged","in_progress","awaiting_customer","resolved","closed"].forEach(v=>{const o=node("option",v);o.value=v;o.selected=v===item.status;select.append(o);});select.addEventListener("change",async()=>{const {error}=await adminSupabase.from("customer_cases").update({status:select.value,updated_at:new Date().toISOString()}).eq("id",item.id);if(error){meta.textContent="Update failed";select.value=item.status;}else{item.status=select.value;meta.textContent="Updated · "+item.status;}});el.append(meta,select);box.append(el);});}
async function loadReviews(){const box=$("reviewQueue");if(!box)return;const {data,error}=await adminSupabase.from("customer_reviews").select("*").order("created_at",{ascending:false}).limit(100);box.innerHTML="";if(error){box.append(node("p","Unable to load reviews."));return;}if(!data.length){box.append(node("p","No customer reviews yet.","empty"));return;}data.forEach(item=>{const el=card(item.display_name+" · "+("★".repeat(item.rating))+" · "+item.status,(item.title||"Customer review")+"\n"+item.review_text+"\n"+(item.email||""));const meta=node("small",new Date(item.created_at).toLocaleString("en-ZA"));el.append(meta);if(item.status==="pending"){const approve=node("button","Approve","primary"),reject=node("button","Reject","outline");approve.addEventListener("click",()=>moderateReview(item,"published"));reject.addEventListener("click",()=>moderateReview(item,"rejected"));el.append(approve,reject);}box.append(el);});}
async function moderateReview(item,status){const {data:{user}}=await adminSupabase.auth.getUser();const {error}=await adminSupabase.from("customer_reviews").update({status,moderated_at:new Date().toISOString(),moderated_by:user.id}).eq("id",item.id);if(error)alert("Review update failed: "+error.message);else loadReviews();}
async function notifyNewArrival(product,button,status){
 if(!confirm("Send a new-arrival email about “"+product.name+"” to customers who opted in?"))return;
 button.disabled=true;status.textContent="Preparing customer email campaign…";
 try{const {data:{session}}=await adminSupabase.auth.getSession();if(!session)throw new Error("Please sign in again.");
 const response=await fetch("https://jakcqdeyvbbgdwctomdu.supabase.co/functions/v1/public-intake",{method:"POST",headers:{"Content-Type":"application/json","apikey":"sb_publishable_-fWvxeQlGA1ocIVgxWguaA_5MUUo67-","Authorization":"Bearer "+session.access_token},body:JSON.stringify({type:"publish_new_stock",product_id:product.id})});
 const result=await response.json();if(!response.ok)throw new Error(result.error||"Campaign could not be sent.");
 status.textContent="Campaign complete · "+result.sent+" sent · "+result.failed+" failed · "+result.recipients+" opted-in customers.";
 }catch(error){status.textContent=error.message||"Campaign failed.";}finally{button.disabled=false;}
}
async function loadProducts(){const box=$("productQueue"),select=$("productCategory");if(!box)return;const [{data:products,error},{data:categories},{count:subscriberCount},{data:campaigns}]=await Promise.all([adminSupabase.from("products").select("*").order("created_at",{ascending:false}),adminSupabase.from("categories").select("id,name").eq("is_active",true).order("sort_order"),adminSupabase.from("customer_marketing_subscriptions").select("id",{count:"exact",head:true}).eq("is_active",true),adminSupabase.from("customer_new_arrival_campaigns").select("product_name,recipient_count,sent_count,failed_count,created_at").order("created_at",{ascending:false}).limit(5)]);const countBox=$("arrivalSubscriberCount");if(countBox)countBox.textContent=(subscriberCount??"—")+" active customers opted in to new-arrival emails.";const history=$("arrivalCampaignHistory");if(history){history.innerHTML="";if(!campaigns?.length)history.append(node("p","No new-arrival campaigns sent yet.","empty"));else campaigns.forEach(c=>history.append(node("p",c.product_name+" · "+c.sent_count+"/"+c.recipient_count+" sent · "+new Date(c.created_at).toLocaleDateString("en-ZA"),"campaign-history-row")));}box.innerHTML="";if(error){box.append(node("p","Unable to load products."));return;}if(select){select.innerHTML="<option value=\"\">No category</option>";(categories||[]).forEach(cat=>{const o=node("option",cat.name);o.value=cat.id;select.append(o);});}if(!products?.length){box.append(node("p","No products added yet.","empty"));return;}products.forEach(p=>{const el=card(p.name,p.description||"No description · "+(p.is_published?"Published":"Draft"));el.append(node("small",p.is_published?"Published":"Draft"));if(p.is_published){const status=node("small","Send a new-arrival email to opted-in customers.");const button=node("button","Notify opted-in customers","primary");button.type="button";button.addEventListener("click",()=>notifyNewArrival(p,button,status));el.append(button,status);}box.append(el);});}
$("productForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button");button.disabled=true;showMessage("productStatus","Saving product…");const v=Object.fromEntries(new FormData(form));const {data:product,error}=await adminSupabase.from("products").insert({name:v.name,slug:v.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+Math.random().toString(36).slice(2,6),description:v.description||null,category_id:v.category_id||null,is_published:false}).select("id").single();if(error){showMessage("productStatus","Could not save product: "+error.message);button.disabled=false;return;}const {error:variantError}=await adminSupabase.from("product_variants").insert({product_id:product.id,sku:v.sku,price_minor:Math.round(Number(v.price)*100),stock_on_hand:Number(v.stock),variant_name:"Default"});if(variantError){showMessage("productStatus","Product saved as a draft, but its stock/price variant failed: "+variantError.message);button.disabled=false;await loadProducts();return;}if(v.is_published==="on"){const {error:publishError}=await adminSupabase.from("products").update({is_published:true}).eq("id",product.id);if(publishError){showMessage("productStatus","Product saved as draft; publishing failed: "+publishError.message);button.disabled=false;await loadProducts();return;}}form.reset();showMessage("productStatus","Product saved successfully.");button.disabled=false;await loadProducts();});
async function loadOrders(){const box=$("orderQueue");if(!box)return;const {data,error}=await adminSupabase.from("orders").select("id,order_reference,customer_name,customer_email,total_amount_minor,payment_status,order_status,created_at").order("created_at",{ascending:false}).limit(100);box.innerHTML="";if(error){box.append(node("p","Unable to load orders."));return;}if(!data.length){box.append(node("p","No shop orders yet.","empty"));return;}data.forEach(item=>{const el=card(item.order_reference+" · "+item.customer_name,money(item.total_amount_minor)+" · "+item.payment_status+"\n"+item.customer_email);el.append(node("small",item.order_status+" · "+new Date(item.created_at).toLocaleString("en-ZA")));box.append(el);});}
async function loadAnnouncements(){const box=$("announcementQueue");if(!box)return;const {data,error}=await adminSupabase.from("business_announcements").select("*").order("created_at",{ascending:false}).limit(50);box.innerHTML="";if(error){box.append(node("p","Unable to load announcements."));return;}if(!data.length){box.append(node("p","No announcements yet.","empty"));return;}data.forEach(item=>{const el=card(item.title,item.body);el.append(node("small",item.is_published?"Published":"Draft"));box.append(el);});}
$("announcementForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button");button.disabled=true;showMessage("announcementStatus","Saving…");const v=Object.fromEntries(new FormData(form));const publish=v.is_published==="on";const {data:{user}}=await adminSupabase.auth.getUser();const {error}=await adminSupabase.from("business_announcements").insert({title:v.title,body:v.body,is_published:publish,published_at:publish?new Date().toISOString():null,created_by:user.id});if(error)showMessage("announcementStatus","Save failed: "+error.message);else{form.reset();showMessage("announcementStatus","Announcement saved.");await loadAnnouncements();}button.disabled=false;});
adminSupabase.auth.getSession().then(async({data,error})=>{
 if(error){loginPanel.hidden=false;showMessage("securityNotice","Please sign in to continue. Your saved session could not be checked.");return;}
 if(data.session){
  const ok=await verifyStaff();
  if(!ok){await adminSupabase.auth.signOut();loginPanel.hidden=false;adminShell.hidden=true;loginStatus.textContent="Your saved session is not authorised for this workspace.";}
 }else{
  loginPanel.hidden=false;
  adminShell.hidden=true;
  $("securityNotice").textContent="Private workspace: sign in with your active admin account. Only authorised staff can view customer records.";
 }
});
let adminNotificationChannel = null;
async function loadAdminNotifications(){
 const box=$("notificationList"); if(!box)return;
 const {data,error}=await adminSupabase.from("admin_notifications").select("*").order("created_at",{ascending:false}).limit(40);
 if(error){box.textContent="Notifications could not be loaded.";return;}
 box.innerHTML="";
 if(!data.length)box.append(node("p","No site activity yet.","tiny"));
 data.forEach(item=>{
  const row=node("div",undefined,"notification-item");
  row.append(node("strong",item.title),node("span",item.message),node("small",new Date(item.created_at).toLocaleString("en-ZA")+(item.read_at?" · Read":" · New")));
  if(!item.read_at){row.style.borderLeft="3px solid #c9a44c";row.style.paddingLeft="9px";}
  box.append(row);
 });
 const count=$("notificationCount");if(count)count.textContent=String(data.filter(x=>!x.read_at).length);
}
function startAdminNotificationFeed(){
 if(adminNotificationChannel)return;
 loadAdminNotifications();
 adminNotificationChannel=adminSupabase.channel("ebj-admin-notifications")
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"admin_notifications"},async payload=>{
   loadAdminNotifications();
   const item=payload.new||{};
   if("Notification"in window&&Notification.permission==="granted"&&document.hidden){
    try{const reg=await navigator.serviceWorker.ready;await reg.showNotification(item.title||"EBJ site activity",{body:item.message||"There is new activity in your shop.",icon:"/icons/admin-icon.svg",tag:item.id||"ebj-admin"});}catch{}
   }
  }).subscribe();
}
$("notificationButton")?.addEventListener("click",async()=>{
 const panel=$("notificationPanel");if(!panel)return;
 panel.hidden=!panel.hidden;$("notificationButton").setAttribute("aria-expanded",String(!panel.hidden));
 if(!panel.hidden)await loadAdminNotifications();
});
const EBJ_VAPID_PUBLIC_KEY="BLCw0vzAZ04nQCzcivLEB323Y6ompPSPrjGvBmw7URoJTCFvcORUKErqrQ45JGYnO-kKf1ve7z2cLAgnDeioM1s";
function vapidKeyBytes(value){const pad="=".repeat((4-value.length%4)%4);const raw=atob((value+pad).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
$("enableBrowserAlerts")?.addEventListener("click",async()=>{
 const button=$("enableBrowserAlerts");button.disabled=true;button.textContent="Connecting…";
 try{
  if(!("Notification"in window)||!("serviceWorker"in navigator)||!("PushManager"in window))throw new Error("Push notifications are not supported by this browser. Try installing EBJ Admin in Chrome.");
  const permission=await Notification.requestPermission();
  if(permission!=="granted")throw new Error("Notification permission was not granted. Enable notifications for this site in your browser settings.");
  const {data:{user},error:userError}=await adminSupabase.auth.getUser();if(userError||!user)throw new Error("Please sign in again before enabling alerts.");
  const registration=await navigator.serviceWorker.ready;
  let subscription=await registration.pushManager.getSubscription();
  if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidKeyBytes(EBJ_VAPID_PUBLIC_KEY)});
  const {error}=await adminSupabase.from("admin_push_subscriptions").upsert({user_id:user.id,endpoint:subscription.endpoint,subscription:subscription.toJSON(),user_agent:navigator.userAgent},{onConflict:"endpoint"});
  if(error)throw error;
  button.textContent="Push alerts enabled";button.disabled=false;
 }catch(error){button.textContent="Enable push alerts";button.disabled=false;alert(error.message||"Could not enable push notifications.");}
});
$("markNotificationsRead")?.addEventListener("click",async()=>{
 await adminSupabase.from("admin_notifications").update({read_at:new Date().toISOString()}).is("read_at",null);
 await loadAdminNotifications();
});
const originalVerifyStaff=verifyStaff;
verifyStaff=async function(){const ok=await originalVerifyStaff();if(ok){startAdminNotificationFeed();await loadNotificationPreferences();await loadDailyBriefing();}return ok;};

const EBJ_EVENT_KEYS=["new_order","payment_update","studio_enquiry","customer_case","review","low_stock"];
async function loadNotificationPreferences(){
 const form=$("notificationPreferencesForm");if(!form)return;
 const {data:{user}}=await adminSupabase.auth.getUser();if(!user)return;
 const {data,error}=await adminSupabase.from("admin_notification_preferences").select("*").eq("user_id",user.id).maybeSingle();
 if(error){showMessage("notificationPreferencesStatus","Could not load preferences: "+error.message);return;}
 const enabled=data?.enabled_events||EBJ_EVENT_KEYS;
 EBJ_EVENT_KEYS.forEach(key=>{const input=form.elements.namedItem(key);if(input)input.checked=enabled.includes(key);});
 const digest=form.elements.namedItem("daily_briefing_enabled");if(digest)digest.checked=data?.daily_briefing_enabled??true;
 const time=form.elements.namedItem("briefing_time");if(time)time.value=(data?.briefing_time||"08:00").slice(0,5);
}
$("notificationPreferencesForm")?.addEventListener("submit",async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]');button.disabled=true;showMessage("notificationPreferencesStatus","Saving preferences…");
 const {data:{user}}=await adminSupabase.auth.getUser();if(!user){showMessage("notificationPreferencesStatus","Please sign in again.");button.disabled=false;return;}
 const enabled_events=EBJ_EVENT_KEYS.filter(key=>form.elements.namedItem(key)?.checked);
 const daily=form.elements.namedItem("daily_briefing_enabled")?.checked??true;
 const briefing_time=form.elements.namedItem("briefing_time")?.value||"08:00";
 const {error}=await adminSupabase.from("admin_notification_preferences").upsert({user_id:user.id,enabled_events,daily_briefing_enabled:daily,briefing_time:briefing_time+":00",updated_at:new Date().toISOString()},{onConflict:"user_id"});
 showMessage("notificationPreferencesStatus",error?"Could not save: "+error.message:"Notification preferences saved.");button.disabled=false;
});
async function loadDailyBriefing(){
 const box=$("dailyBriefing");if(!box)return;
 box.innerHTML="";box.append(node("p","Gathering today's business activity…","muted"));
 const since=new Date(Date.now()-24*60*60*1000).toISOString();
 const [orders,enquiries,cases,reviews,stock]=await Promise.all([
  adminSupabase.from("orders").select("id",{count:"exact",head:true}).gte("created_at",since),
  adminSupabase.from("studio_enquiries").select("id",{count:"exact",head:true}).gte("created_at",since),
  adminSupabase.from("customer_cases").select("id",{count:"exact",head:true}).neq("status","resolved"),
  adminSupabase.from("customer_reviews").select("id",{count:"exact",head:true}).eq("status","pending"),
  adminSupabase.from("product_variants").select("id",{count:"exact",head:true}).lte("stock_on_hand",3).eq("is_active",true)
 ]);
 const rows=[["New orders (24h)",orders.count??"—"],["New studio enquiries (24h)",enquiries.count??"—"],["Open customer-care cases",cases.count??"—"],["Reviews awaiting approval",reviews.count??"—"],["Low-stock variants",stock.count??"—"]];
 rows.forEach(([label,value])=>{const row=node("div",undefined,"brief-row");row.append(node("span",label),node("strong",String(value)));box.append(row);});
 const total=(orders.count||0)+(enquiries.count||0)+(cases.count||0)+(reviews.count||0)+(stock.count||0);
 box.append(node("p",total?"Review outstanding customer cases, pending reviews and low-stock items first.":"No outstanding items were found in the tracked queues.","muted"));
 box.append(node("small","Updated "+new Date().toLocaleString("en-ZA")));
}
$("refreshDailyBriefing")?.addEventListener("click",loadDailyBriefing);


/* Geranemo secure OpenAI assistant — read, advise and prepare only. */
let geranemoConversationId=null;
let geranemoSending=false;
function addGeranemoMessage(role,content){
 const chat=$("geranemoChat");if(!chat)return;
 const welcome=chat.querySelector(".geranemo-welcome");if(welcome)welcome.remove();
 const bubble=node("article",undefined,"geranemo-message "+role);
 const who=node("strong",role==="user"?"Elaine":"Geranemo");
 const body=node("div",content,"geranemo-message-body");
 bubble.append(who,body);chat.append(bubble);chat.scrollTop=chat.scrollHeight;
}
async function sendGeranemoMessage(raw){
 const message=String(raw||"").trim();if(!message||geranemoSending)return;
 const input=$("geranemoInput"),button=$("geranemoSend"),status=$("geranemoMessage");
 geranemoSending=true;if(button)button.disabled=true;if(input)input.disabled=true;
 if(status)status.textContent="Geranemo is checking the available business records…";
 addGeranemoMessage("user",message);
 try{
  const {data:{session},error:sessionError}=await adminSupabase.auth.getSession();
  if(sessionError||!session)throw new Error("Your session has expired. Please sign in again.");
  const response=await fetch("https://jakcqdeyvbbgdwctomdu.supabase.co/functions/v1/geranemo-assistant",{
   method:"POST",headers:{"Content-Type":"application/json","apikey":"sb_publishable_-fWvxeQlGA1ocIVgxWguaA_5MUUo67-","Authorization":"Bearer "+session.access_token},
   body:JSON.stringify({message,conversation_id:geranemoConversationId})
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error||"Geranemo could not complete the request.");
  geranemoConversationId=result.conversation_id||geranemoConversationId;
  addGeranemoMessage("assistant",result.answer||"I couldn't produce a response.");
  if(status)status.textContent="Conversation saved securely · Read, advise and prepare mode.";
  if(input)input.value="";
 }catch(error){addGeranemoMessage("assistant","I couldn't complete that request: "+(error.message||"Unknown error"));if(status)status.textContent="Please check the connection and try again.";}
 finally{geranemoSending=false;if(button)button.disabled=false;if(input){input.disabled=false;input.focus();}}
}
$("geranemoForm")?.addEventListener("submit",event=>{event.preventDefault();sendGeranemoMessage($("geranemoInput")?.value);});
document.querySelectorAll("[data-geranemo-prompt]").forEach(button=>button.addEventListener("click",()=>sendGeranemoMessage(button.dataset.geranemoPrompt)));
