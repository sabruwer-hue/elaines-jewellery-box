const SUPABASE_URL="https://jakcqdeyvbbgdwctomdu.supabase.co";
const SUPABASE_PUBLIC_KEY="sb_publishable_-fWvxeQlGA1ocIVgxWguaA_5MUUo67-";
const INTAKE_URL=SUPABASE_URL+"/functions/v1/public-intake";
const menuToggle=document.getElementById("menuToggle");const mainNav=document.getElementById("mainNav");
menuToggle?.addEventListener("click",()=>{const open=mainNav.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open));});
mainNav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{mainNav.classList.remove("open");menuToggle?.setAttribute("aria-expanded","false");}));
document.getElementById("year").textContent=new Date().getFullYear();
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
function referralUrl(){const url=new URL(location.href);url.hash="";let ref=url.searchParams.get("ref");if(!ref){ref="EJ"+Math.random().toString(36).slice(2,8).toUpperCase();url.searchParams.set("ref",ref);history.replaceState({}, "",url);}return url.toString();}
const shareButton=document.getElementById("shareButton");const copyButton=document.getElementById("copyReferral");const shareStatus=document.getElementById("shareStatus");
shareButton?.addEventListener("click",async()=>{const url=referralUrl();const data={title:"Elaine’s Jewellery Box",text:"Discover handmade treasures at Elaine’s Jewellery Box.",url};if(navigator.share){try{await navigator.share(data);shareStatus.textContent="Thanks for sharing!";}catch(e){if(e.name!=="AbortError")shareStatus.textContent="Sharing was not available. Try copying your link.";}}else{try{await navigator.clipboard.writeText(url);shareStatus.textContent="Your referral link has been copied.";}catch(e){shareStatus.textContent=url;}}});
copyButton?.addEventListener("click",async()=>{const url=referralUrl();try{await navigator.clipboard.writeText(url);shareStatus.textContent="Your referral link has been copied.";}catch(e){shareStatus.textContent=url;}});
async function intake(payload){const response=await fetch(INTAKE_URL,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_PUBLIC_KEY},body:JSON.stringify(payload)});let result={};try{result=await response.json();}catch{}if(!response.ok)throw new Error(result.error||"Submission failed. Please try again.");return result;}
function bindForm(id,type,statusId){const form=document.getElementById(id),status=document.getElementById(statusId);form?.addEventListener("submit",async event=>{event.preventDefault();const button=form.querySelector("button[type=submit]");button.disabled=true;status.textContent="Sending securely…";const values=Object.fromEntries(new FormData(form).entries());try{const result=await intake({type,...values});form.reset();status.textContent=result.reference?"Thank you — your reference is "+result.reference+". Elaine will review your submission.":(result.message||"Thank you. Your submission has been received.");}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});}
bindForm("studioForm","studio_enquiry","studioStatus");document.getElementById("customJewelleryForm")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button[type=submit]"),status=document.getElementById("customJewelleryStatus");button.disabled=true;status.textContent="Sending your design request securely…";const v=Object.fromEntries(new FormData(form).entries());const item="Custom jewellery design — "+v.piece+(v.style?" · Style: "+v.style:"")+(v.materials?" · Materials/colours: "+v.materials:"")+(v.budget?" · Budget: "+v.budget:"");const vision=v.vision;try{const result=await intake({type:"studio_enquiry",name:v.name,email:v.email,phone:v.phone,item,vision,website:v.website});form.reset();status.textContent=result.reference?"Thank you — your design request reference is "+result.reference+". Elaine will review your idea and contact you about a quotation.":(result.message||"Thank you. Your design request has been received.");}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});bindForm("reviewForm","review","reviewStatus");bindForm("careForm","customer_case","careStatus");
async function loadPublicContent(){try{const response=await fetch(INTAKE_URL,{headers:{"apikey":SUPABASE_PUBLIC_KEY}});if(!response.ok)throw new Error("Unable to load updates");const data=await response.json();
const announcements=document.getElementById("announcementList");if(announcements){announcements.innerHTML="";if(!data.announcements?.length)announcements.innerHTML="<p class=empty-public>No announcements have been published yet.</p>";else data.announcements.forEach(item=>{const card=document.createElement("article");card.className="public-card";const title=document.createElement("h3");title.textContent=item.title;const body=document.createElement("p");body.textContent=item.body;const date=document.createElement("small");date.textContent=item.published_at?new Date(item.published_at).toLocaleDateString("en-ZA"):"";card.append(date,title,body);announcements.append(card);});}
const reviews=document.getElementById("reviewList");if(reviews){reviews.innerHTML="";if(!data.reviews?.length)reviews.innerHTML="<p class=empty-public>No published customer reviews yet. Be the first to share your experience.</p>";else data.reviews.forEach(item=>{const card=document.createElement("article");card.className="public-card";const stars=document.createElement("div");stars.className="review-stars";stars.textContent="★".repeat(item.rating)+"☆".repeat(5-item.rating);const title=document.createElement("h3");title.textContent=item.title||"Customer review";const body=document.createElement("p");body.textContent=item.review_text;const by=document.createElement("small");by.textContent="By "+item.display_name;card.append(stars,title,body,by);reviews.append(card);});}
const grid=document.querySelector(".product-grid");if(grid&&data.products?.length){grid.innerHTML="";data.products.forEach(product=>{const article=document.createElement("article");article.className="product-card";const image=document.createElement(product.image_url?"img":"div");image.className="product-image product-one";if(product.image_url){image.src=product.image_url;image.alt=product.image_alt||product.name;image.loading="lazy";}else{const mark=document.createElement("span");mark.className="product-symbol";mark.textContent="✧";image.append(mark);}const info=document.createElement("div");info.className="product-info";const copy=document.createElement("div");const title=document.createElement("h3");title.textContent=product.name;const description=document.createElement("p");description.textContent=product.description||"Handmade with care";copy.append(title,description);const variants=(product.product_variants||[]).filter(v=>v.is_active!==false);const active=variants.find(v=>Number(v.stock_on_hand)>0);const price=document.createElement("span");price.className="price";price.textContent=active?"R"+(Number(active.price_minor)/100).toFixed(2):(variants.length?"Currently unavailable":"Ask us");info.append(copy,price);article.append(image,info);grid.append(article);});const note=document.querySelector("#jewellery .demo-note");if(note)note.textContent="Prices and availability are shown as supplied by Elaine. Contact us to confirm an order.";}}catch(error){const a=document.getElementById("announcementList");if(a)a.innerHTML="<p class=empty-public>Updates will appear here once the service is available.</p>";const r=document.getElementById("reviewList");if(r)r.innerHTML="<p class=empty-public>Customer reviews are temporarily unavailable.</p>";}}
loadPublicContent();
const newArrivalForm=document.getElementById("newArrivalForm");
newArrivalForm?.addEventListener("submit",async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),status=document.getElementById("newArrivalStatus");
 const values=Object.fromEntries(new FormData(form).entries());if(values.consent!=="on"){status.textContent="Please confirm that you want to receive new-arrival emails.";return;}
 button.disabled=true;status.textContent="Adding you to the new-arrivals list…";
 try{const result=await intake({type:"subscribe_new_arrivals",email:values.email,name:values.name||"",consent:true,website:values.website||""});form.reset();status.textContent=result.message||"You're on the list. Watch your inbox for new arrivals.";}
 catch(error){status.textContent=error.message||"We couldn't save your subscription. Please try again.";}
 finally{button.disabled=false;}
});
async function processNewArrivalUnsubscribe(){
 const params=new URLSearchParams(location.search),token=params.get("unsubscribe");if(!token)return;
 const status=document.createElement("p");status.className="unsubscribe-status";status.textContent="Updating your email preferences…";document.querySelector("main")?.prepend(status);
 try{const result=await intake({type:"unsubscribe_new_arrivals",token});status.textContent=result.message||"Your email preferences have been updated.";}
 catch(error){status.textContent=error.message||"We couldn't update your preferences.";}
 params.delete("unsubscribe");const clean=location.pathname+(params.toString()?"?"+params.toString():"")+location.hash;history.replaceState({}, "",clean);
}
processNewArrivalUnsubscribe();


