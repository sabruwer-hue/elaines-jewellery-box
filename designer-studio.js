(() => {
  const endpoint = "https://jakcqdeyvbbgdwctomdu.supabase.co/functions/v1/geranemo-public";
  const intake = "https://jakcqdeyvbbgdwctomdu.supabase.co/functions/v1/public-intake";
  const publicKey = "sb_publishable_-fWvxeQlGA1ocIVgxWguaA_5MUUo67-";
  const form = document.getElementById("designerForm");
  const quoteForm = document.getElementById("designerQuoteForm");
  if (!form || !quoteForm) return;
  const status = document.getElementById("designerStatus");
  const preview = document.getElementById("designerPreview");
  const resultBox = document.getElementById("designerResult");
  const download = document.getElementById("downloadDesign");
  const quoteStatus = document.getElementById("quoteStatus");
  let currentDesign = null;
  const post = async (url, payload) => {
    const response = await fetch(url, {method:"POST",headers:{"Content-Type":"application/json","apikey":publicKey},body:JSON.stringify(payload)});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || "The request could not be completed.");
    return data;
  };
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("generateDesign");
    const values = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    status.textContent = "Geranemo is preparing your visual concept. This can take a little while…";
    download.hidden = true;
    quoteForm.hidden = true;
    resultBox.hidden = true;
    currentDesign = null;
    try {
      const data = await post(endpoint, {action:"design",...values});
      currentDesign = {...values, preview_path:data.preview_path, preview_url:data.preview_url, concept_summary:data.concept_summary};
      preview.innerHTML = "";
      const image = document.createElement("img");
      image.src = data.preview_url;
      image.alt = "AI-generated design concept for " + values.item;
      preview.append(image);
      resultBox.textContent = data.concept_summary + " This is a concept image, not a production drawing.";
      resultBox.hidden = false;
      download.href = data.preview_url;
      download.hidden = false;
      quoteForm.hidden = false;
      status.textContent = "Your concept is ready. Refine the description and generate another, or send this one to Elaine.";
    } catch (error) {
      status.textContent = error.message || "The design service is temporarily unavailable.";
    } finally {
      button.disabled = false;
    }
  });
  quoteForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentDesign) return;
    const button = quoteForm.querySelector('button[type="submit"]');
    const values = Object.fromEntries(new FormData(quoteForm).entries());
    button.disabled = true;
    quoteStatus.textContent = "Sending your design securely to Elaine…";
    const vision = [
      "ELAINE'S DESIGNER STUDIO — AI CONCEPT ENQUIRY",
      "Department: " + currentDesign.department,
      "Item: " + currentDesign.item,
      "Style: " + (currentDesign.style || "Not specified"),
      "Materials/colours: " + (currentDesign.materials || "Not specified"),
      "Dimensions: " + (currentDesign.dimensions || "Not specified"),
      "Budget guidance: " + (currentDesign.budget || "Not specified"),
      "Customer brief: " + currentDesign.details,
      "AI concept summary: " + currentDesign.concept_summary,
      "Private preview storage path: " + currentDesign.preview_path,
      "Time-limited preview link (7 days): " + currentDesign.preview_url,
      "Customer confirms this is a quotation enquiry only, not a production order."
    ].join("\n");
    try {
      const data = await post(intake, {
        type:"studio_enquiry", source:"designer_studio", consent:values.consent === "on",
        name:values.name, email:values.email, phone:values.phone,
        item:"AI design concept — " + currentDesign.department + " — " + currentDesign.item,
        vision, website:""
      });
      quoteForm.reset();
      quoteStatus.textContent = "Thank you. Elaine has received your design enquiry. Your reference is " + data.reference + ". No order or payment has been created.";
    } catch (error) {
      quoteStatus.textContent = error.message || "We couldn't send your design. Please try again.";
    } finally {
      button.disabled = false;
    }
  });
})();