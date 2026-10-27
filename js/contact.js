/* ==========================================================================
   Local Sole — contact.js
   Contact form validation, demo message storage and a friendly success state.
   ========================================================================== */

window.LS = window.LS || {};

(() => {
  const MESSAGES_KEY = "ls_messages_v1";
  const esc = (value) => LS.ui.escapeHtml(String(value ?? ""));
  const byId = (id) => document.getElementById(id);

  function setError(id, message) {
    const field = byId(id)?.closest(".field");
    const error = byId(`${id}-error`);
    if (field) field.classList.toggle("has-error", Boolean(message));
    if (error) error.textContent = message || "";
    const input = byId(id);
    if (input) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
    return !message;
  }

  function clearErrors() {
    ["contactName", "contactEmail", "contactPhone", "contactOrder", "contactMessage"].forEach((id) => setError(id, ""));
    const consentError = byId("contactConsent-error");
    if (consentError) consentError.textContent = "";
  }

  function prefill() {
    const profile = LS.ui.store("ls_profile_v1", null);
    if (!profile) return;
    if (byId("contactName") && !byId("contactName").value) {
      byId("contactName").value = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
    }
    if (byId("contactEmail") && !byId("contactEmail").value) byId("contactEmail").value = profile.email || "";
    if (byId("contactPhone") && !byId("contactPhone").value) byId("contactPhone").value = profile.phone || "";
  }

  function successHtml(message) {
    return `<div class="confirmation-hero" style="padding-block:10px 20px">
      <div class="confirmation-icon">${LS.ui.icon("check", 32)}</div>
      <h2 style="font-size:clamp(1.8rem,3vw,2.4rem)">Message received<span class="text-accent">.</span></h2>
      <p>Thanks, ${esc(message.name.split(" ")[0])}. We've routed this to the right shop and will reply to <strong>${esc(message.email)}</strong> within one working day.</p>
      <span class="order-number">${esc(message.ref)}</span>
    </div>
    <div class="confirmation-card" style="margin-top:0">
      <h2>What happens next</h2>
      <div class="review-block">
        <div class="review-block-head"><strong>Fit or product question</strong></div>
        <p>A shop team member reads it, checks stock in your size and replies personally. If it's urgent, call <a href="tel:+918041238890">+91 80 4123 8890</a>.</p>
      </div>
      <div class="review-block" style="border-bottom:0">
        <div class="review-block-head"><strong>Keep exploring</strong></div>
        <p>Your message is saved on this device for the demo. Nothing was sent to a server.</p>
      </div>
      <div class="row wrap mt-3">
        <a class="btn btn-primary btn-sm" href="products.html">Browse the edit</a>
        <button class="btn btn-outline btn-sm" type="button" id="sendAnotherMessage">Send another message</button>
      </div>
    </div>`;
  }

  function submit(event) {
    event.preventDefault();
    clearErrors();

    const name = byId("contactName").value.trim();
    const email = byId("contactEmail").value.trim();
    const phone = byId("contactPhone").value.trim();
    const topic = byId("contactTopic").value;
    const order = byId("contactOrder").value.trim();
    const body = byId("contactMessage").value.trim();
    const consent = byId("contactConsent").checked;

    let firstInvalid = null;
    const fail = (id, message) => {
      setError(id, message);
      firstInvalid = firstInvalid || byId(id);
    };

    if (name.length < 2) fail("contactName", "Please tell us your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail("contactEmail", "Enter a valid email so we can reply.");
    if (phone && !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""))) fail("contactPhone", "That mobile number doesn't look right.");
    if (order && !/^LS-\d{8}-\d{3,5}$/i.test(order)) fail("contactOrder", "Order numbers look like LS-20261021-1234.");
    if (body.length < 10) fail("contactMessage", "A little more detail helps us help you.");
    if (!consent) {
      const error = byId("contactConsent-error");
      if (error) error.textContent = "Please tick the box so we can reply.";
      firstInvalid = firstInvalid || byId("contactConsent");
    }

    if (firstInvalid) {
      firstInvalid.focus();
      LS.ui.announce("Please check the highlighted fields.");
      return;
    }

    const message = {
      ref: `MSG-${Date.now().toString(36).toUpperCase()}`,
      name,
      email,
      phone,
      topic,
      order,
      message: body,
      createdAt: new Date().toISOString()
    };
    const saved = LS.ui.store(MESSAGES_KEY, []);
    saved.unshift(message);
    LS.ui.save(MESSAGES_KEY, saved.slice(0, 30));

    const mount = byId("contactFormMount");
    const success = byId("contactSuccess");
    if (mount) mount.hidden = true;
    if (success) {
      success.hidden = false;
      success.innerHTML = successHtml(message);
      success.scrollIntoView({ behavior: "smooth", block: "start" });
      byId("sendAnotherMessage")?.addEventListener("click", resetForm);
    }
    LS.ui.toast({ title: "Message sent", message: "We'll be in touch within one working day.", type: "success" });
  }

  function resetForm() {
    const mount = byId("contactFormMount");
    const success = byId("contactSuccess");
    if (mount) mount.hidden = false;
    if (success) {
      success.hidden = true;
      success.innerHTML = "";
    }
    document.getElementById("contactForm")?.reset();
    const profile = LS.ui.store("ls_profile_v1", null);
    if (profile) {
      if (byId("contactName")) byId("contactName").value = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
      if (byId("contactEmail")) byId("contactEmail").value = profile.email || "";
      if (byId("contactPhone")) byId("contactPhone").value = profile.phone || "";
    }
    clearErrors();
    byId("contactName")?.focus();
  }

  function init() {
    const form = byId("contactForm");
    if (!form) return;
    prefill();
    const topic = LS.ui.getParam("topic");
    if (topic && byId("contactTopic")) byId("contactTopic").value = topic;

    form.addEventListener("submit", submit);

    form.addEventListener("input", (event) => {
      const id = event.target.id;
      if (id.endsWith("-error")) return;
      setError(id, "");
      if (id === "contactConsent") {
        const error = byId("contactConsent-error");
        if (error) error.textContent = "";
      }
    });

    form.addEventListener("change", (event) => {
      if (event.target.id === "contactConsent") {
        const error = byId("contactConsent-error");
        if (error) error.textContent = "";
      }
      if (event.target.id === "contactTopic" && event.target.value === "order" && !byId("contactOrder").value) {
        const lastOrder = LS.ui.store("ls_orders_v1", [])[0];
        if (lastOrder) byId("contactOrder").value = lastOrder.id;
      }
    });
  }

  LS.pages = LS.pages || {};
  LS.pages.contact = init;
})();
