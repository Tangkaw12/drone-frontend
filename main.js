(() => {
  const S = (sel) => document.querySelector(sel);
  const api = () => window.APP_CONFIG.API_BASE;
  const DRONE_ID = () => window.APP_CONFIG.DRONE_ID;
  let currentConfig = null;
  let currentPage = 1, totalPages = 1;

  // Nav
  const show = (id) => {
    ["#viewConfig","#viewForm","#viewLogs"].forEach(s => S(s).classList.add("hidden"));
    S(id).classList.remove("hidden");
  };
  S("#btnConfig").onclick = async () => { show("#viewConfig"); await loadConfig(); };
  S("#btnForm").onclick   = () => { show("#viewForm"); };
  S("#btnLogs").onclick   = async () => { show("#viewLogs"); await loadLogs(1); };

  // Load Config
  async function loadConfig() {
    setStatus("กำลังโหลด Config...");
    try {
      const res = await fetch(`${api()}/configs/${DRONE_ID()}`);
      if (!res.ok) throw new Error(await res.text());
      const cfg = await res.json();
      currentConfig = cfg;
      S("#configBox").textContent = JSON.stringify(cfg, null, 2);
      setStatus("โหลด Config สำเร็จ ✓");
    } catch (e) {
      setStatus("โหลด Config ล้มเหลว: " + e.message);
    }
  }

  // Submit Log
  S("#logForm").onsubmit = async (ev) => {
    ev.preventDefault();
    if (!currentConfig) { alert("กรุณาไปหน้า View Config ก่อน"); return; }
    const celsius = Number(S("#inpCelsius").value);
    if (Number.isNaN(celsius)) { alert("กรุณากรอกตัวเลข"); return; }
    try {
      setStatus("กำลังส่งข้อมูล...");
      const res = await fetch(`${api()}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drone_id: Number(currentConfig.drone_id),
          drone_name: currentConfig.drone_name,
          country: currentConfig.country,
          celsius
        })
      });
      if (!res.ok) throw new Error(await res.text());
      S("#inpCelsius").value = "";
      setStatus("ส่งข้อมูลสำเร็จ ✓");
      show("#viewLogs");
      await loadLogs(1);
    } catch (e) {
      setStatus("ส่งข้อมูลล้มเหลว: " + e.message);
    }
  };

  // Load Logs
  async function loadLogs(page=1) {
    setStatus("กำลังโหลด Logs...");
    try {
      const u = new URL(`${api()}/logs/${DRONE_ID()}`);
      u.searchParams.set("page", page);
      u.searchParams.set("perPage", 12);
      const res = await fetch(u);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      currentPage = data.page;
      totalPages = data.totalPages ?? 1;
      S("#logsTbody").innerHTML = (data.items || []).map(r => `
        <tr>
          <td>${r.created}</td>
          <td>${r.country}</td>
          <td>${r.drone_id}</td>
          <td>${r.drone_name}</td>
          <td>${r.celsius}</td>
        </tr>
      `).join("");
      S("#pageInfo").textContent = `Page ${currentPage} / ${totalPages}`;
      S("#prevBtn").disabled = currentPage <= 1;
      S("#nextBtn").disabled = currentPage >= totalPages;
      setStatus("");
    } catch (e) {
      setStatus("โหลด Logs ล้มเหลว: " + e.message);
    }
  }
  S("#prevBtn").onclick = () => loadLogs(currentPage - 1);
  S("#nextBtn").onclick = () => loadLogs(currentPage + 1);

  function setStatus(msg){ S("#status").textContent = msg; }

  // default open
  show("#viewConfig");
  // auto load config once
  loadConfig();
})();
