const fs = require("fs"),
  { fixture } = require("../postgres/fx_fixture.cjs"),
  { chromium } = require("playwright");
(async () => {
  let f, b;
  const results = [],
    errors = [];
  try {
    f = await fixture();
    await f.db
      .prepare("UPDATE users SET preferred_language='en' WHERE id=1")
      .run();
    const units = await f.db.prepare("SELECT * FROM business_units").all(),
      mimi = units.find((x) => x.name.startsWith("MIMI")).id,
      mango = units.find((x) => x.name.includes("Mango")).id;
    const exSupplier = await f.ins("excavator_suppliers", {
        business_unit_id: f.excavator,
        name: "Review Equipment Supplier",
        location: "Seoul",
      }),
      exBuyer = await f.ins("excavator_buyers", {
        business_unit_id: f.excavator,
        name: "Review Equipment Buyer",
        country: "South Korea",
        buyer_type: "Local",
      }),
      machine = await f.ins("excavator_assets", {
        business_unit_id: f.excavator,
        asset_no: "REVIEW-001",
        machine_name: "Review Excavator",
        make: "Hyundai",
        model: "HX220",
        supplier_id: exSupplier,
        purchase_price: 50000000,
        status: "Available",
      }),
      employee = await f.ins("employees", {
        employee_no: "REVIEW-EMP",
        name: "Review Employee",
        user_id: 1,
        business_unit_id: f.pink,
      }),
      task = await f.ins("tasks", {
        title: "Review outstanding customer payment",
        owner_id: 1,
        business_unit_id: f.pink,
        created_by: 1,
      }),
      meeting = await f.ins("meetings", {
        title: "Review operations meeting",
        organizer_id: 1,
        business_unit_id: f.pink,
        meeting_date: "2026-11-08",
        status: "Scheduled",
      });
    await f.ins("meeting_business_units", {
      meeting_id: meeting,
      business_unit_id: f.pink,
    });
    await f.ins("documents", {
      business_unit_id: f.pink,
      title: "Review supplier document",
      category: "Other",
      uploaded_by: 1,
      file_path: "",
    });
    b = await chromium.launch({
      executablePath: process.env.BOM_CHROMIUM || chromium.executablePath(),
      args: [
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
        "--disable-dev-shm-usage",
      ],
    });
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    p.setDefaultTimeout(10000);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript((token) => {
      localStorage.setItem("bo_token", token);
      localStorage.setItem("bo_language", "en");
    }, f.login.token);
    const cases = [
      ["dashboard-all", "dashboard", "all"],
      ["dashboard-pink", "dashboard", f.pink],
      ["dashboard-excavator", "dashboard", f.excavator],
      ["dashboard-mimi", "dashboard", mimi],
      ["dashboard-mango", "dashboard", mango],
      ...[
        "businesses",
        "finance",
        "accounting",
        "approvals",
        "tasks",
        "performance",
        "reports",
        "documents",
        "meetings",
        "notifications",
        "users",
        "profile",
        "audit",
        "systemSettings",
        "payroll",
      ].map((v) => [v, v, "all"]),
      ...["sales", "purchases", "inventory"].map((v) => [v, v, mango]),
      ...["excavator", "excavatorSuppliers", "excavatorBuyers"].map((v) => [
        v,
        v,
        f.excavator,
      ]),
      ...["restaurant", "restaurantTables"].map((v) => [v, v, mimi]),
      ...[
        "psSuppliers",
        "psImports",
        "psRawStock",
        "warehouses",
        "psPackaging",
        "psProduction",
        "psFinished",
        "psSales",
        "psCustomers",
        "psWaste",
        "psCommerce",
      ].map((v) => [v, v, f.pink]),
      ["import-detail", "psImports/import/" + f.imports[1], f.pink],
      ["supplier-detail", "psSuppliers/supplier/" + f.supplier, f.pink],
      ["customer-detail", "psCustomers/customer/" + f.customer, f.pink],
      ["order-detail", "psSales/order/" + f.order, f.pink],
      ["machine-detail", "excavator/machine/" + machine, f.excavator],
      ["employee-detail", "payroll/employee/" + employee, f.pink],
      ["accounting-control", "accounting/control", f.pink],
      ["new-sale", "psSales/new", f.pink],
      ["new-production", "psProduction/new", f.pink],
      ["new-pack-purchase", "psPackaging/new", f.pink],
    ];
    async function capture(c, width = 1440, lang = "en") {
      const [key, path, unit] = c;
      await p.setViewportSize({ width, height: 1000 });
      await p.goto(f.base + "/#" + path + "?unit=" + unit);
      await p
        .waitForFunction(
          () =>
            window.BOMRouter?.diagnostics().phase === "ready" ||
            !!document.querySelector("[data-bom-route-error]"),
          { timeout: 20000 },
        )
        .catch(() => {});
      await p.evaluate((l) => setLanguage(l), lang);
      await p.waitForFunction((l) => currentLanguage === l, lang);
      await p.waitForTimeout(200);
      if (width < 700) await p.evaluate(() => window.closeMobileSidebar?.());
      const d = await p.evaluate(() => {
        const c = document.getElementById("content"),
          visible = (e) =>
            e.getClientRects().length &&
            getComputedStyle(e).visibility !== "hidden";
        return {
          url: location.hash,
          phase: window.BOMRouter?.diagnostics().phase,
          headings: [...c.querySelectorAll("h1,h2,h3")].map((x) =>
            x.textContent.trim(),
          ),
          text: c.innerText.slice(0, 11000),
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          buttons: [...c.querySelectorAll("button")]
            .filter(visible)
            .map((x) => ({
              text: x.textContent.trim(),
              h: Math.round(x.getBoundingClientRect().height),
              primary: x.classList.contains("primary"),
            })),
          controls: [...c.querySelectorAll("input,select,textarea")]
            .filter(visible)
            .map((x) => ({
              tag: x.tagName,
              name: x.name || x.id,
              h: Math.round(x.getBoundingClientRect().height),
              label: !!(x.labels?.length || x.getAttribute("aria-label")),
            })),
          summaries: [...c.querySelectorAll(".bom-record-summary")]
            .filter(visible)
            .map((n) => ({
              items: n.children.length,
              rows: new Set(
                [...n.children]
                  .filter(visible)
                  .map((el) => Math.round(el.getBoundingClientRect().top)),
              ).size,
            })),
          filters: [...c.querySelectorAll(".bom-record-filters")]
            .filter(visible)
            .map((n) => ({
              count: n.children.length,
              wrap: getComputedStyle(n).flexWrap,
            })),
          tables: [...c.querySelectorAll("table")].map((x) => ({
            bootstrap:
              x.classList.contains("bom-record-table") &&
              x.classList.contains("table"),
            cols: x.querySelectorAll("tr:first-child th").length,
            rows: x.rows.length,
            scroll: x.scrollWidth,
            client: x.clientWidth,
          })),
          cards: c.querySelectorAll(".card,.ps-kpi,.stat").length,
          font: getComputedStyle(c).fontFamily,
        };
      });
      if (
        process.env.BOM_UI_SCREENSHOTS &&
        ["psImports", "finance", "psPackaging", "accounting-control"].includes(
          key,
        )
      ) {
        fs.mkdirSync(process.env.BOM_UI_SCREENSHOTS, { recursive: true });
        await p.screenshot({
          path:
            process.env.BOM_UI_SCREENSHOTS +
            "/" +
            key +
            "-" +
            width +
            "-" +
            lang +
            ".png",
          fullPage: true,
        });
      }
      if (d.tables.some((table) => !table.bootstrap))
        errors.push(key + " missing shared table styling");
      if (width >= 1000 && d.summaries.some((summary) => summary.rows > 1))
        errors.push(key + " summary cards wrapped on desktop");
      if (width >= 1000 && d.filters.some((row) => row.wrap !== "nowrap"))
        errors.push(key + " filters wrapped on desktop");
      if (width === 390) {
        const small = d.buttons.filter((b) => b.h > 0 && b.h < 43.5);
        if (small.length)
          errors.push(
            key +
              " " +
              lang +
              " undersized mobile actions: " +
              JSON.stringify(small),
          );
      }
      delete d.text;
      results.push({ key, width, lang, ...d });
      console.log(
        key,
        width,
        d.phase,
        d.headings.slice(0, 2).join(" / "),
        d.overflow ? "OVERFLOW" : "",
      );
    }
    for (const lang of ["en", "ko"])
      for (const width of [1440, 820, 390]) {
        await f.db
          .prepare("UPDATE users SET preferred_language=? WHERE id=1")
          .run(lang);
        for (const c of cases) {
          try {
            await capture(c, width, lang);
          } catch (e) {
            errors.push(c[0] + " " + width + " " + lang + ": " + e.message);
          }
        }
      }
    fs.writeFileSync(
      "qa/evidence/ui708-matrix.json",
      JSON.stringify(
        {
          version: require("../../package.json").version,
          results,
          errors,
          tested_at: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    if (errors.length || results.some((x) => x.phase !== "ready" || x.overflow))
      throw Error("UI matrix has failed screens");
    console.log("DONE", results.length, "screens", errors.length, "errors");
  } finally {
    await b?.close();
    await f?.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
