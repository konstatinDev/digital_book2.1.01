// src/main.ts
// TypeScript für index.html (Frontend-only). Kompiliert zu main.js (ESModule).
// Verhalten:
// - GebindeNr select füllen (1..100000)
// - Arburg-Checkboxen: nur eine darf aktiv sein
// - Test-Auswahl + Button: hängt Auswahl an test_plus an (kommagetrennt)
// - Validierung aller Felder beim "Speichern"
// - Speicherung in localStorage unter key "proben" als JSON-Array
// - Tabelle (proben_ansicht .table_body) bei Save aktualisieren

type Probe = {
  id: number;
  material: string;
  charge: string;
  gebinde: string;
  gebindeNr: number;
  test: string; // kommagetrennte tests
  datum: string; // "YYYY-MM-DD HH:mm"
  user: string; // "Gast/Arburg1" oder "Gast/Arburg2"
  bemerkungen: string;
  auftrag: string;
};

document.addEventListener("DOMContentLoaded", () => {
  // Elemente
  const arburg1 = document.querySelector<HTMLInputElement>("#arburg1")!;
  const arburg2 = document.querySelector<HTMLInputElement>("#arburg2")!;
  const material = document.querySelector<HTMLInputElement>("#material")!;
  const charge = document.querySelector<HTMLInputElement>("#charge")!;
  const gebinde = document.querySelector<HTMLSelectElement>("#gebinde")!;
  const gebindeNr = document.querySelector<HTMLSelectElement>("#gebindeNr")!;
  const auftrag = document.querySelector<HTMLSelectElement>("#auftrag")!;
  const test_info = document.querySelector<HTMLSelectElement>("#test_info")!;
  const test_plus = document.querySelector<HTMLInputElement>("#test_plus")!;
  const plusBtn = document.querySelector<HTMLInputElement>('input[type="button"][value="+"]')!;
  const speichernBtn = document.querySelector<HTMLInputElement>('input[type="button"][value="Speichern"]')!;
  const suchenBtn = document.querySelector<HTMLInputElement>('input[type="button"][value="Suchen"]')!;
  const infoBtn = document.querySelector<HTMLInputElement>('input[type="button"][value="Information"]')!;
  const tableBody = document.querySelector<HTMLDivElement>("#tableBody")!;
  const probenNotes = document.querySelector<HTMLTextAreaElement>("#proben_notes")!;

  // --- Helfer ---
  const formatNow = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const loadProben = (): Probe[] => {
    try {
      const raw = localStorage.getItem("proben");
      return raw ? JSON.parse(raw) as Probe[] : [];
    } catch {
      return [];
    }
  };

  const saveProben = (arr: Probe[]) => {
    localStorage.setItem("proben", JSON.stringify(arr));
  };

  const nextId = (arr: Probe[]) => {
    if (arr.length === 0) return Date.now(); // fallback
    // choose max id + 1
    return Math.max(...arr.map(p => p.id)) + 1;
  };

  const renderTable = () => {
    const rows = loadProben();
    // Clear existing tableBody but keep the example rows already in HTML?
    // We'll prepend our dynamic rows above existing example rows to preserve design.
    // Implementation decision: remove previously rendered dynamic rows (mark them with data-generated)
    const existingGenerated = tableBody.querySelectorAll<HTMLDivElement>(".row[data-generated='true']");
    existingGenerated.forEach(r => r.remove());

    // Render rows in descending order (newest first)
    rows.slice().reverse().forEach(p => {
      const row = document.createElement("div");
      row.className = "row";
      row.setAttribute("data-generated", "true");

      const c = (cls: string, txt: string) => {
        const d = document.createElement("div");
        d.className = `cell ${cls}`;
        d.textContent = txt;
        return d;
      };

      row.appendChild(c("id", String(p.id)));
      row.appendChild(c("material", p.material));
      row.appendChild(c("charge", p.charge));
      row.appendChild(c("gebinde", p.gebinde));
      row.appendChild(c("gebindeNr", String(p.gebindeNr)));
      row.appendChild(c("test", p.test));
      row.appendChild(c("datum", p.datum));
      row.appendChild(c("user", p.user));
      row.appendChild(c("bemerkungen", p.bemerkungen));
      row.appendChild(c("auftrag", p.auftrag));

      // prepend so newest appear on top
      tableBody.prepend(row);
    });
  };

  // --- GebindeNr erzeugen (1..100000) ---
  // Warnung: 100k Optionen sind viel DOM. Wir füllen trotzdem weil du es so wünschst.
  // Alternative (performanter): number input mit datalist oder virtualisierte Auswahl.
  const FILL_COUNT = 100000;
  (function fillGebindeNr() {
    // remove any existing children
    gebindeNr.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= FILL_COUNT; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.text = String(i);
      frag.appendChild(opt);
    }
    gebindeNr.appendChild(frag);
  })();

  // --- Arburg Exclusivity (behave like radio but keep markup) ---
  [arburg1, arburg2].forEach(cb => {
    cb.addEventListener("change", () => {
      if (cb.checked) {
        if (cb === arburg1) arburg2.checked = false;
        else arburg1.checked = false;
      }
    });
  });

  // --- Plus Button: append selected test to test_plus (kommagetrennt) ---
  plusBtn.addEventListener("click", () => {
    const sel = test_info.value.trim();
    if (!sel) return;
    const current = test_plus.value.trim();
    // avoid duplicate consecutive entries
    const parts = current === "" ? [] : current.split(",").map(s => s.trim()).filter(Boolean);
    parts.push(sel);
    test_plus.value = parts.join(", ");
    test_plus.focus();
  });

  // --- Speichern (validieren, speichern, render) ---
  speichernBtn.addEventListener("click", () => {
    // Validierung: alle Felder müssen befüllt sein
    const errors: string[] = [];

    const arburgSelected = arburg1.checked || arburg2.checked;
    if (!arburgSelected) errors.push("Bitte wähle Arburg 1 oder Arburg 2.");

    if (!material.value.trim()) errors.push("Material darf nicht leer sein.");
    if (!charge.value.trim()) errors.push("Charge Nr darf nicht leer sein.");
    if (!gebinde.value.trim()) errors.push("Gebinde muss ausgewählt sein.");
    if (!gebindeNr.value.trim()) errors.push("Gebinde Nr muss ausgewählt sein.");
    if (!auftrag.value.trim()) errors.push("Auftrag muss ausgewählt sein.");
    if (!test_plus.value.trim()) errors.push("Bitte mindestens eine Prüfung auswählen (+ drücken).");

    if (errors.length > 0) {
      alert("Fehler:\n- " + errors.join("\n- "));
      return;
    }

    const arr = loadProben();
    const id = nextId(arr);
    const newProbe: Probe = {
      id,
      material: material.value.trim(),
      charge: charge.value.trim(),
      gebinde: gebinde.value,
      gebindeNr: parseInt(gebindeNr.value, 10),
      test: test_plus.value.trim(),
      datum: formatNow(),
      user: `Gast/${arburg1.checked ? "Arburg1" : "Arburg2"}`,
      bemerkungen: probenNotes.value.trim(),
      auftrag: auftrag.value,
    };

    arr.push(newProbe);
    saveProben(arr);

    // UI feedback: clear some fields (keep gebinde selection maybe)
    material.value = "";
    charge.value = "";
    // gebindeNr.select? keep selected? we'll reset to 1
    gebindeNr.selectedIndex = 0;
    test_plus.value = "";
    probenNotes.value = "";
    arburg1.checked = false;
    arburg2.checked = false;

    renderTable();
  });

  // --- Suchen / Information Buttons: einfache placeholders (kein spec gegeben) ---
  suchenBtn.addEventListener("click", () => {
    alert("Suchen: Noch nicht implementiert — gib Bescheid wenn du Suche nach Feld/Filter möchtest.");
  });

  infoBtn.addEventListener("click", () => {
    alert("Information: Implementiere hier zusätzliche Detail-Informationen oder Modals nach Bedarf.");
  });

  // Initial render (auch bestehende localStorage Einträge laden)
  renderTable();
});
