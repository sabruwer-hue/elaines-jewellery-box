const adminSupabase = window.supabase.createClient("https://jakcqdeyvbbgdwctomdu.supabase.co", "sb_publishable_-fWvxeQlGA1ocIVgxWguaA_5MUUo67-");
const loginPanel=document.getElementById("loginPanel"),adminShell=document.getElementById("adminShell"),loginStatus=document.getElementById("loginStatus"),logoutButton=document.getElementById("logoutButton"),authStatus=document.getElementById("authStatus");
const $=(id)=>document.getElementById(id);
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function card(title,detail){const el=node("article",undefined,"live-card");el.append(node("h3",title),node("p",detail));return el;}
function money(minor){return "R"+(Number(minor||0)/100).toFixed(2);}
function showMessage(target,message){const el=$(target);if(el)el.textContent=message;}
async function verifyStaff(){const {data:{user},error}=await adminSupabase.auth.getUser();if(error||!user)return false;const {data,error:staffError}=await adminSupabase.from("staff_members").select("role,is_active").eq("user_id",user.id).maybeSingle();if(staffError||!data||!data.is_active||!["owner","admin"].includes(data.role))return false;authStatus.textContent="Signed in · "+data.role;loginPanel.hidden=true;adminShell.hidden=false;logoutButton.hidden=false;await loadDashboard();return true;}
$("ownerLogin")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button");button.disabled=true;loginStatus.textContent="Checking your account…";const values=Object.fromEntries(new FormData(form));const {error}=await adminSupabase.auth.signInWithPassword({email:values.email,password:values.password});if(error){loginStatus.textContent="Sign-in failed. Check your email and password, then try again.";button.disabled=false;return;}const ok=await verifyStaff();if(!ok){await adminSupabase.auth.signOut();loginStatus.textContent="This account is not enabled as an active owner/admin. No access was granted.";}button.disabled=false;});
logoutButton?.addEventListener("click",async()=>{await adminSupabase.auth.signOut();adminShell.hidden=true;loginPanel.hidden=false;logoutButton.hidden=true;authStatus.textContent="Signed out";});
async function loadDashboard(){await Promise.all([loadStudio(),loadCare(),loadReviews(),loadProducts(),loadOrders(),loadAnnouncements(),loadQuoteEnquiries()]);const stats=await Promise.all([adminSupabase.from("orders").select("id",{count:"exact",head:true}).not("order_status","in","(completed,cancelled)"),adminSupabase.from("customer_cases").select("id",{count:"exact",head:true}).eq("status","new"),adminSupabase.from("studio_enquiries").select("id",{count:"exact",head:true}).in("status",["new","under_review"]),adminSupabase.from("products").select("id",{count:"exact",head:true}).eq("is_published",true)]);document.querySelectorAll(".stats article strong").forEach((el,i)=>{el.textContent=stats[i].count??"—";});}
async function loadStudio(){const box=$("studioQueue");if(!box)return;const {data,error}=await adminSupabase.from("studio_enquiries").select("*").order("created_at",{ascending:false}).limit(100);box.innerHTML="";if(error){box.append(node("p","Unable to load enquiries. Check staff permissions."));return;}if(!data.length){box.append(node("p","No studio enquiries yet.","empty"));return;}data.forEach(item=>{const el=card(item.reference+" · "+item.customer_name,item.customer_email+" · "+item.item_description+"\n"+item.customer_vision);const meta=node("small",new Date(item.created_at).toLocaleString("en-ZA")+" · "+item.status);const select=node("select");["new","under_review","accepted","declined","quoted","approved","in_progress","completed","cancelled"].forEach(v=>{const o=node("option",v);o.value=v;o.selected=v===item.status;select.append(o);});select.addEventListener("change",async()=>{const {error}=await adminSupabase.from("studio_enquiries").update({status:select.value,updated_at:new Date().toISOString()}).eq("id",item.id);if(error){meta.textContent="Update failed — "+error.message;select.value=item.status;}else{item.status=select.value;meta.textContent="Updated · "+item.status;}});el.append(meta,select);box.append(el);});}
async function loadCare(){const box=$("careQueue");if(!box)return;const {data,error}=await adminSupabase.from("customer_cases").select("*").order("created_at",{ascending:false}).limit(100);box.innerHTML="";if(error){box.append(node("p","Unable to load customer cases."));return;}if(!data.length){box.append(node("p","No customer-care messages yet.","empty"));return;}data.forEach(item=>{const el=card(item.reference+" · "+item.category+" · "+item.customer_name,item.subject+"\n"+item.message+"\nReply address: "+item.customer_email);const meta=node("small",new Date(item.created_at).toLocaleString("en-ZA")+" · "+item.status);const select=node("select");["new","acknowledged","in_progress","awaiting_customer","resolved","closed"].forEach(v=>{const o=node("option",v);o.value=v;o.selected=v===item.status;select.append(o);});select.addEventListener("change",async()=>{const {error}=await adminSupabase.from("customer_cases").update({status:select.value,updated_at:new Date().toISOString()}).eq("id",item.id);if(error){meta.textContent="Update failed";select.value=item.status;}else{item.status=select.value;meta.textContent="Updated · "+item.status;}});el.append(meta,select);box.append(el);});}
async function loadReviews(){const box=$("reviewQueue");if(!box)return;const {data,error}=await adminSupabase.from("customer_reviews").select("*").order("created_at",{ascending:false}).limit(100);box.innerHTML="";if(error){box.append(node("p","Unable to load reviews."));return;}if(!data.length){box.append(node("p","No customer reviews yet.","empty"));return;}data.forEach(item=>{const el=card(item.display_name+" · "+("★".repeat(item.rating))+" · "+item.status,(item.title||"Customer review")+"\n"+item.review_text+"\n"+(item.email||""));const meta=node("small",new Date(item.created_at).toLocaleString("en-ZA"));el.append(meta);if(item.status==="pending"){const approve=node("button","Approve","primary"),reject=node("button","Reject","outline");approve.addEventListener("click",()=>moderateReview(item,"published"));reject.addEventListener("click",()=>moderateReview(item,"rejected"));el.append(approve,reject);}box.append(el);});}
async function moderateReview(item,status){const {data:{user}}=await adminSupabase.auth.getUser();const {error}=await adminSupabase.from("customer_reviews").update({status,moderated_at:new Date().toISOString(),moderated_by:user.id}).eq("id",item.id);if(error)alert("Review update failed: "+error.message);else loadReviews();}
async function loadProducts(){const box=$("productQueue"),select=$("productCategory");if(!box)return;const [{data:products,error},{data:categories}]=await Promise.all([adminSupabase.from("products").select("*").order("created_at",{ascending:false}),adminSupabase.from("categories").select("id,name").eq("is_active",true).order("sort_order")]);box.innerHTML="";if(error){box.append(node("p","Unable to load products."));return;}if(select){select.innerHTML="<option value=\"\">No category</option>";(categories||[]).forEach(cat=>{const o=node("option",cat.name);o.value=cat.id;select.append(o);});}if(!products?.length){box.append(node("p","No products added yet.","empty"));return;}products.forEach(p=>{const el=card(p.name,p.description||"No description · "+(p.is_published?"Published":"Draft"));el.append(node("small",p.is_published?"Published":"Draft"));box.append(el);});}
$("productForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button");button.disabled=true;showMessage("productStatus","Saving product…");const v=Object.fromEntries(new FormData(form));const {data:product,error}=await adminSupabase.from("products").insert({name:v.name,slug:v.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+Math.random().toString(36).slice(2,6),description:v.description||null,category_id:v.category_id||null,is_published:false}).select("id").single();if(error){showMessage("productStatus","Could not save product: "+error.message);button.disabled=false;return;}const {error:variantError}=await adminSupabase.from("product_variants").insert({product_id:product.id,sku:v.sku,price_minor:Math.round(Number(v.price)*100),stock_on_hand:Number(v.stock),variant_name:"Default"});if(variantError){showMessage("productStatus","Product saved as a draft, but its stock/price variant failed: "+variantError.message);button.disabled=false;await loadProducts();return;}if(v.is_published==="on"){const {error:publishError}=await adminSupabase.from("products").update({is_published:true}).eq("id",product.id);if(publishError){showMessage("productStatus","Product saved as draft; publishing failed: "+publishError.message);button.disabled=false;await loadProducts();return;}}form.reset();showMessage("productStatus","Product saved successfully.");button.disabled=false;await loadProducts();});
async function loadOrders(){const box=$("orderQueue");if(!box)return;const {data,error}=await adminSupabase.from("orders").select("id,order_reference,customer_name,customer_email,total_amount_minor,payment_status,order_status,created_at").order("created_at",{ascending:false}).limit(100);box.innerHTML="";if(error){box.append(node("p","Unable to load orders."));return;}if(!data.length){box.append(node("p","No shop orders yet.","empty"));return;}data.forEach(item=>{const el=card(item.order_reference+" · "+item.customer_name,money(item.total_amount_minor)+" · "+item.payment_status+"\n"+item.customer_email);el.append(node("small",item.order_status+" · "+new Date(item.created_at).toLocaleString("en-ZA")));box.append(el);});}
async function loadAnnouncements(){const box=$("announcementQueue");if(!box)return;const {data,error}=await adminSupabase.from("business_announcements").select("*").order("created_at",{ascending:false}).limit(50);box.innerHTML="";if(error){box.append(node("p","Unable to load announcements."));return;}if(!data.length){box.append(node("p","No announcements yet.","empty"));return;}data.forEach(item=>{const el=card(item.title,item.body);el.append(node("small",item.is_published?"Published":"Draft"));box.append(el);});}
$("announcementForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button");button.disabled=true;showMessage("announcementStatus","Saving…");const v=Object.fromEntries(new FormData(form));const publish=v.is_published==="on";const {data:{user}}=await adminSupabase.auth.getUser();const {error}=await adminSupabase.from("business_announcements").insert({title:v.title,body:v.body,is_published:publish,published_at:publish?new Date().toISOString():null,created_by:user.id});if(error)showMessage("announcementStatus","Save failed: "+error.message);else{form.reset();showMessage("announcementStatus","Announcement saved.");await loadAnnouncements();}button.disabled=false;});
adminSupabase.auth.getSession().then(async({data})=>{if(data.session){const ok=await verifyStaff();if(!ok){await adminSupabase.auth.signOut();loginStatus.textContent="Your saved session is not authorised for this workspace.";}}});

