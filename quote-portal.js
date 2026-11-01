const API="https://jakcqdeyvbbgdwctomdu.supabase.co/functions/v1/studio-quote-portal";
const token=new URLSearchParams(location.search).get("token");
const $=id=>document.getElementById(id);
const money=value=>"R"+(Number(value||0)/100).toFixed(2);
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
function fail(message){$("loading").textContent=message;}
async function load(){
 if(!token){fail("This quote link is incomplete. Please contact Elaine for a fresh link.");return;}
 try{
  const response=await fetch(API+"?token="+encodeURIComponent(token));
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to load quote.");
  const q=data.quote,enq=q.studio_enquiries||{};
  $("reference").textContent=q.quote_reference+" · Issued "+(q.sent_at?new Date(q.sent_at).toLocaleDateString("en-ZA"):"");
  $("customerName").textContent="Prepared for "+(enq.customer_name||"our customer");
  $("itemDescription").textContent="Item: "+(enq.item_description||"Second Life Studio project");
  $("customerVision").textContent=enq.customer_vision||"";
  $("customerMessage").textContent=q.customer_message||"";
  const body=$("lineItems");(q.studio_quote_lines||[]).sort((a,b)=>a.sort_order-b.sort_order).forEach(line=>{const tr=document.createElement("tr");tr.append(el("td",line.description),el("td",String(line.quantity)),el("td",money(line.line_total_minor)));body.append(tr);});
  $("total").textContent="Total: "+money(q.subtotal_minor);
  const road=$("roadmap");(q.studio_quote_steps||[]).sort((a,b)=>a.step_number-b.step_number).forEach(step=>{const row=el("div");row.className="step";row.append(el("strong",step.step_number+". "+step.title),el("span",step.description||""),el("small",step.estimated_days===null?"":"Estimated duration: "+step.estimated_days+" day(s)"));road.append(row);});
  $("validity").textContent="Quote valid until "+(q.valid_until?new Date(q.valid_until).toLocaleDateString("en-ZA"):"the date confirmed with Elaine")+". Estimates may change if the scope or materials change.";
  $("loading").classList.add("hidden");$("quoteContent").classList.remove("hidden");
  if(q.status!=="sent"){ $("responseArea").classList.add("hidden");$("responseStatus").classList.remove("hidden");$("responseStatus").textContent=q.status==="accepted"?"You have already accepted this quote.":q.status==="declined"?"This quote was declined.":q.status==="changes_requested"?"Your change request has been received.":q.status==="expired"?"This quote has expired. Please contact Elaine.":"This quote is no longer open for responses."; }
 }catch(error){fail(error.message||"Unable to load quote. Please contact Elaine.");}
}
document.querySelectorAll("[data-decision]").forEach(button=>button.addEventListener("click",async()=>{
 const decision=button.dataset.decision;
 if(decision==="accepted"&&!window.confirm("Are you sure you want to accept this quotation?"))return;
 document.querySelectorAll("[data-decision]").forEach(b=>b.disabled=true);
 $("responseStatus").classList.remove("hidden");$("responseStatus").textContent="Submitting your response…";
 try{const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,decision,note:$("responseNote").value})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Response could not be saved.");$("responseArea").classList.add("hidden");$("responseStatus").textContent=result.message;}
 catch(error){$("responseStatus").textContent=error.message;document.querySelectorAll("[data-decision]").forEach(b=>b.disabled=false);}
}));
load();