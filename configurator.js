// configurator.js — logika części i BOM
const THICKNESS = 18;
const GAP = 3;
const FRONT_LUZ = 4;
const HDF_MAT = "Płyta HDF 3 mm";
const HARDWARE_MAT = "Komponent / akcesoria";

function getItemTypeName(type) {
  switch (type) {
    case "bottom":
      return "Szafka dolna";
    case "top":
      return "Szafka górna";
    case "countertop":
      return "Blat";
    case "led":
      return "Profil LED";
    default:
      return "Element";
  }
}

function cabinetShellParts(item, bodyMat) {
  const { width: W, height: H, depth: D } = item.dimensions;
  const innerW = W - 2 * THICKNESS;
  const parts = [];

  if (item.type === "bottom") {
    parts.push({
      name: "Wieniec dolny",
      w: innerW,
      h: D,
      qty: 1,
      mat: bodyMat,
      edge: "1 × szer.",
    });
    parts.push({
      name: "Bok lewy",
      w: H,
      h: D,
      qty: 1,
      mat: bodyMat,
      edge: "2 × wys.",
    });
    parts.push({
      name: "Bok prawy",
      w: H,
      h: D,
      qty: 1,
      mat: bodyMat,
      edge: "2 × wys.",
    });
    parts.push({
      name: "Trawers górny",
      w: innerW,
      h: 100,
      qty: 2,
      mat: bodyMat,
      edge: "1 × szer.",
    });
    parts.push({
      name: "Płyta HDF (plecy)",
      w: innerW,
      h: H - THICKNESS,
      qty: 1,
      mat: HDF_MAT,
      edge: "brak",
    });
    parts.push({
      name: "Nóżka regulowana",
      w: "—",
      h: "—",
      qty: 4,
      mat: HARDWARE_MAT,
      edge: "—",
    });
  } else if (item.type === "top") {
    parts.push({
      name: "Bok lewy",
      w: H,
      h: D,
      qty: 1,
      mat: bodyMat,
      edge: "2 × wys.",
    });
    parts.push({
      name: "Bok prawy",
      w: H,
      h: D,
      qty: 1,
      mat: bodyMat,
      edge: "2 × wys.",
    });
    parts.push({
      name: "Wieniec dolny",
      w: innerW,
      h: D,
      qty: 1,
      mat: bodyMat,
      edge: "1 × szer.",
    });
    parts.push({
      name: "Wieniec górny",
      w: innerW,
      h: D,
      qty: 1,
      mat: bodyMat,
      edge: "1 × szer.",
    });
    parts.push({
      name: "Płyta HDF (plecy)",
      w: innerW,
      h: H - 2 * THICKNESS,
      qty: 1,
      mat: HDF_MAT,
      edge: "brak",
    });
  }

  return parts;
}

function drawerBoxParts(item, drawerIndex, drawerHeight, bodyMat, frontMat) {
  const { width: W, depth: D } = item.dimensions;
  const innerW = W - 2 * THICKNESS;
  const n = drawerIndex + 1;
  const ownSides = item.drawerOwnSides !== false;
  const boxDepth = D - 60;
  const boxHeight = Math.max(60, drawerHeight - 20);
  const parts = [];

  if (ownSides) {
    parts.push({
      name: `Szuflada ${n}: Bok lewy`,
      w: boxDepth,
      h: boxHeight,
      qty: 1,
      mat: bodyMat,
      edge: "1 × wys.",
    });
    parts.push({
      name: `Szuflada ${n}: Bok prawy`,
      w: boxDepth,
      h: boxHeight,
      qty: 1,
      mat: bodyMat,
      edge: "1 × wys.",
    });
  } else {
    parts.push({
      name: `Szuflada ${n}: System prowadnic (boki w zestawie)`,
      w: "—",
      h: "—",
      qty: 1,
      mat: HARDWARE_MAT,
      edge: "—",
    });
  }

  parts.push({
    name: `Szuflada ${n}: Tył`,
    w: innerW - 4,
    h: boxHeight,
    qty: 1,
    mat: HDF_MAT,
    edge: "brak",
  });
  parts.push({
    name: `Szuflada ${n}: Dno (HDF)`,
    w: innerW - 4,
    h: boxDepth - 10,
    qty: 1,
    mat: HDF_MAT,
    edge: "brak",
  });
  parts.push({
    name: `Szuflada ${n}: Front`,
    w: drawerHeight - FRONT_LUZ,
    h: W - FRONT_LUZ,
    qty: 1,
    mat: frontMat,
    edge: "wokół ABS",
  });

  return parts;
}

function calculateItemBOM(item, index) {
  const labelPrefix = `#${index + 1} [${getItemTypeName(item.type)}]`;
  const bodyMat = item.colorBody || "Standard";
  const frontMat = item.colorFront || "Standard";

  if (item.type === "countertop") {
    return [
      {
        prefix: labelPrefix,
        name: "Blat roboczy (format na wymiar)",
        w: item.dimensions.width,
        h: item.dimensions.depth,
        qty: 1,
        mat: item.countertopColor || "Laminat HPL",
        edge: `gr. ${item.countertopThickness || 38} mm`,
      },
    ];
  }

  if (item.type === "led") {
    const mount =
      item.ledType === "recessed" ? "Wpuszczany" : "Nawierzchniowy";
    return [
      {
        prefix: labelPrefix,
        name: `Profil LED (${mount})`,
        w: item.dimensions.width,
        h: "—",
        qty: 1,
        mat: `${item.ledProfileColor || "Anodowane"} · ${item.ledColorTemperature || "4000K"}`,
        edge: "na wymiar",
      },
    ];
  }

  const parts = cabinetShellParts(item, bodyMat);
  const { width: W, height: H } = item.dimensions;
  const innerW = W - 2 * THICKNESS;

  if (item.interiorType === "shelves") {
    if (item.shelvesCount > 0) {
      parts.push({
        name: "Półka",
        w: innerW - 1,
        h: item.dimensions.depth - 20,
        qty: item.shelvesCount,
        mat: bodyMat,
        edge: "1 × szer.",
      });
    }
    parts.push({
      name: "Front",
      w: H - FRONT_LUZ,
      h: W - FRONT_LUZ,
      qty: 1,
      mat: frontMat,
      edge: "wokół ABS",
    });
  } else if (item.interiorType === "drawers") {
    const heights =
      item.drawerHeights && item.drawerHeights.length
        ? item.drawerHeights
        : Array(item.drawersCount || 1).fill(
            Math.floor((H - (item.drawersCount + 1) * GAP) / item.drawersCount),
          );

    heights.forEach((dh, i) => {
      parts.push(...drawerBoxParts(item, i, dh, bodyMat, frontMat));
    });
  }

  return parts.map((p) => ({ ...p, prefix: labelPrefix }));
}
