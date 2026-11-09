/* Elaine's Jewellery Box — invoice register and payment controls.
   Uses the already-authenticated adminSupabase client from admin-live.js. */
(() => {
  const $ = (id) => document.getElementById(id);
  const money = (minor) => "R" + (Number(minor || 0) / 100).toFixed(2);
  const textNode = (tag, value, cls) => {
    const el = document.createElement(tag);
    if (value !== undefined && value !== null) el.textContent = String(value);
    if (cls) el.className = cls;
    return el;
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
  let eligible = new Map();
  let loading = false;

  async function loadInvoiceOptions() {
    const select = $("invoiceSource");
    if (!select) return;
    select.innerHTML = '<option value="">Loading eligible records…</option>';
    const [orders, quotes, existing] = await Promise.all([
      adminSupabase.from("orders").select("id,order_reference,customer_name,customer_email,customer_phone,total_amount_minor,order_status,quote_accepted_at,created_at").order("created_at", {ascending:false}).limit(100),
      adminSupabase.from("studio_quotes").select("id,quote_reference,enquiry_id,subtotal_minor,status,valid_until,created_at").eq("status","accepted").order("created_at",{ascending:false}).limit(100),
      adminSupabase.from("invoices").select("order_id,studio_quote_id")
    ]);
    eligible = new Map();
    select.innerHTML = '<option value="">Choose an accepted order or Studio quote…</option>';
    if (orders.error || quotes.error || existing.error) {
      select.innerHTML = '<option value="">Could not load eligible records</option>';
      $("invoiceStatus").textContent = "Could not load invoice sources. Check database access and try again.";
      return;
    }
    const usedOrders = new Set((existing.data || []).map(x => x.order_id).filter(Boolean));
    const usedQuotes = new Set((existing.data || []).map(x => x.studio_quote_id).filter(Boolean));
    (orders.data || []).filter(o => !usedOrders.has(o.id) && (
      !!o.quote_accepted_at || !["quote_requested","quote_prepared","quote_sent","awaiting_customer_acceptance","cancelled"].includes(o.order_status)
    )).forEach(o => {
      const value = "order:" + o.id;
      eligible.set(value, {type:"order", record:o});
      const option = textNode("option", o.order_reference + " · " + o.customer_name + " · " + money(o.total_amount_minor) + " · " + o.order_status);
      option.value = value;
      select.append(option);
    });
    const enquiryIds = [...new Set((quotes.data || []).map(q => q.enquiry_id))];
    let enquiries = [];
    if (enquiryIds.length) {
      const result = await adminSupabase.from("studio_enquiries").select("id,customer_name,customer_email,customer_phone,item_description").in("id", enquiryIds);
      if (result.error) {
        $("invoiceStatus").textContent = "Studio customer details could not be loaded.";
        return;
      }
      enquiries = result.data || [];
    }
    const enquiryMap = new Map(enquiries.map(e => [e.id,e]));
    (quotes.data || []).filter(q => !usedQuotes.has(q.id)).forEach(q => {
      const enquiry = enquiryMap.get(q.enquiry_id);
      if (!enquiry) return;
      const value = "studio:" + q.id;
      eligible.set(value, {type:"studio", record:q, enquiry});
      const option = textNode("option", q.quote_reference + " · " + enquiry.customer_name + " · " + money(q.subtotal_minor) + " · Studio");
      option.value = value;
      select.append(option);
    });
    if (select.options.length === 1) {
      select.options[0].textContent = "No eligible records available yet";
    }
  }

  async function loadInvoices() {
    const box = $("invoiceQueue");
    if (!box || loading) return;
    loading = true;
    box.innerHTML = "";
    const {data: invoices, error} = await adminSupabase.from("invoices").select("*").order("created_at",{ascending:false}).limit(100);
    if (error) {
      box.append(textNode("p","Invoices could not be loaded. Check staff permissions."));
      loading = false;
      return;
    }
    if (!invoices?.length) {
      box.append(textNode("p","No invoices have been created yet.","empty"));
      loading = false;
      return;
    }
    const ids = invoices.map(i => i.id);
    const [lineResult,paymentResult] = await Promise.all([
      adminSupabase.from("invoice_lines").select("*").in("invoice_id",ids).order("sort_order"),
      adminSupabase.from("invoice_payment_records").select("*").in("invoice_id",ids).order("created_at",{ascending:false})
    ]);
    const linesByInvoice = new Map(), paymentsByInvoice = new Map();
    (lineResult.data || []).forEach(line => {
      if (!linesByInvoice.has(line.invoice_id)) linesByInvoice.set(line.invoice_id,[]);
      linesByInvoice.get(line.invoice_id).push(line);
    });
    (paymentResult.data || []).forEach(payment => {
      if (!paymentsByInvoice.has(payment.invoice_id)) paymentsByInvoice.set(payment.invoice_id,[]);
      paymentsByInvoice.get(payment.invoice_id).push(payment);
    });
    invoices.forEach(invoice => {
      const card = textNode("article",undefined,"live-card");
      card.append(textNode("h3",invoice.invoice_reference + " · " + invoice.customer_name));
      card.append(textNode("p",money(invoice.total_minor) + " · " + invoice.status + " · Due: " + (invoice.due_date || "Not set")));
      card.append(textNode("small",invoice.customer_email + " · Paid " + money(invoice.amount_paid_minor) + " · Balance " + money(Math.max(0,Number(invoice.total_minor)-Number(invoice.amount_paid_minor)))));
      const lines = linesByInvoice.get(invoice.id) || [];
      const payments = paymentsByInvoice.get(invoice.id) || [];
      const detail = textNode("div",undefined,"invoice-record-detail");
      lines.forEach(line => detail.append(textNode("p",line.description + " · " + line.quantity + " × " + money(line.unit_amount_minor) + " = " + money(line.line_total_minor))));
      payments.forEach(payment => {
        const row = textNode("p",money(payment.amount_minor) + " · " + payment.method.toUpperCase() + " · " + payment.status + (payment.payment_reference ? " · " + payment.payment_reference : ""));
        detail.append(row);
        if (payment.status === "pending") {
          const verify = textNode("button","Verify received payment","outline");
          verify.type = "button";
          verify.addEventListener("click",() => verifyPayment(invoice,payment));
          detail.append(verify);
        }
      });
      card.append(detail);
      const actions = textNode("div",undefined,"invoice-actions");
      const print = textNode("button","Print customer invoice","outline");
      print.type = "button";
      print.addEventListener("click",() => printInvoice(invoice,lines,payments));
      actions.append(print);
      if (invoice.status === "draft") {
        const issue = textNode("button","Mark as issued","primary");
        issue.type = "button";
        issue.addEventListener("click",() => markIssued(invoice));
        actions.append(issue);
      }
      if (["issued","partially_paid","overdue"].includes(invoice.status)) {
        const record = textNode("button","Record payment","outline");
        record.type = "button";
        record.addEventListener("click",() => recordPayment(invoice));
        actions.append(record);
      }
      card.append(actions);
      box.append(card);
    });
    loading = false;
  }

  async function createInvoice(event) {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('button[type="submit"]');
    const source = $("invoiceSource").value, selected = eligible.get(source);
    if (!selected) { $("invoiceStatus").textContent = "Choose an eligible accepted order or Studio quote."; return; }
    button.disabled = true;
    $("invoiceStatus").textContent = "Preparing invoice draft…";
    try {
      let customer, sourceId, orderId = null, studioQuoteId = null, lines = [], subtotal = 0, total = 0, billing = {};
      if (selected.type === "order") {
        const order = selected.record;
        customer = {name:order.customer_name,email:order.customer_email,phone:order.customer_phone};
        sourceId = order.id; orderId = order.id; billing = order.shipping_address || {};
        const result = await adminSupabase.from("order_items").select("product_name_snapshot,quantity,unit_price_minor,line_total_minor").eq("order_id",order.id).order("created_at");
        if (result.error) throw result.error;
        lines = (result.data || []).map((x,i) => ({description:x.product_name_snapshot,quantity:x.quantity,unit_amount_minor:x.unit_price_minor,line_total_minor:x.line_total_minor,sort_order:i}));
        subtotal = Number(order.items_subtotal_minor || lines.reduce((s,x)=>s+Number(x.line_total_minor),0));
        const shipping = Number(order.shipping_amount_minor || 0);
        if (shipping > 0) lines.push({description:"Delivery / shipping",quantity:1,unit_amount_minor:shipping,line_total_minor:shipping,sort_order:lines.length});
        total = Number(order.total_amount_minor || subtotal + shipping);
      } else {
        const quote = selected.record, enquiry = selected.enquiry;
        customer = {name:enquiry.customer_name,email:enquiry.customer_email,phone:enquiry.customer_phone};
        sourceId = quote.id; studioQuoteId = quote.id;
        const result = await adminSupabase.from("studio_quote_lines").select("description,quantity,unit_amount_minor,line_total_minor").eq("quote_id",quote.id).order("sort_order");
        if (result.error) throw result.error;
        lines = (result.data || []).map((x,i) => ({...x,sort_order:i}));
        subtotal = Number(quote.subtotal_minor || lines.reduce((s,x)=>s+Number(x.line_total_minor),0));
        total = subtotal;
      }
      if (!customer?.name || !customer?.email) throw new Error("The linked record is missing the customer's name or email address.");
      if (!lines.length) throw new Error("This source has no itemised lines. Add the line items to the order or quote before invoicing.");
      const {data:{user},error:userError} = await adminSupabase.auth.getUser();
      if (userError || !user) throw new Error("Please sign in again.");
      const values = Object.fromEntries(new FormData(form));
      const {data:invoice,error} = await adminSupabase.from("invoices").insert({
        order_id:orderId,studio_quote_id:studioQuoteId,
        customer_name:customer.name,customer_email:customer.email,customer_phone:customer.phone || null,
        billing_address:billing,currency_code:"ZAR",subtotal_minor:subtotal,discount_minor:0,tax_minor:0,total_minor:total,amount_paid_minor:0,
        status:"draft",due_date:values.due_date || null,payment_terms:values.payment_terms || null,
        roadmap:values.roadmap || null,customer_message:values.customer_message || null,
        internal_note:values.internal_note || null,created_by:user.id
      }).select("*").single();
      if (error) throw error;
      const payload = lines.map(line => ({invoice_id:invoice.id,description:line.description,quantity:line.quantity,unit_amount_minor:line.unit_amount_minor,line_total_minor:line.line_total_minor,sort_order:line.sort_order}));
      const lineInsert = await adminSupabase.from("invoice_lines").insert(payload);
      if (lineInsert.error) throw new Error("Invoice draft was created, but its line items could not be saved: " + lineInsert.error.message);
      $("invoiceStatus").textContent = "Draft " + invoice.invoice_reference + " saved. Print it for review, then mark it issued only after sending it to the customer.";
      form.reset();
      await Promise.all([loadInvoices(),loadInvoiceOptions()]);
    } catch (error) {
      $("invoiceStatus").textContent = error.message || "Invoice could not be saved.";
    } finally { button.disabled = false; }
  }

  async function markIssued(invoice) {
    if (!confirm("Confirm that " + invoice.invoice_reference + " has actually been sent to the customer?")) return;
    const today = new Date().toISOString().slice(0,10);
    const {error} = await adminSupabase.from("invoices").update({status:"issued",issue_date:today,issued_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",invoice.id).eq("status","draft");
    if (error) alert("Could not mark invoice as issued: " + error.message);
    await loadInvoices();
  }

  async function recordPayment(invoice) {
    const amountText = prompt("Payment amount received in rand (example: 250.00):");
    if (amountText === null) return;
    const amount = Number(amountText.replace(",","."));
    if (!Number.isFinite(amount) || amount <= 0) { alert("Enter a valid payment amount greater than zero."); return; }
    const methodText = prompt("Payment method: EFT, YOCO or OTHER","EFT");
    if (methodText === null) return;
    const method = methodText.trim().toLowerCase();
    if (!["eft","yoco","other"].includes(method)) { alert("Choose EFT, YOCO or OTHER."); return; }
    const reference = prompt("Payment reference (optional):","") || null;
    const {data:{user}} = await adminSupabase.auth.getUser();
    const {error} = await adminSupabase.from("invoice_payment_records").insert({
      invoice_id:invoice.id,amount_minor:Math.round(amount*100),method,status:"pending",
      payment_reference:reference,recorded_by:user?.id || null
    });
    if (error) alert("Payment record could not be saved: " + error.message);
    else alert("Payment recorded as PENDING. Verify the funds in the bank or payment provider before confirming it.");
    await loadInvoices();
  }

  async function verifyPayment(invoice,payment) {
    if (!confirm("Have you checked the bank statement or payment provider and confirmed this money was received?")) return;
    const {data:{user}} = await adminSupabase.auth.getUser();
    const {error} = await adminSupabase.from("invoice_payment_records").update({
      status:"verified",verified_by:user?.id || null,verified_at:new Date().toISOString(),updated_at:new Date().toISOString()
    }).eq("id",payment.id).eq("status","pending");
    if (error) { alert("Payment verification failed: " + error.message); return; }
    const {data:verified,error:sumError} = await adminSupabase.from("invoice_payment_records").select("amount_minor").eq("invoice_id",invoice.id).eq("status","verified");
    if (sumError) { alert("Payment verified, but invoice balance could not be recalculated. Please refresh and review."); return; }
    const paid = (verified || []).reduce((sum,p)=>sum+Number(p.amount_minor||0),0);
    const status = paid >= Number(invoice.total_minor) ? "paid" : paid > 0 ? "partially_paid" : "issued";
    const update = await adminSupabase.from("invoices").update({
      amount_paid_minor:paid,status,paid_at:status==="paid"?new Date().toISOString():null,updated_at:new Date().toISOString()
    }).eq("id",invoice.id);
    if (update.error) alert("Payment verified but invoice totals could not be updated: " + update.error.message);
    await loadInvoices();
  }

  function printInvoice(invoice,lines,payments) {
    const w = window.open("","_blank","noopener,noreferrer");
    if (!w) { alert("Allow pop-ups for this site to print the invoice."); return; }
    const lineRows = lines.map(line => "<tr><td>"+esc(line.description)+"</td><td>"+esc(line.quantity)+"</td><td>"+money(line.unit_amount_minor)+"</td><td>"+money(line.line_total_minor)+"</td></tr>").join("");
    const paid = Number(invoice.amount_paid_minor||0), balance = Math.max(0,Number(invoice.total_minor)-paid);
    const address = invoice.billing_address && typeof invoice.billing_address === "object" ? Object.values(invoice.billing_address).filter(Boolean).join(", ") : "";
    w.document.write("<!doctype html><html><head><meta charset='utf-8'><title>"+esc(invoice.invoice_reference)+"</title><style>body{font:14px Arial;color:#211b12;margin:36px}h1,h2{font-family:Georgia;font-weight:normal}header{border-bottom:2px solid #c9a44c;padding-bottom:18px;margin-bottom:24px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}th{background:#f3efe6}.total{text-align:right;font-size:18px}.muted{color:#666;white-space:pre-wrap}.internal{display:none}@media print{body{margin:15mm}}</style></head><body><header><h1>Elaine's Jewellery Box</h1><p>INVOICE · "+esc(invoice.status.toUpperCase())+"</p><strong>"+esc(invoice.invoice_reference)+"</strong></header><div class='meta'><div><strong>Bill to</strong><p>"+esc(invoice.customer_name)+"<br>"+esc(invoice.customer_email)+"<br>"+esc(invoice.customer_phone||"")+"<br>"+esc(address)+"</p></div><div><strong>Invoice details</strong><p>Issued: "+esc(invoice.issue_date||"Draft") +"<br>Due: "+esc(invoice.due_date||"Not set")+"</p></div></div><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>"+lineRows+"</tbody></table><p class='total'>Subtotal: "+money(invoice.subtotal_minor)+"<br>Discount: "+money(invoice.discount_minor)+"<br>Tax: "+money(invoice.tax_minor)+"<br><strong>Total: "+money(invoice.total_minor)+"</strong><br>Paid: "+money(paid)+"<br><strong>Balance due: "+money(balance)+"</strong></p><h2>Payment terms</h2><p class='muted'>"+esc(invoice.payment_terms||"Please contact Elaine for payment arrangements.")+"</p><h2>Roadmap / next steps</h2><p class='muted'>"+esc(invoice.roadmap||"Please contact Elaine to confirm the next steps.")+"</p><p class='muted'>"+esc(invoice.customer_message||"")+"</p><p class='muted'>Payment records: "+payments.map(p=>esc(p.method+" "+money(p.amount_minor)+" "+p.status)).join(" · ")+"</p><script>window.onload=()=>window.print()<\/script></body></html>");
    w.document.close();
  }

  $("invoiceForm")?.addEventListener("submit",createInvoice);
  const priorVerifyStaff = verifyStaff;
  verifyStaff = async function() {
    const ok = await priorVerifyStaff();
    if (ok) { await loadInvoiceOptions(); await loadInvoices(); }
    return ok;
  };
})();