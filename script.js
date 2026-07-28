"use strict";

const navbar    = document.getElementById("navbar");
const sections  = document.querySelectorAll("section[id]");
const navLinks  = document.querySelectorAll(".nav-links a");
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 50);
  backToTop.classList.toggle("visible", window.scrollY > 500);
  let current = "";
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 110) current = s.id; });
  navLinks.forEach(a => { a.classList.toggle("active", a.getAttribute("href") === "#" + current); });
}, { passive: true });

const hamburger = document.getElementById("hamburger");
const navMenu   = document.getElementById("navLinks");
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navMenu.classList.toggle("open");
});
navMenu.querySelectorAll("a").forEach(l => l.addEventListener("click", () => {
  hamburger.classList.remove("open");
  navMenu.classList.remove("open");
}));

backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const step = target / (1800 / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { el.textContent = target.toLocaleString("en-IN"); clearInterval(timer); }
    else { el.textContent = Math.floor(current).toLocaleString("en-IN"); }
  }, 16);
}

const statsEl = document.querySelector(".stats-ribbon");
if (statsEl) {
  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(".rs-num").forEach(animateCount);
      }
    });
  }, { threshold: 0.4 }).observe(statsEl);
}

const revealEls = document.querySelectorAll(".why-card,.service-card,.fleet-card,.pricing-card,.testi-card,.cp-item");
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity   = "1";
        entry.target.style.transform = "translateY(0)";
      }, (entry.target.dataset.delay || 0) * 1000);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach((el, i) => {
  el.style.opacity    = "0";
  el.style.transform  = "translateY(24px)";
  el.style.transition = "opacity .6s ease, transform .6s ease";
  el.dataset.delay    = (i % 6) * 0.08;
  revealObs.observe(el);
});

const quickForm = document.getElementById("quickForm");
if (quickForm) {
  quickForm.addEventListener("submit", e => {
    e.preventDefault();
    document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  });
}

// ── OWNER EMAIL — set in .env as EMAIL_TO (server.js reads it) ───────────

const contactForm = document.getElementById("contactForm");
const formNote    = document.getElementById("formNote");
if (contactForm) {
  contactForm.addEventListener("submit", async e => {
    e.preventDefault();

    // ── Validate ────────────────────────────────────────────────────────
    const name   = contactForm.querySelector("[name='name']").value.trim();
    const phone  = contactForm.querySelector("[name='phone']").value.trim();
    const pickup = contactForm.querySelector("[name='pickup']").value.trim();
    const drop   = contactForm.querySelector("[name='drop']").value.trim();
    const date   = contactForm.querySelector("[name='date']").value;

    if (!name || !phone || !pickup || !drop || !date) {
      formNote.textContent = "Please fill in all required fields.";
      formNote.className = "form-feedback error"; return;
    }
    if (!/^\+?[\d\s\-]{7,15}$/.test(phone)) {
      formNote.textContent = "Please enter a valid phone number.";
      formNote.className = "form-feedback error"; return;
    }

    // ── Submit to our own /submit endpoint (no CORS, no third-party) ────
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Sending...";
    formNote.textContent = "";
    formNote.className = "form-feedback";

    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";

    try {
      let ok = false;

      if (isLocal) {
        // ── Local dev: POST JSON to Node server ──────────────────────────
        const data = {
          name, phone,
          email:   contactForm.querySelector("[name='email']").value.trim(),
          pickup,  drop,
          vehicle: contactForm.querySelector("[name='vehicle']").value,
          date,
          message: contactForm.querySelector("[name='message']").value.trim(),
        };
        const res  = await fetch("/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        ok = json.ok;
      } else {
        // ── Netlify: POST form-encoded to Netlify Forms ───────────────────
        const formData = new FormData(contactForm);
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(formData).toString(),
        });
        ok = res.ok;
      }

      if (ok) {
        formNote.textContent = "Booking request sent! We will confirm within 30 minutes.";
        formNote.className = "form-feedback success";
        contactForm.reset();
      } else {
        formNote.textContent = "Something went wrong. Please call +91 98765 43210.";
        formNote.className = "form-feedback error";
      }
    } catch {
      formNote.textContent = "Something went wrong. Please call +91 98765 43210.";
      formNote.className = "form-feedback error";
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit Booking Request";
    }
  });
}

window.dispatchEvent(new Event("scroll"));
