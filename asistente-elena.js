(function () {
  const API_URL = "https://asistente-elenal.terapeutaelenasibaja.workers.dev/chat";

  const css = `
    #elena-assistant-button {
      position: fixed; right: 18px; bottom: 18px; z-index: 99999;
      background: #b5121b; color: white; border: 0; border-radius: 999px;
      padding: 14px 18px; font: 600 15px Arial, sans-serif;
      box-shadow: 0 4px 18px #0003; cursor: pointer;
    }
    #elena-assistant-panel {
      position: fixed; right: 16px; bottom: 78px; z-index: 99999;
      width: min(380px, calc(100vw - 32px)); height: min(620px, 78vh);
      display: none; flex-direction: column; background: #fff; color: #161616;
      border: 1px solid #ddd; border-radius: 16px;
      box-shadow: 0 8px 32px #0003; font: 15px/1.45 Arial, sans-serif;
      overflow: hidden;
    }
    #elena-assistant-panel * { box-sizing: border-box; }
    #elena-assistant-head {
      background: #171717; color: white; padding: 14px 16px;
      display: flex; justify-content: space-between; align-items: center;
    }
    #elena-assistant-head strong { font-size: 16px; }
    #elena-assistant-close {
      background: transparent; color: white; border: 0;
      font-size: 23px; cursor: pointer;
    }
    #elena-assistant-body { padding: 15px; overflow-y: auto; flex: 1; }
    #elena-assistant-choices { display: grid; gap: 8px; margin: 12px 0; }
    #elena-assistant-choices button {
      background: white; border: 1px solid #b5121b; color: #171717;
      border-radius: 9px; text-align: left; padding: 10px 12px;
      font: inherit; cursor: pointer;
    }
    #elena-assistant-choices button:hover { background: #fff3f3; }
    #elena-assistant-messages { display: grid; gap: 10px; margin: 12px 0; }
    .elena-message {
      padding: 10px 12px; border-radius: 10px;
      white-space: pre-wrap; overflow-wrap: anywhere;
    }
    .elena-message.user { background: #f2f2f2; margin-left: 18px; }
    .elena-message.assistant {
      background: #fff5f5; border-left: 3px solid #b5121b;
      margin-right: 12px;
    }
    #elena-assistant-form {
      display: flex; gap: 8px; padding: 12px;
      border-top: 1px solid #ddd;
    }
    #elena-assistant-input {
      min-width: 0; flex: 1; border: 1px solid #bbb;
      border-radius: 9px; padding: 10px; font: inherit;
    }
    #elena-assistant-send {
      background: #b5121b; color: white; border: 0;
      border-radius: 9px; padding: 10px 13px;
      font: 600 14px Arial, sans-serif; cursor: pointer;
    }
    #elena-assistant-send:disabled { opacity: .55; }
    #elena-assistant-note {
      font-size: 12px; color: #555; padding: 0 15px 10px;
    }
    #elena-assistant-whatsapp {
      display: inline-block; background: #b5121b; color: white;
      text-decoration: none; padding: 10px 13px;
      border-radius: 8px; margin-top: 4px; font-weight: 700;
    }
    @media (max-width: 480px) {
      #elena-assistant-panel {
        right: 8px; bottom: 72px; width: calc(100vw - 16px);
        height: min(640px, 80vh);
      }
      #elena-assistant-button { right: 12px; bottom: 12px; }
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const panel = document.createElement("section");
  panel.id = "elena-assistant-panel";
  panel.setAttribute("aria-label", "Asistente virtual Elena Sibaja");

  panel.innerHTML = `
    <div id="elena-assistant-head">
      <strong>Asistente · Elena Sibaja</strong>
      <button id="elena-assistant-close" type="button" aria-label="Cerrar">×</button>
    </div>
    <div id="elena-assistant-body">
      <p>¡Hola! Soy el asistente virtual de Elena Sibaja.
      Puedo orientarte sobre lenguaje, comunicación, desarrollo infantil,
      servicios y recursos.</p>
      <div id="elena-assistant-choices"></div>
      <div id="elena-assistant-messages" aria-live="polite"></div>
    </div>
    <div id="elena-assistant-note">
      La información es general y no sustituye una valoración profesional.
    </div>
    <form id="elena-assistant-form">
      <input id="elena-assistant-input" type="text" maxlength="1500"
        placeholder="Escribe tu pregunta..." aria-label="Escribe tu pregunta"
        required>
      <button id="elena-assistant-send" type="submit">Enviar</button>
    </form>
  `;

  const toggle = document.createElement("button");
  toggle.id = "elena-assistant-button";
  toggle.type = "button";
  toggle.textContent = "¿Te puedo orientar?";
  toggle.setAttribute("aria-expanded", "false");

  document.body.appendChild(panel);
  document.body.appendChild(toggle);

  const choices = panel.querySelector("#elena-assistant-choices");
  const messagesBox = panel.querySelector("#elena-assistant-messages");
  const form = panel.querySelector("#elena-assistant-form");
  const input = panel.querySelector("#elena-assistant-input");
  const send = panel.querySelector("#elena-assistant-send");
  const body = panel.querySelector("#elena-assistant-body");

  const history = [];

  const questions = [
    "Conocer los servicios de Elena",
    "¿Cómo es una valoración de lenguaje?",
    "¿Cuándo conviene consultar por el lenguaje?",
    "Conocer las guías y recursos digitales"
  ];

  function addMessage(role, text) {
    const message = document.createElement("div");
    message.className = "elena-message " + role;
    message.textContent = text;
    messagesBox.appendChild(message);
    body.scrollTop = body.scrollHeight;
  }

  function addWhatsAppLink() {
    const link = document.createElement("a");
    link.id = "elena-assistant-whatsapp";
    link.href =
      "https://wa.me/525585185289?text=" +
      encodeURIComponent(
        "Hola, Elena. Encontré tu página web y quisiera información sobre tus servicios de fonoaudiología."
      );
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Escribir por WhatsApp";
    messagesBox.appendChild(link);
  }

  async function askAssistant(text) {
    text = text.trim();

    if (!text || send.disabled) return;

    choices.style.display = "none";
    input.value = "";

    addMessage("user", text);
    history.push({ role: "user", content: text });

    send.disabled = true;
    send.textContent = "...";

    const pending = document.createElement("div");
    pending.className = "elena-message assistant";
    pending.textContent = "Estoy preparando la respuesta...";
    messagesBox.appendChild(pending);
    body.scrollTop = body.scrollHeight;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) })
      });

      const data = await response.json();
      pending.remove();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo obtener respuesta.");
      }

      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : "No pude generar una respuesta. Inténtalo nuevamente.";

      history.push({ role: "assistant", content: reply });
      addMessage("assistant", reply);
    } catch (error) {
      pending.remove();
      addMessage(
        "assistant",
        "No pude conectarme en este momento. Puedes escribir directamente a Elena por WhatsApp."
      );
      addWhatsAppLink();
    } finally {
      send.disabled = false;
      send.textContent = "Enviar";
      input.focus();
    }
  }

  questions.forEach(function (question) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = question;
    button.addEventListener("click", function () {
      askAssistant(question);
    });
    choices.appendChild(button);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    askAssistant(input.value);
  });

  toggle.addEventListener("click", function () {
    const isOpen = panel.style.display === "flex";
    panel.style.display = isOpen ? "none" : "flex";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    if (!isOpen) input.focus();
  });

  panel.querySelector("#elena-assistant-close").addEventListener("click", function () {
    panel.style.display = "none";
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  });
})();