// Geranemo — public boutique assistant and manager-support handover.
(() => {
  const endpoint = SUPABASE_URL + "/functions/v1/geranemo-public";
  const launcher = document.getElementById("geranemoLauncher");
  const panel = document.getElementById("geranemoPanel");
  const close = document.getElementById("geranemoClose");
  const messagesEl = document.getElementById("geranemoMessages");
  const chatForm = document.getElementById("geranemoChatForm");
  const input = document.getElementById("geranemoInput");
  const managerToggle = document.getElementById("geranemoManagerToggle");
  const handoffForm = document.getElementById("geranemoHandoffForm");
  const handoffStatus = document.getElementById("geranemoHandoffStatus");
  if (!launcher || !panel || !messagesEl || !chatForm) return;

  const history = [];
  let busy = false;
  const addMessage = (role, content) => {
    history.push({role, content});
    const bubble = document.createElement("div");
    bubble.className = "geranemo-message " + (role === "user" ? "is-user" : "is-assistant");
    const label = document.createElement("strong");
    label.textContent = role === "user" ? "You" : "Geranemo";
    const text = document.createElement("p");
    text.textContent = content;
    bubble.append(label, text);
    messagesEl.append(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };
  const setOpen = (open) => {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
    else launcher.focus();
  };
  const pageContext = () => {
    const section = location.hash ? document.querySelector(location.hash) : null;
    const heading = section?.querySelector("h1,h2,h3")?.textContent?.trim() || "";
    return [document.title, location.pathname, location.hash, heading].filter(Boolean).join(" | ").slice(0,240);
  };
  const showHandoff = () => {
    handoffForm.hidden = false;
    const summaryField = handoffForm.querySelector('textarea[name="message"]');
    const subjectField = handoffForm.querySelector('input[name="subject"]');
    const categoryField = handoffForm.querySelector('select[name="category"]');
    const customerMessages = history.filter(item => item.role === "user").slice(-5).map(item => item.content);
    if (summaryField && !summaryField.value.trim() && customerMessages.length) {
      summaryField.value = "Conversation summary from Geranemo:\n\n" + customerMessages.join("\n\n");
    }
    if (subjectField && !subjectField.value.trim()) subjectField.value = "Manager follow-up requested via Geranemo";
    if (categoryField && customerMessages.some(item => /complain|complaint|problem|issue|unhappy|disappointed/i.test(item))) {
      categoryField.value = "complaint";
    }
    handoffForm.scrollIntoView({behavior:"smooth",block:"nearest"});
    handoffForm.querySelector("input")?.focus();
  };
  launcher.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  managerToggle.addEventListener("click", showHandoff);
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || busy) return;
    const managerIntent = /\b(manager|complain|complaint|supervisor|person in charge|speak to someone|human)\b/i.test(message);
    addMessage("user", message);
    input.value = "";
    busy = true;
    const button = chatForm.querySelector("button");
    button.disabled = true;
    const pending = document.createElement("p");
    pending.className = "geranemo-pending";
    pending.textContent = "Geranemo is thinking…";
    messagesEl.append(pending);
    try {
      const response = await fetch(endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":SUPABASE_PUBLIC_KEY},
        body:JSON.stringify({action:"chat",messages:history.slice(-12),page:pageContext()})
      });
      const result = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result.error || "Geranemo is temporarily unavailable.");
      pending.remove();
      addMessage("assistant", result.reply);
      if (managerIntent) showHandoff();
    } catch (error) {
      pending.remove();
      addMessage("assistant", error.message || "I’m having trouble connecting. Please use the Customer Care section or email Elaine directly.");
    } finally {
      busy = false;
      button.disabled = false;
      input.focus();
    }
  });
  handoffForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(handoffForm).entries());
    busy = true;
    const button = handoffForm.querySelector('button[type="submit"]');
    button.disabled = true;
    handoffStatus.textContent = "Sending your message securely…";
    try {
      const response = await fetch(endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":SUPABASE_PUBLIC_KEY},
        body:JSON.stringify({action:"handoff",...values})
      });
      const result = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result.error || "We couldn't send your message.");
      handoffForm.reset();
      handoffStatus.textContent = "Received. Your reference is " + result.reference + ". Elaine’s team has been notified for review.";
      addMessage("assistant", "Thank you. I’ve submitted your request for a human follow-up. Your reference is " + result.reference + ". I can’t make a decision on the team’s behalf, but your message is now recorded.");
    } catch (error) {
      handoffStatus.textContent = error.message || "Please use the Customer Care form instead.";
    } finally {
      busy = false;
      button.disabled = false;
    }
  });
  addMessage("assistant", "Hello! I’m Geranemo, Elaine’s Jewellery Box assistant. I can help you explore the shop, answer questions using published information, or help you reach the manager if something needs attention. How can I help?");
})();
