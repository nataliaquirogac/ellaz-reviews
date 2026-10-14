// Ellaz Reviews — backend en Google Sheets
// Pegar en Extensiones > Apps Script del Sheet, cambiar el PIN e Implementar como app web.

const PIN = "CAMBIA-ESTE-PIN"; // PIN para aprobar (solo tú lo sabes)
const SHEET = "estado";
const HEAD = ["ubicacion", "nombre", "estado", "nombre_en_google", "actualizado"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Evita que Sheets interprete textos como fórmulas (=, +, -, @)
function txt_(v) {
  v = String(v == null ? "" : v).slice(0, 120);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function rows_() {
  const v = sheet_().getDataRange().getValues();
  return v.slice(1).map(r => ({ loc: String(r[0]), name: String(r[1]), status: String(r[2]), google: String(r[3]) }));
}

function doGet() {
  return json_({ ok: true, rows: rows_() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.action === "check") return json_({ ok: b.pin === PIN });
    const loc = String(b.loc || ""), name = String(b.name || "");
    if (!loc || !name) return json_({ ok: false, error: "faltan datos" });

    let status;
    if (b.action === "submit") status = "revision";
    else {
      if (b.pin !== PIN) return json_({ ok: false, error: "PIN incorrecto" });
      if (b.action === "approve") status = "ok";
      else if (b.action === "reject") status = "pendiente";
      else return json_({ ok: false, error: "acción inválida" });
    }

    const sh = sheet_();
    const data = sh.getDataRange().getValues();
    let row = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === loc && String(data[i][1]) === name) { row = i + 1; break; }
    }
    // Una vez aprobada, solo el admin la puede cambiar
    if (b.action === "submit" && row > 0 && data[row - 1][2] === "ok") return json_({ ok: true, status: "ok" });

    const google = b.action === "submit" ? txt_(b.google) : (row > 0 ? txt_(data[row - 1][3]) : "");
    const values = [[txt_(loc), txt_(name), status, google, new Date()]];
    if (row > 0) sh.getRange(row, 1, 1, 5).setValues(values);
    else sh.appendRow(values[0]);
    return json_({ ok: true, status });
  } finally {
    lock.releaseLock();
  }
}