// Second Life Studio quote builder: staff-only via RLS-protected tables.
const quoteSelect=$("quoteEnquirySelect");
async function loadQuoteEnquiries(){
 if(!quoteSelect)return;
 const {data,error}=await adminSupabase.from("studio_enquiries").select("id,reference,customer_name,item_description,status").order("created_at",{ascending:false}).limit(100);
 quoteSelect.innerHTML='<option value="">Choose an enquiry…</option>';
 if(error){showMessage("quoteStatus","Unable to load enquiries. Check staff permissions.");return;}
 (data||[]).forEach(item=>{const option=node("option",item.reference+" · "+item.customer_name+" · "+item.item_description);option.value=item.id;quoteSelect.append(option);});
 await loadStudioQuotes();
}
quoteSelect?.addEventListener("change",loadStudioQuotes);
function parseQuoteRows(raw,kind){
 const rows=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 return rows.map((line,index)=>{
  const parts=line.split("|").map(part=>part.trim());
  if(kind==="item"){
   if(parts.length<3)throw new Error("Cost line "+(index+1)+" must be: description | quantity | unit price in rand.");
   const quantity=Number(parts[1]),rand=Number(parts[2]);
   if(!parts[0]||!Number.isInteger(quantity)||quantity<1||quantity>10000||!Number.isFinite(rand)||rand<0||rand>100000000)throw new Error("Please check cost line "+(index+1)+".");
   const unit=Math.round(rand*100);
   return {description:parts[0].slice(0,500),quantity,unit_amount_minor:unit,line_total_minor:unit*quantity,sort_order:index};
  }
  const days=parts[2]===""||parts[2]===undefined?null:Number(parts[2]);
  if(!parts[0]||(days!==null&&(!Number.isInteger(days)||days<0||days>3650)))throw new Error("Please check roadmap line "+(index+1)+".");
  return {step_number:index+1,title:parts[0].slice(0,160),description:(parts[1]||"").slice(0,2000),estimated_days:days};
 });
}
$("saveStudioQuote")?.addEventListener("click",async()=>{
 const button=$("saveStudioQuote");button.disabled=true;showMessage("quoteStatus","Saving private draft…");
 try{
  const enquiryId=quoteSelect.value;if(!enquiryId)throw new Error("Choose a Second Life Studio enquiry first.");
  const items=parseQuoteRows($("quoteItems").value,"item"),steps=parseQuoteRows($("quoteSteps").value,"step");
  if(!items.length)throw new Error("Add at least one itemised cost.");
  if(!steps.length)throw new Error("Add at least one roadmap step.");
  const days=Number($("quoteValidity").value);if(!Number.isInteger(days)||days<1||days>90)throw new Error("Quote validity must be between 1 and 90 days.");
  const subtotal=items.reduce((sum,line)=>sum+line.line_total_minor,0);
  const {data:{user}}=await adminSupabase.auth.getUser();
  const {data:quote,error}=await adminSupabase.from("studio_quotes").insert({enquiry_id:enquiryId,subtotal_minor:subtotal,customer_message:$("quoteCustomerMessage").value.trim()||null,internal_note:$("quoteInternalNote").value.trim()||null,valid_until:new Date(Date.now()+days*86400000).toISOString(),created_by:user.id}).select("id,quote_reference").single();
  if(error)throw error;
  const [lineResult,stepResult]=await Promise.all([
   adminSupabase.from("studio_quote_lines").insert(items.map(item=>({...item,quote_id:quote.id}))),
   adminSupabase.from("studio_quote_steps").insert(steps.map(step=>({...step,quote_id:quote.id})))
  ]);
  if(lineResult.error||stepResult.error){await adminSupabase.from("studio_quotes").delete().eq("id",quote.id);throw new Error("Draft could not be completed. "+(lineResult.error||stepResult.error).message);}
  $("quoteItems").value="";$("quoteSteps").value="";$("quoteInternalNote").value="";
  showMessage("quoteStatus","Draft "+quote.quote_reference+" saved. Review it below before creating a customer link.");
  await loadStudioQuotes();
 }catch(error){showMessage("quoteStatus","Could not save quote: "+(error.message||"Please try again."));}
 finally{button.disabled=false;}
});
async function loadStudioQuotes(){
 const box=$("studioQuoteQueue");if(!box||!quoteSelect?.value)return;
 const {data,error}=await adminSupabase.from("studio_quotes").select("id,quote_reference,version,status,subtotal_minor,valid_until,created_at,sent_at,responded_at,response_note,customer_message").eq("enquiry_id",quoteSelect.value).order("created_at",{ascending:false});
 box.innerHTML="";
 if(error){box.append(node("p","Unable to load quotes."));return;}
 if(!data?.length){box.append(node("p","No quotes for this enquiry yet.","empty"));return;}
 data.forEach(quote=>{
  const el=card(quote.quote_reference+" · "+quote.status,money(quote.subtotal_minor)+" · Version "+quote.version);
  el.append(node("small","Valid until "+(quote.valid_until?new Date(quote.valid_until).toLocaleDateString("en-ZA"):"not set")+(quote.responded_at?" · Customer responded "+new Date(quote.responded_at).toLocaleString("en-ZA"):"")));
  if(quote.customer_message)el.append(node("p",quote.customer_message));
  if(quote.response_note)el.append(node("p","Customer response: "+quote.response_note));
  if(quote.status==="draft"){
   const send=node("button","Create customer review link","primary");
   send.addEventListener("click",()=>createStudioQuoteLink(quote,send));el.append(send);
  }
  box.append(el);
 });
}
async function createStudioQuoteLink(quote,button){
 button.disabled=true;
 try{
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  const token=Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
  const tokenHash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
  const {error}=await adminSupabase.from("studio_quotes").update({public_token_hash:tokenHash,status:"sent",sent_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",quote.id).eq("status","draft");
  if(error)throw error;
  const link=new URL("quote.html",location.href);link.searchParams.set("token",token);
  try{await navigator.clipboard.writeText(link.toString());showMessage("quoteStatus","Customer quote link copied. Share it with the customer after your final review.");}
  catch{showMessage("quoteStatus","Customer quote link created: "+link.toString());}
  const {data:enquiry}=await adminSupabase.from("studio_enquiries").select("id").eq("id",quoteSelect.value).maybeSingle();
  if(enquiry)await adminSupabase.from("studio_enquiries").update({status:"quoted",updated_at:new Date().toISOString()}).eq("id",enquiry.id);
  await loadStudioQuotes();await loadStudio();
 }catch(error){showMessage("quoteStatus","Could not create customer link: "+(error.message||"Please try again."));button.disabled=false;}
}
