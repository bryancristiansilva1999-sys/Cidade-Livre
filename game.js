(() => {
  "use strict";

  const WORLD = { width: 2520, height: 2150 };
  const ROAD_X = [150, 520, 890, 1260, 1630, 2000, 2370];
  const ROAD_Y = [150, 520, 890, 1260, 1630, 2000];
  const ROAD_WIDTH = 112;
  const SAVE_KEY = "bairroLivreWebProgress";
  const vehicles = [
    { id: "sedan", name: "Sedã", speed: 290, acceleration: 255, price: 0, color: "#e6a34a" },
    { id: "sport", name: "Esportivo", speed: 370, acceleration: 310, price: 350, color: "#da685a" },
    { id: "van", name: "Van", speed: 245, acceleration: 205, price: 250, color: "#78a8a0" },
  ];
  const food = [
    { id: "sandwich", name: "Sanduíche", price: 24, color: "#d9a85f" },
    { id: "juice", name: "Suco", price: 12, color: "#d7c860" },
    { id: "cake", name: "Fatia de bolo", price: 18, color: "#d88986" },
  ];
  const raceBounds = [
    [0, 3, 0, 3], [2, 5, 1, 4], [3, 6, 0, 2], [0, 2, 2, 5], [4, 6, 2, 5],
    [1, 4, 0, 3], [2, 5, 2, 5], [0, 3, 3, 5], [3, 6, 3, 5], [1, 5, 1, 4],
  ];
  const missions = [
    { name: "Entrega no Centro", kind: "delivery", district: "Centro", pickup: [150, 300], dropoff: [520, 300], reward: 100 },
    { name: "Corrida de táxi", kind: "taxi", district: "Praça das Árvores", pickup: [700, 520], dropoff: [1260, 700], reward: 180 },
    { name: "Flores para a praça", kind: "delivery", district: "Praça das Árvores", pickup: [700, 520], dropoff: [890, 700], reward: 150 },
    { name: "Socorro na Estação", kind: "tow", district: "Estação Velha", pickup: [1100, 890], dropoff: [1630, 1260], reward: 220 },
    { name: "Pacote do Mercado", kind: "delivery", district: "Mercado Municipal", pickup: [1630, 890], dropoff: [2000, 1260], reward: 200 },
    { name: "Táxi para o Mirante", kind: "taxi", district: "Mirante do Bairro", pickup: [2000, 1630], dropoff: [2370, 2000], reward: 260 },
    { name: "Jornal da Avenida", kind: "delivery", district: "Avenida Norte", pickup: [520, 890], dropoff: [890, 1260], reward: 140 },
    { name: "Compras para o Mirante", kind: "delivery", district: "Mercado Municipal", pickup: [2000, 520], dropoff: [2370, 890], reward: 170 },
    { name: "Táxi da Zona Sul", kind: "taxi", district: "Zona Sul", pickup: [520, 1630], dropoff: [890, 2000], reward: 190 },
    { name: "Reboque para a Oficina", kind: "tow", district: "Zona Leste", pickup: [2000, 2000], dropoff: [1630, 1630], reward: 240 },
    { name: "Passageiro da Estação", kind: "taxi", district: "Estação Velha", pickup: [1100, 830], dropoff: [1500, 890], reward: 210 },
    { name: "Viagem até o Mercado", kind: "taxi", district: "Mercado Municipal", pickup: [1580, 830], dropoff: [1980, 890], reward: 230 },
    { name: "Encomenda urgente", kind: "delivery", district: "Centro", pickup: [520, 700], dropoff: [890, 1100], reward: 180 },
    { name: "Resgate na Avenida", kind: "tow", district: "Avenida Norte", pickup: [1260, 700], dropoff: [1630, 1100], reward: 250 },
    { name: "Entrega de lanche", kind: "delivery", district: "Zona Sul", pickup: [890, 1630], dropoff: [1260, 2000], reward: 190 },
  ];
  raceBounds.forEach((_bounds, index) => {
    missions.push({
      name: `Corrida de rua ${index + 1}`,
      kind: "race",
      district: `Etapa ${index + 1}`,
      courseIndex: index,
      reward: 200 + index * 25,
    });
  });

  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const ui = {
    start: $("#startScreen"),
    pause: $("#pauseScreen"),
    store: $("#storePanel"),
    toast: $("#toast"),
    objectiveType: $("#objectiveType"),
    objectiveName: $("#objectiveName"),
    objectiveHint: $("#objectiveHint"),
    activityCount: $("#activityCount"),
    reward: $("#rewardText"),
    progress: $("#progressFill"),
    cash: $("#cashValue"),
    inventory: $("#inventory"),
    best: $("#bestTime"),
    raceStatus: $("#raceStatus"),
    raceDots: $("#raceDots"),
    vehicle: $("#vehicleName"),
    garage: $("#garageHint"),
    storeItems: $("#storeItems"),
  };

  const saved = loadProgress();
  const state = {
    started: false,
    paused: false,
    storeOpen: false,
    player: { x: 150, y: 150, angle: 0 },
    car: { x: 205, y: 150, angle: 0, speed: 0, stop: 0, crashTimer: 0, crashSpin: 0, crashCooldown: 0 },
    inCar: false,
    vehicleIndex: vehicles.findIndex((vehicle) => vehicle.id === saved.vehicle) < 0 ? 0 : vehicles.findIndex((vehicle) => vehicle.id === saved.vehicle),
    owned: new Set(Array.isArray(saved.owned) ? saved.owned : ["sedan"]),
    cash: Number.isSafeInteger(saved.cash) && saved.cash >= 0 ? saved.cash : 0,
    inventory: saved.inventory && typeof saved.inventory === "object" ? saved.inventory : {},
    missionIndex: Number.isInteger(saved.completed) ? Math.min(25, Math.max(0, saved.completed)) : 0,
    missionStage: "pickup",
    bestTime: Number.isFinite(saved.bestTime) ? saved.bestTime : null,
    selectedFood: 0,
    camera: { x: 150, y: 150 },
    keys: new Set(),
    cars: [],
    pedestrians: [],
    buildings: [],
    parks: [],
    shops: [],
    trees: [],
    sidewalkNodes: [],
    sidewalkGraph: [],
    routes: [],
    race: { active: false, countdown: 0, elapsed: 0, checkpoint: 0, route: [], opponents: [], free: false },
    moneyBag: { x: 1260, y: 520, collected: false },
    toastTimer: 0,
    hudTimer: 0,
    engineOscillator: null,
    engineGain: null,
    lastFrame: 0,
    width: 1,
    height: 1,
    zoom: 1,
  };
  for (const item of food) {
    const quantity = state.inventory[item.id];
    state.inventory[item.id] = Number.isInteger(quantity) && quantity >= 0 ? quantity : 0;
  }
  if (!state.owned.has("sedan")) state.owned.add("sedan");

  function loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const progress = raw ? JSON.parse(raw) : {};
      return progress && typeof progress === "object" && !Array.isArray(progress) ? progress : {};
    } catch (error) {
      console.warn("O progresso local não pôde ser lido.", error);
      return {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        cash: state.cash,
        owned: [...state.owned],
        vehicle: vehicles[state.vehicleIndex].id,
        inventory: state.inventory,
        completed: state.missionIndex,
        bestTime: state.bestTime,
      }));
    } catch (error) {
      console.error("O progresso não pôde ser salvo neste navegador.", error);
      toast("Não foi possível salvar o progresso neste navegador.");
    }
    refreshHud();
  }

  function resetProgress() {
    if (!window.confirm("Apagar todo o progresso salvo, incluindo dinheiro, veículos, itens e recorde?")) return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      console.error("O progresso salvo não pôde ser apagado.", error);
      toast("Não foi possível apagar o progresso neste navegador.");
      return;
    }

    state.cash = 0;
    state.owned = new Set(["sedan"]);
    state.vehicleIndex = 0;
    for (const item of food) state.inventory[item.id] = 0;
    state.missionIndex = 0;
    state.missionStage = "pickup";
    state.bestTime = null;
    state.selectedFood = 0;
    state.player = { x: 150, y: 150, angle: 0 };
    state.car = { x: 205, y: 150, angle: 0, speed: 0, stop: 0, crashTimer: 0, crashSpin: 0, crashCooldown: 0 };
    state.inCar = false;
    state.camera = { x: 150, y: 150 };
    state.keys.clear();
    state.race = { active: false, countdown: 0, elapsed: 0, checkpoint: 0, route: [], opponents: [], free: false };
    state.moneyBag.collected = false;
    state.paused = false;
    ui.pause.classList.add("hidden");
    if (state.storeOpen) closeStore();
    refreshHud();
    toast("Progresso apagado. Você pode começar de novo!");
  }

  function rng(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function distance(a, b) {
    const first = coordinates(a);
    const second = coordinates(b);
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function coordinates(position) {
    return Array.isArray(position)
      ? { x: position[0], y: position[1] }
      : position;
  }

  function makeCourse(bounds) {
    const [left, right, top, bottom] = bounds;
    const points = [];
    for (let x = left; x <= right; x += 1) points.push({ x: ROAD_X[x], y: ROAD_Y[top] });
    for (let y = top + 1; y <= bottom; y += 1) points.push({ x: ROAD_X[right], y: ROAD_Y[y] });
    for (let x = right - 1; x >= left; x -= 1) points.push({ x: ROAD_X[x], y: ROAD_Y[bottom] });
    for (let y = bottom - 1; y > top; y -= 1) points.push({ x: ROAD_X[left], y: ROAD_Y[y] });
    return points;
  }

  function rotateCourseToStart(course, preferred = null) {
    if (preferred) {
      const preferredIndex = course.findIndex((point) => point.x === preferred.x && point.y === preferred.y);
      if (preferredIndex >= 0) return course.slice(preferredIndex).concat(course.slice(0, preferredIndex));
    }
    const clearance = course.map((point, index) => {
      const next = course[(index + 1) % course.length];
      const angle = Math.atan2(next.y - point.y, next.x - point.x);
      if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
        return Math.cos(angle) > 0 ? point.x : WORLD.width - point.x;
      }
      return Math.sin(angle) > 0 ? point.y : WORLD.height - point.y;
    });
    const start = clearance.indexOf(Math.max(...clearance));
    return course.slice(start).concat(course.slice(0, start));
  }

  function buildCity() {
    const random = rng(22);
    for (let column = 0; column < ROAD_X.length - 1; column += 1) {
      for (let row = 0; row < ROAD_Y.length - 1; row += 1) {
        const left = ROAD_X[column] + ROAD_WIDTH / 2 + 17;
        const right = ROAD_X[column + 1] - ROAD_WIDTH / 2 - 17;
        const top = ROAD_Y[row] + ROAD_WIDTH / 2 + 17;
        const bottom = ROAD_Y[row + 1] - ROAD_WIDTH / 2 - 17;
        if (column === 1 && row === 1) {
          state.parks.push({ left, right, top, bottom });
          for (let tree = 0; tree < 16; tree += 1) {
            state.trees.push({ x: left + 20 + random() * (right - left - 40), y: top + 20 + random() * (bottom - top - 40), size: 10 + random() * 6 });
          }
          continue;
        }
        const midX = (left + right) / 2;
        const midY = (top + bottom) / 2;
        const lots = [
          [left, top, midX - 7, midY - 7], [midX + 7, top, right, midY - 7],
          [left, midY + 7, midX - 7, bottom], [midX + 7, midY + 7, right, bottom],
        ];
        lots.forEach((lot, lotIndex) => {
          const insetX = 8 + random() * 11;
          const insetY = 8 + random() * 11;
          const rect = { left: lot[0] + insetX, top: lot[1] + insetY, right: lot[2] - insetX, bottom: lot[3] - insetY };
          if (rect.right - rect.left < 58 || rect.bottom - rect.top < 45) return;
          const roll = random();
          const style = roll < 0.2 ? "shop" : roll < 0.27 ? "cafe" : roll < 0.46 ? "warehouse" : "home";
          const building = {
            rect, lot: { left: lot[0], top: lot[1], right: lot[2], bottom: lot[3] },
            style, color: ["#aa856d", "#c69b78", "#82695d"][Math.floor(random() * 3)],
            seed: lotIndex + column * 17 + row * 31,
          };
          state.buildings.push(building);
          if (style === "shop" || style === "cafe") {
            state.shops.push({ building, name: `${style === "cafe" ? "Café da Praça" : "Mercadinho do Bairro"} ${state.shops.length + 1}`, door: { x: (rect.left + rect.right) / 2, y: rect.bottom + 18 } });
          }
        });
      }
    }
    state.routes = [
      [[2, 0], [2, 1], [1, 1], [1, 0]],
      [[0, 1], [1, 1], [1, 2], [0, 2]],
      [[3, 1], [3, 0], [2, 0], [2, 1]],
      [[2, 2], [1, 2], [0, 2], [0, 3]],
      [[3, 3], [4, 3], [4, 2], [3, 2]],
      [[5, 3], [6, 3], [6, 4], [5, 4]],
      [[4, 4], [3, 4], [3, 5], [4, 5]],
    ].map((route) => route.map(([xIndex, yIndex]) => ({ x: ROAD_X[xIndex], y: ROAD_Y[yIndex] })));
    state.cars = [
      { x: 616, y: 150, angle: 0, color: "#74a5a2", speed: 85, route: state.routes[0], routeIndex: 0 },
      { x: 150, y: 300, angle: Math.PI / 2, color: "#d57863", speed: 95, route: state.routes[1], routeIndex: 0 },
      { x: 1000, y: 520, angle: 0, color: "#8f91b2", speed: 92, route: state.routes[2], routeIndex: 0 },
      { x: 1100, y: 890, angle: Math.PI, color: "#d6ba74", speed: 88, route: state.routes[3], routeIndex: 0 },
      { x: 1260, y: 1000, angle: Math.PI / 2, color: "#76a879", speed: 98, route: state.routes[4], routeIndex: 0 },
      { x: 2000, y: 1100, angle: Math.PI / 2, color: "#8db0c2", speed: 90, route: state.routes[5], routeIndex: 0 },
      { x: 1630, y: 1800, angle: Math.PI, color: "#c887aa", speed: 94, route: state.routes[6], routeIndex: 0 },
    ];
    for (const car of state.cars) {
      car.regularRoute = car.route;
      car.regularRouteIndex = car.routeIndex;
    }
    buildSidewalkGraph();
    state.pedestrians = Array.from({ length: 14 }, (_, index) => {
      const start = (index * 11) % state.sidewalkNodes.length;
      const goal = (start + 31 + index) % state.sidewalkNodes.length;
      const path = findPath(start, goal);
      return {
        x: state.sidewalkNodes[start].x, y: state.sidewalkNodes[start].y,
        path, target: path[0] || state.sidewalkNodes[start],
        speed: 34 + random() * 12, wait: random() * 1.2,
        color: ["#e4aaa0", "#b6c5a3", "#a7b4cf", "#d8c3a1"][Math.floor(random() * 4)],
      };
    });
  }

  function isSolid(x, y, radius) {
    if (x - radius < 0 || x + radius > WORLD.width || y - radius < 0 || y + radius > WORLD.height) return true;
    return state.buildings.some(({ rect }) => x + radius > rect.left && x - radius < rect.right && y + radius > rect.top && y - radius < rect.bottom);
  }

  function buildSidewalkGraph() {
    const nodes = [];
    for (const y of ROAD_Y) {
      for (const x of ROAD_X) {
        for (const [dx, dy] of [[-63, -63], [63, -63], [-63, 63], [63, 63]]) {
          const point = { x: x + dx, y: y + dy };
          if (!isSolid(point.x, point.y, 5)) nodes.push(point);
        }
      }
    }
    state.sidewalkNodes = nodes;
    state.sidewalkGraph = nodes.map(() => []);
    for (let first = 0; first < nodes.length; first += 1) {
      for (let second = first + 1; second < nodes.length; second += 1) {
        const a = nodes[first];
        const b = nodes[second];
        const sameRow = a.y === b.y && Math.abs(a.x - b.x) <= 380;
        const sameColumn = a.x === b.x && Math.abs(a.y - b.y) <= 380;
        if (!(sameRow || sameColumn)) continue;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        if (isSolid(midX, midY, 5)) continue;
        state.sidewalkGraph[first].push(second);
        state.sidewalkGraph[second].push(first);
      }
    }
  }

  function findPath(start, goal) {
    if (start === goal) return [];
    const previous = new Map([[start, -1]]);
    const queue = [start];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      if (current === goal) break;
      for (const next of state.sidewalkGraph[current]) {
        if (previous.has(next)) continue;
        previous.set(next, current);
        queue.push(next);
      }
    }
    if (!previous.has(goal)) return [];
    const path = [];
    for (let cursor = goal; cursor !== start; cursor = previous.get(cursor)) path.push(state.sidewalkNodes[cursor]);
    return path.reverse();
  }

  function currentMission() {
    return missions[state.missionIndex] || null;
  }

  function courseIndexForMission() {
    const mission = currentMission();
    return mission?.kind === "race" ? mission.courseIndex : 0;
  }

  function currentRaceCourse() {
    return rotateCourseToStart(makeCourse(raceBounds[courseIndexForMission()]));
  }

  function currentTarget() {
    const mission = currentMission();
    if (!mission || mission.kind === "race") return null;
    return mission[state.missionStage];
  }

  function currentPosition() {
    return state.inCar ? state.car : state.player;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    canvas.width = Math.round(state.width * ratio);
    canvas.height = Math.round(state.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    state.zoom = Math.min(state.width / 960, state.height / 600);
  }

  function point(x, y) {
    return {
      x: state.width / 2 + (x - state.camera.x) * state.zoom,
      y: state.height / 2 + (y - state.camera.y) * state.zoom,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#698265";
    ctx.fillRect(0, 0, state.width, state.height);
    drawRoads();
    drawParks();
    drawBuildings();
    drawRoadProps();
    drawMissionMarker();
    drawRaceMarkers();
    drawMoneyBag();
    drawPedestrians();
    drawCars();
    drawPlayer();
    drawMinimap();
    if (state.inCar) {
      const position = point(state.car.x, state.car.y);
      ctx.fillStyle = "rgb(14 22 23 / 75%)";
      roundRect(ctx, 15, state.height - 42, 162, 27, 7, true);
      ctx.fillStyle = "#f2df9a";
      ctx.font = "700 11px Segoe UI, sans-serif";
      ctx.fillText(`${vehicles[state.vehicleIndex].name.toUpperCase()} · ${Math.round(Math.abs(state.car.speed) * 0.11)} KM/H`, 25, state.height - 24);
      void position;
    }
  }

  function drawRoads() {
    for (const x of ROAD_X) {
      const left = point(x - ROAD_WIDTH / 2 - 9, 0).x;
      const right = point(x + ROAD_WIDTH / 2 + 9, 0).x;
      ctx.fillStyle = "#b7ad91";
      ctx.fillRect(left, 0, right - left, state.height);
      const roadLeft = point(x - ROAD_WIDTH / 2, 0).x;
      const roadRight = point(x + ROAD_WIDTH / 2, 0).x;
      ctx.fillStyle = "#42494a";
      ctx.fillRect(roadLeft, 0, roadRight - roadLeft, state.height);
      ctx.strokeStyle = "#aaa68b";
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 25]);
      ctx.beginPath();
      ctx.moveTo(point(x, 0).x, 0);
      ctx.lineTo(point(x, 0).x, state.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const y of ROAD_Y) {
      const top = point(0, y - ROAD_WIDTH / 2 - 9).y;
      const bottom = point(0, y + ROAD_WIDTH / 2 + 9).y;
      ctx.fillStyle = "#b7ad91";
      ctx.fillRect(0, top, state.width, bottom - top);
      const roadTop = point(0, y - ROAD_WIDTH / 2).y;
      const roadBottom = point(0, y + ROAD_WIDTH / 2).y;
      ctx.fillStyle = "#42494a";
      ctx.fillRect(0, roadTop, state.width, roadBottom - roadTop);
      ctx.strokeStyle = "#aaa68b";
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 25]);
      ctx.beginPath();
      ctx.moveTo(0, point(0, y).y);
      ctx.lineTo(state.width, point(0, y).y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawParks() {
    for (const park of state.parks) {
      const topLeft = point(park.left, park.top);
      const bottomRight = point(park.right, park.bottom);
      ctx.fillStyle = "#7b956f";
      ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
      ctx.strokeStyle = "#c0b591";
      ctx.lineWidth = 3;
      ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
      ctx.strokeStyle = "#d2c6a0";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(topLeft.x + 12, (topLeft.y + bottomRight.y) / 2);
      ctx.lineTo(bottomRight.x - 12, (topLeft.y + bottomRight.y) / 2);
      ctx.moveTo((topLeft.x + bottomRight.x) / 2, topLeft.y + 12);
      ctx.lineTo((topLeft.x + bottomRight.x) / 2, bottomRight.y - 12);
      ctx.stroke();
    }
    for (const tree of state.trees) {
      const p = point(tree.x, tree.y);
      ctx.fillStyle = "#465e4b";
      ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 4, tree.size * state.zoom, tree.size * .75 * state.zoom, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#527759";
      ctx.beginPath(); ctx.arc(p.x, p.y, tree.size * state.zoom, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#a2a87a";
      ctx.beginPath(); ctx.arc(p.x - 2, p.y - 3, tree.size * .25 * state.zoom, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawBuildings() {
    for (const building of state.buildings) {
      const lot = building.lot;
      const lotTop = point(lot.left, lot.top);
      const lotBottom = point(lot.right, lot.bottom);
      const lotWidth = lotBottom.x - lotTop.x;
      const lotHeight = lotBottom.y - lotTop.y;
      ctx.fillStyle = "#171b1b";
      ctx.fillRect(lotTop.x, lotTop.y, lotWidth, lotHeight);
      ctx.strokeStyle = "#101313";
      ctx.lineWidth = 2;
      ctx.strokeRect(lotTop.x, lotTop.y, lotWidth, lotHeight);
      ctx.fillStyle = building.style === "shop" || building.style === "cafe" ? "#353b3a" : "#68825f";
      ctx.fillRect(lotTop.x + 5, lotTop.y + 5, lotWidth - 10, lotHeight - 10);
      if (building.style === "shop" || building.style === "cafe") {
        ctx.strokeStyle = "#414746";
        ctx.lineWidth = 1;
        for (let y = lotTop.y + 10; y < lotBottom.y - 4; y += 14) {
          ctx.beginPath(); ctx.moveTo(lotTop.x + 5, y); ctx.lineTo(lotBottom.x - 5, y); ctx.stroke();
        }
        for (let x = lotTop.x + 8; x < lotBottom.x - 5; x += 22) {
          ctx.beginPath(); ctx.moveTo(x, lotBottom.y - 34); ctx.lineTo(x, lotBottom.y - 5); ctx.stroke();
        }
      }
      const rectTop = point(building.rect.left, building.rect.top);
      const rectBottom = point(building.rect.right, building.rect.bottom);
      const width = rectBottom.x - rectTop.x;
      const height = rectBottom.y - rectTop.y;
      ctx.fillStyle = "rgb(32 43 38 / 75%)";
      ctx.fillRect(rectTop.x + 5, rectTop.y + 6, width, height);
      ctx.fillStyle = building.color;
      ctx.fillRect(rectTop.x, rectTop.y, width, height);
      ctx.strokeStyle = "#5c5d50";
      ctx.lineWidth = 2;
      ctx.strokeRect(rectTop.x, rectTop.y, width, height);
      ctx.fillStyle = "#dfc398";
      ctx.fillRect(rectTop.x + 5, rectTop.y + 5, Math.max(0, width - 10), 7);
      if (building.style === "shop" || building.style === "cafe") {
        ctx.fillStyle = building.style === "cafe" ? "#b56e55" : "#587f83";
        ctx.fillRect(rectTop.x + 9, rectTop.y + 13, Math.max(5, width - 18), 11);
        ctx.fillStyle = "#f5e8c9";
        ctx.font = `bold ${Math.max(7, 7 * state.zoom)}px Segoe UI, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(building.style === "cafe" ? "CAFÉ" : "LOJA", rectTop.x + width / 2, rectTop.y + 22);
        ctx.fillStyle = "#d5b16e";
        ctx.fillRect(rectTop.x + 8, rectBottom.y - 16, Math.max(0, width - 16), 5);
      } else {
        const columns = Math.max(1, Math.floor((width - 20) / 28));
        const rows = Math.max(1, Math.floor((height - 30) / 25));
        ctx.fillStyle = "#93bac0";
        for (let row = 0; row < rows; row += 1) {
          for (let column = 0; column < columns; column += 1) {
            if ((row * 3 + column + building.seed) % 5 === 0) continue;
            ctx.fillRect(rectTop.x + 12 + column * 28, rectTop.y + 20 + row * 25, 9, 8);
          }
        }
      }
      ctx.fillStyle = "#584f45";
      ctx.fillRect(rectTop.x + width / 2 - 5, rectBottom.y - 14, 10, 14);
    }
  }

  function drawRoadProps() {
    for (const x of ROAD_X) {
      for (const y of ROAD_Y) {
        for (const [dx, dy] of [[-47, -47], [47, 47]]) {
          const p = point(x + dx, y + dy);
          ctx.fillStyle = "#e7d696";
          ctx.beginPath(); ctx.arc(p.x, p.y, 4 * state.zoom, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  function drawMarker(position, label, color = "#f1db70") {
    const coordinatesPosition = coordinates(position);
    const p = point(coordinatesPosition.x, coordinatesPosition.y);
    if (p.x < -80 || p.x > state.width + 80 || p.y < -80 || p.y > state.height + 80) return;
    const pulse = 16 + Math.sin(performance.now() / 280) * 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, pulse * state.zoom, 0, Math.PI * 2);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x, p.y, 6 * state.zoom, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = "#fff9e8";
    ctx.font = `bold ${Math.max(8, 10 * state.zoom)}px Segoe UI, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(label, p.x, p.y - 23 * state.zoom);
  }

  function drawMissionMarker() {
    const mission = currentMission();
    if (!mission || mission.kind === "race") return;
    const target = currentTarget();
    drawMarker(target, state.missionStage === "pickup" ? (mission.kind === "taxi" ? "PASSAGEIRO" : mission.kind === "tow" ? "SOCORRO" : "PEGAR") : "DESTINO", state.missionStage === "pickup" ? "#e7d77f" : "#92c5a0");
  }

  function drawRaceMarkers() {
    if (state.race.active) {
      drawMarker(state.race.route[state.race.checkpoint], `PONTO ${state.race.checkpoint + 1}`, "#a6dbb1");
    } else {
      const freeCourse = rotateCourseToStart(makeCourse(raceBounds[0]), { x: 520, y: 150 });
      drawMarker(freeCourse[0], "R · LIVRE", "#d4a8d8");
      if (currentMission()?.kind === "race") {
        const course = currentRaceCourse();
        drawMarker(course[0], `ETAPA ${currentMission().courseIndex + 1}/10`, "#f1db70");
      }
    }
  }

  function drawMoneyBag() {
    if (state.moneyBag.collected) return;
    const p = point(state.moneyBag.x, state.moneyBag.y);
    ctx.fillStyle = "#d6bd70";
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 11 * state.zoom, 9 * state.zoom, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3e514c";
    ctx.font = `bold ${Math.max(8, 10 * state.zoom)}px Segoe UI, sans-serif`;
    ctx.textAlign = "center"; ctx.fillText("$", p.x, p.y + 4 * state.zoom);
  }

  function drawPedestrians() {
    for (const pedestrian of state.pedestrians) {
      const p = point(pedestrian.x, pedestrian.y);
      ctx.fillStyle = pedestrian.color;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 2 * state.zoom, 6 * state.zoom, 7 * state.zoom, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ecc9a7";
      ctx.beginPath(); ctx.arc(p.x, p.y - 6 * state.zoom, 3.5 * state.zoom, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawCar(car, isPlayer = false) {
    const p = point(car.x, car.y);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(car.angle);
    ctx.scale(state.zoom, state.zoom);
    ctx.fillStyle = car.color;
    ctx.strokeStyle = "#33434b";
    ctx.lineWidth = 2;
    roundRect(ctx, -18, -12, 36, 24, 5, true, true);
    ctx.fillStyle = "#b8d2ce";
    ctx.fillRect(-5, -9, 13, 18);
    ctx.fillStyle = "#f5e1a2";
    ctx.fillRect(12, -8, 3, 5);
    ctx.fillRect(12, 3, 3, 5);
    if (isPlayer) {
      ctx.strokeStyle = "#fff2c8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawCars() {
    for (const car of state.cars) drawCar(car);
    state.car.color = vehicles[state.vehicleIndex].color;
    drawCar(state.car, state.inCar);
  }

  function drawPlayer() {
    if (state.inCar) return;
    const p = point(state.player.x, state.player.y);
    ctx.fillStyle = "#485c62";
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 4 * state.zoom, 8 * state.zoom, 6 * state.zoom, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f0d381";
    ctx.beginPath(); ctx.arc(p.x, p.y, 7 * state.zoom, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3e514c";
    ctx.beginPath(); ctx.arc(p.x + Math.cos(state.player.angle) * 4 * state.zoom, p.y + Math.sin(state.player.angle) * 4 * state.zoom, 2 * state.zoom, 0, Math.PI * 2); ctx.fill();
  }

  function drawMinimap() {
    const width = 144;
    const height = 111;
    const left = state.width - width - 12;
    const top = 12;
    ctx.fillStyle = "rgb(24 35 38 / 89%)";
    roundRect(ctx, left, top, width, height, 8, true);
    ctx.strokeStyle = "#d5c69b"; ctx.lineWidth = 1; ctx.strokeRect(left, top, width, height);
    const mapX = (x) => left + 5 + x / WORLD.width * (width - 10);
    const mapY = (y) => top + 5 + y / WORLD.height * (height - 10);
    ctx.strokeStyle = "#818b87"; ctx.lineWidth = 2;
    for (const x of ROAD_X) { ctx.beginPath(); ctx.moveTo(mapX(x), top + 4); ctx.lineTo(mapX(x), top + height - 4); ctx.stroke(); }
    for (const y of ROAD_Y) { ctx.beginPath(); ctx.moveTo(left + 4, mapY(y)); ctx.lineTo(left + width - 4, mapY(y)); ctx.stroke(); }
    const target = currentTarget();
    if (target) {
      const targetPosition = coordinates(target);
      ctx.fillStyle = "#f1db70";
      ctx.beginPath();
      ctx.arc(mapX(targetPosition.x), mapY(targetPosition.y), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const position = currentPosition();
    ctx.fillStyle = "#f4e9a6"; ctx.beginPath(); ctx.arc(mapX(position.x), mapY(position.y), 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 7px Segoe UI"; ctx.textAlign = "left"; ctx.fillText("MAPA", left + 6, top + 12);
  }

  function roundRect(context, x, y, width, height, radius, fill, stroke = false) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
    if (fill) context.fill();
    if (stroke) context.stroke();
  }

  function update(dt) {
    updateEngineAudio();
    if (!state.started || state.paused || state.storeOpen) return;
    state.hudTimer += dt;
    if (state.hudTimer >= .15) {
      state.hudTimer = 0;
      refreshHud();
    }
    movePedestrians(dt);
    moveTraffic(dt);
    if (state.inCar) moveCar(dt);
    else movePlayer(dt);
    if (!state.moneyBag.collected && distance(currentPosition(), state.moneyBag) < 23) {
      state.moneyBag.collected = true;
      state.cash += 50;
      saveProgress();
      toast("Você encontrou uma sacolinha com $50!");
      beep(720, .16);
    }
    updateRace(dt);
    const target = currentPosition();
    state.camera.x += (target.x - state.camera.x) * Math.min(1, dt * 7);
    state.camera.y += (target.y - state.camera.y) * Math.min(1, dt * 7);
    state.camera.x = clamp(state.camera.x, state.width / (2 * state.zoom), WORLD.width - state.width / (2 * state.zoom));
    state.camera.y = clamp(state.camera.y, state.height / (2 * state.zoom), WORLD.height - state.height / (2 * state.zoom));
    if (state.toastTimer > 0) state.toastTimer -= dt;
  }

  function movePlayer(dt) {
    const dx = (state.keys.has("d") ? 1 : 0) - (state.keys.has("a") ? 1 : 0);
    const dy = (state.keys.has("s") ? 1 : 0) - (state.keys.has("w") ? 1 : 0);
    if (!dx && !dy) return;
    const length = Math.hypot(dx, dy);
    const x = state.player.x + dx / length * 180 * dt;
    const y = state.player.y + dy / length * 180 * dt;
    if (!isSolid(x, state.player.y, 10)) state.player.x = x;
    if (!isSolid(state.player.x, y, 10)) state.player.y = y;
    state.player.angle = Math.atan2(dy, dx);
  }

  function moveCar(dt) {
    if (state.race.countdown > 0) {
      state.car.speed = 0;
      return;
    }
    if (state.car.stop > 0) {
      state.car.stop -= dt;
      state.car.speed = 0;
      return;
    }
    const vehicle = vehicles[state.vehicleIndex];
    const acceleration = (state.keys.has("w") ? 1 : 0) - (state.keys.has("s") ? 1 : 0);
    const turn = (state.keys.has("d") ? 1 : 0) - (state.keys.has("a") ? 1 : 0);
    const car = state.car;
    car.crashTimer = Math.max(0, car.crashTimer - dt);
    car.crashCooldown = Math.max(0, car.crashCooldown - dt);
    car.crashSpin *= Math.exp(-dt * 3.2);
    const steeringControl = car.crashTimer > 0 ? .28 : 1;
    car.angle += turn * .95 * steeringControl * Math.min(1, Math.abs(car.speed) / 85) * (car.speed >= 0 ? 1 : -1) * dt;
    car.angle += car.crashSpin * dt;
    if (state.keys.has("shift")) state.car.speed *= Math.pow(.2, dt);
    else state.car.speed = clamp(state.car.speed + acceleration * vehicle.acceleration * dt, -vehicle.speed * .45, vehicle.speed);
    if (!acceleration || state.keys.has("shift")) state.car.speed *= Math.pow(.97, dt * 30);
    if (Math.abs(state.car.speed) < 3) state.car.speed = 0;
    const dx = Math.cos(state.car.angle) * state.car.speed * dt;
    const dy = Math.sin(state.car.angle) * state.car.speed * dt;
    const hitX = isSolid(car.x + dx, car.y, 17);
    const resolvedX = hitX ? car.x : car.x + dx;
    const hitY = isSolid(resolvedX, car.y + dy, 17);
    const impactSpeed = Math.abs(car.speed);
    if (!hitX) car.x = resolvedX;
    if (!hitY) car.y += dy;
    if (hitX || hitY) {
      const direction = car.speed < 0 ? -1 : 1;
      let velocityX = Math.cos(car.angle) * car.speed;
      let velocityY = Math.sin(car.angle) * car.speed;
      if (hitX) velocityX *= -.28;
      else velocityX *= .78;
      if (hitY) velocityY *= -.28;
      else velocityY *= .78;
      car.speed = Math.hypot(velocityX, velocityY) * direction;
      car.angle = Math.atan2(velocityY * direction, velocityX * direction);
      if (impactSpeed > 45) {
        car.crashTimer = .85;
        if (hitX && hitY) car.crashSpin = (Math.sign(velocityX) || 1) * 1.7;
        else if (hitX) car.crashSpin = (Math.sign(velocityY) || 1) * 2.1;
        else car.crashSpin = -(Math.sign(velocityX) || 1) * 2.1;
        if (car.crashCooldown === 0) {
          toast("Batida! O carro perdeu velocidade e saiu de controle.");
          beep(110, .16);
          car.crashCooldown = .9;
        }
      } else if (car.crashCooldown === 0) {
        toast("Você encostou em uma casa.");
        car.crashCooldown = .45;
      }
    }
    for (const pedestrian of state.pedestrians) {
      if (distance(state.car, pedestrian) < 20 && state.car.speed !== 0) {
        state.car.stop = .7;
        state.car.speed = 0;
        toast("O pedestre passou; espere um instante.");
        break;
      }
    }
    for (const car of state.cars) {
      if (distance(state.car, car) < 29 && state.car.speed !== 0) {
        state.car.speed *= .35;
        toast("Você encostou em outro carro. Vá com calma!");
        beep(110, .12);
        break;
      }
    }
  }

  function moveTraffic(dt) {
    for (const car of state.cars) {
      if (car.raceOpponent) {
        moveOpponent(car, dt);
        continue;
      }
      const target = car.route[car.routeIndex];
      const dx = target.x - car.x;
      const dy = target.y - car.y;
      if (Math.hypot(dx, dy) < 22) {
        car.routeIndex = (car.routeIndex + 1) % car.route.length;
        continue;
      }
      const desired = Math.atan2(dy, dx);
      car.angle += clamp(angleDifference(desired, car.angle), -.9 * dt, .9 * dt);
      const blocked = state.cars.some((other) => other !== car && distance(car, other) < 43);
      const playerBlocked = state.inCar && distance(car, state.car) < 48;
      const speed = blocked || playerBlocked ? 28 : car.speed;
      car.x += Math.cos(car.angle) * speed * dt;
      car.y += Math.sin(car.angle) * speed * dt;
    }
  }

  function moveOpponent(car, dt) {
    if (state.race.countdown > 0) return;
    const target = state.race.route[car.raceIndex];
    const dx = target.x - car.x;
    const dy = target.y - car.y;
    if (Math.hypot(dx, dy) < 28) {
      car.raceIndex += 1;
      if (car.raceIndex >= state.race.route.length) {
        car.raceIndex = 0;
        car.raceLaps += 1;
      }
      return;
    }
    const desired = Math.atan2(dy, dx);
    car.angle += clamp(angleDifference(desired, car.angle), -.95 * dt, .95 * dt);
    const speed = car.raceSpeed;
    car.x += Math.cos(car.angle) * speed * dt;
    car.y += Math.sin(car.angle) * speed * dt;
  }

  function movePedestrians(dt) {
    for (const pedestrian of state.pedestrians) {
      if (pedestrian.wait > 0) { pedestrian.wait -= dt; continue; }
      if (state.cars.concat(state.inCar ? [state.car] : []).some((car) => distance(pedestrian, car) < 42)) {
        pedestrian.wait = .45;
        continue;
      }
      const otherNear = state.pedestrians.some((other) => other !== pedestrian && distance(pedestrian, other) < 13);
      if (otherNear) { pedestrian.wait = .2; continue; }
      if (!pedestrian.path.length) {
        let nearest = 0;
        for (let i = 1; i < state.sidewalkNodes.length; i += 1) {
          if (distance(pedestrian, state.sidewalkNodes[i]) < distance(pedestrian, state.sidewalkNodes[nearest])) nearest = i;
        }
        const goal = Math.floor(Math.random() * state.sidewalkNodes.length);
        pedestrian.path = findPath(nearest, goal);
        if (!pedestrian.path.length) { pedestrian.wait = .5; continue; }
        pedestrian.target = pedestrian.path[0];
      }
      const dx = pedestrian.target.x - pedestrian.x;
      const dy = pedestrian.target.y - pedestrian.y;
      const length = Math.hypot(dx, dy);
      if (length < pedestrian.speed * dt + 1) {
        pedestrian.x = pedestrian.target.x;
        pedestrian.y = pedestrian.target.y;
        pedestrian.path.shift();
        pedestrian.target = pedestrian.path[0] || pedestrian.target;
        if (!pedestrian.path.length) pedestrian.wait = .12 + Math.random() * .3;
      } else {
        const nextX = pedestrian.x + dx / length * pedestrian.speed * dt;
        const nextY = pedestrian.y + dy / length * pedestrian.speed * dt;
        if (!isSolid(nextX, nextY, 5)) { pedestrian.x = nextX; pedestrian.y = nextY; }
        else { pedestrian.path = []; pedestrian.wait = .5; }
      }
    }
  }

  function interact() {
    if (!state.started || state.paused) return;
    const position = currentPosition();
    const mission = currentMission();
    const missionCourse = mission?.kind === "race" ? currentRaceCourse() : null;
    const freeCourse = rotateCourseToStart(makeCourse(raceBounds[0]), { x: 520, y: 150 });
    if (state.inCar && !state.race.active && missionCourse && distance(position, missionCourse[0]) < 58) {
      startRace(missionCourse, mission.reward);
      return;
    }
    if (state.inCar && !state.race.active && distance(position, freeCourse[0]) < 58) {
      startRace(freeCourse, 200, true);
      return;
    }
    if (!state.inCar && distance(state.player, state.car) < 39) {
      state.inCar = true;
      state.car.speed = 0;
      toast(`Você entrou no ${vehicles[state.vehicleIndex].name}.`);
      beep(460, .1);
      return;
    }
    if (state.inCar) {
      state.inCar = false;
      state.player.x = state.car.x - Math.sin(state.car.angle) * 30;
      state.player.y = state.car.y + Math.cos(state.car.angle) * 30;
      state.player.angle = state.car.angle;
      state.car.speed = 0;
      toast("Você saiu do carro.");
      beep(300, .1);
      return;
    }
    const shop = state.shops.find((candidate) => distance(state.player, candidate.door) < 54);
    if (shop) {
      openStore(shop.name);
      return;
    }
    if (mission && mission.kind !== "race") {
      const target = mission[state.missionStage];
      const targetDistance = distance(state.player, target);
      if (!Number.isFinite(targetDistance) || targetDistance > 50) {
        toast("Chegue mais perto do marcador para interagir.");
        return;
      }
      if (state.missionStage === "pickup") {
        state.missionStage = "dropoff";
        toast(mission.kind === "taxi" ? "Passageiro a bordo! Leve-o ao destino." : mission.kind === "tow" ? "Socorro chamado! Siga até a oficina." : "Pacote recebido! Leve ao destino.");
        beep(620, .12);
      } else {
        state.cash += mission.reward;
        state.missionIndex += 1;
        state.missionStage = "pickup";
        saveProgress();
        toast(`Serviço concluído! +$${mission.reward}.`);
        beep(760, .2);
      }
      refreshHud();
      return;
    }
    if (mission?.kind === "race") toast("Entre no carro e dirija até o marcador R da largada.");
    else toast("Entre no carro ou explore o bairro.");
  }

  function startRace(course, reward, free = false) {
    state.race.route = course;
    state.race.active = false;
    state.race.countdown = 3;
    state.race.elapsed = 0;
    state.race.checkpoint = 1;
    state.race.reward = reward;
    state.race.free = free;
    state.race.opponents = [];
    const start = course[0];
    const next = course[1];
    const angle = Math.atan2(next.y - start.y, next.x - start.x);
    state.cars.forEach((car, index) => {
      car.regularRoute ||= car.route;
      car.regularRouteIndex ??= car.routeIndex;
      const lane = index % 2 === 0 ? -24 : 24;
      const behind = 48 + Math.floor(index / 2) * 50;
      car.x = start.x - Math.cos(angle) * behind - Math.sin(angle) * lane;
      car.y = start.y - Math.sin(angle) * behind + Math.cos(angle) * lane;
      car.angle = angle;
      car.route = course;
      car.routeIndex = 1;
      car.raceOpponent = true;
      car.raceIndex = 1;
      car.raceLaps = 0;
      car.raceSpeed = 185 + (index % 3) * 6;
      state.race.opponents.push(car);
    });
    toast("Corrida em 3... prepare-se!");
    beep(520, .16);
  }

  function updateRace(dt) {
    if (state.race.countdown > 0) {
      state.race.countdown -= dt;
      if (state.race.countdown <= 0) {
        state.race.countdown = 0;
        state.race.active = true;
        toast("Largada! Boa corrida!");
        beep(780, .24);
      }
      return;
    }
    if (!state.race.active) return;
    state.race.elapsed += dt;
    const checkpoint = state.race.route[state.race.checkpoint];
    if (checkpoint && distance(state.car, checkpoint) < 35) {
      state.race.checkpoint += 1;
      beep(860, .08);
      if (state.race.checkpoint >= state.race.route.length) finishRace(true);
    }
    if (state.race.active && state.race.opponents.some((opponent) => opponent.raceLaps > 0)) finishRace(false);
  }

  function finishRace(won) {
    state.race.active = false;
    state.race.countdown = 0;
    for (const car of state.race.opponents) {
      car.raceOpponent = false;
      car.route = car.regularRoute;
      car.routeIndex = car.regularRouteIndex;
    }
    if (!won) {
      toast("O outro carro venceu. Volte à largada e pressione E para tentar outra vez.");
      beep(170, .2);
      refreshHud();
      return;
    }
    state.cash += state.race.reward;
    if (state.bestTime === null || state.race.elapsed < state.bestTime) state.bestTime = state.race.elapsed;
    if (!state.race.free && state.missionIndex < 25 && currentMission()?.kind === "race") {
      state.missionIndex += 1;
      state.missionStage = "pickup";
    }
    saveProgress();
    toast(`Corrida vencida em ${state.race.elapsed.toFixed(1)}s! +$${state.race.reward}.`);
    beep(690, .32);
  }

  function nearestStore() {
    return state.shops.find((shop) => distance(state.player, shop.door) < 54) || null;
  }

  function openStore(name) {
    state.storeOpen = true;
    updateEngineAudio();
    state.keys.clear();
    $("#storeTitle").textContent = name;
    ui.storeItems.replaceChildren();
    food.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "store-item";
      button.innerHTML = `<span><strong>${index + 1} · ${item.name}</strong><small>Na mochila: ${state.inventory[item.id]}</small></span><span>$${item.price}</span>`;
      button.addEventListener("click", () => buyFood(index));
      ui.storeItems.append(button);
    });
    ui.store.classList.remove("hidden");
  }

  function closeStore() {
    state.storeOpen = false;
    ui.store.classList.add("hidden");
    updateEngineAudio();
  }

  function buyFood(index) {
    const item = food[index];
    if (state.cash < item.price) {
      toast(`Falta dinheiro: ${item.name} custa $${item.price}.`);
      return;
    }
    state.cash -= item.price;
    state.inventory[item.id] += 1;
    saveProgress();
    openStore($("#storeTitle").textContent);
    toast(`Comprou ${item.name}! Agora está na mochila.`);
    beep(520, .12);
  }

  function eatFood() {
    if (state.inCar) { toast("Saia do carro para comer."); return; }
    const item = food[state.selectedFood];
    if (state.inventory[item.id] <= 0) { toast(`Você não tem ${item.name} na mochila.`); return; }
    state.inventory[item.id] -= 1;
    saveProgress();
    toast(`Você comeu ${item.name}!`);
    beep(220, .2);
  }

  function changeVehicle() {
    if (state.inCar || distance(state.player, state.car) > 85) { toast("Chegue à garagem, junto ao carro estacionado."); return; }
    const owned = vehicles.filter((vehicle) => state.owned.has(vehicle.id));
    const index = owned.findIndex((vehicle) => vehicle.id === vehicles[state.vehicleIndex].id);
    const next = owned[(index + 1) % owned.length];
    state.vehicleIndex = vehicles.findIndex((vehicle) => vehicle.id === next.id);
    state.car.color = next.color;
    saveProgress();
    toast(`Veículo selecionado: ${next.name}.`);
  }

  function buyVehicle() {
    if (state.inCar || distance(state.player, state.car) > 85) { toast("Chegue à garagem junto ao carro estacionado."); return; }
    const next = vehicles.find((vehicle) => !state.owned.has(vehicle.id));
    if (!next) { toast("Você já tem todos os veículos da garagem."); return; }
    if (state.cash < next.price) { toast(`O ${next.name} custa $${next.price}; junte mais dinheiro.`); return; }
    state.cash -= next.price;
    state.owned.add(next.id);
    state.vehicleIndex = vehicles.findIndex((vehicle) => vehicle.id === next.id);
    saveProgress();
    toast(`Você comprou o ${next.name}!`);
  }

  function handleAction(action) {
    if (action === "interact") interact();
    else if (action === "eat") eatFood();
    else if (action === "pause") togglePause();
    else if (action === "change") changeVehicle();
    else if (action === "buy") buyVehicle();
  }

  function togglePause() {
    if (!state.started || state.storeOpen) return;
    state.paused = !state.paused;
    ui.pause.classList.toggle("hidden", !state.paused);
    updateEngineAudio();
  }

  function refreshHud() {
    const mission = currentMission();
    const completed = state.missionIndex;
    ui.cash.textContent = `$${state.cash}`;
    ui.activityCount.textContent = `${completed} / 25 atividades`;
    ui.progress.style.width = `${completed / 25 * 100}%`;
    ui.best.textContent = state.bestTime === null ? "recorde --" : `recorde ${state.bestTime.toFixed(1)}s`;
    ui.vehicle.textContent = vehicles[state.vehicleIndex].name;
    ui.garage.textContent = state.inCar ? "Dirija com W/S · vire com A/D · Shift freia." : "G troca · B compra quando estiver junto ao carro estacionado.";
    ui.inventory.replaceChildren();
    food.forEach((item, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = `food-row${index === state.selectedFood ? " selected" : ""}`;
      row.setAttribute("aria-pressed", String(index === state.selectedFood));
      row.innerHTML = `<span>${index === state.selectedFood ? "› " : ""}${index + 1} · ${item.name}</span><span class="qty">× ${state.inventory[item.id]}</span>`;
      row.addEventListener("click", () => { state.selectedFood = index; refreshHud(); });
      ui.inventory.append(row);
    });
    ui.raceDots.replaceChildren();
    for (let index = 0; index < 10; index += 1) {
      const dot = document.createElement("i");
      if (completed > 15 + index) dot.className = "done";
      ui.raceDots.append(dot);
    }
    if (state.race.countdown > 0) ui.raceStatus.textContent = `Largada em ${Math.ceil(state.race.countdown)}...`;
    else if (state.race.active) ui.raceStatus.textContent = `Ponto ${state.race.checkpoint} / ${state.race.route.length} · ${state.race.elapsed.toFixed(1)}s`;
    else ui.raceStatus.textContent = completed < 15 ? "Faça os serviços para desbloquear as corridas de missão." : completed < 25 ? `${completed - 15} de 10 corridas concluídas.` : "Dez corridas concluídas · corrida livre disponível.";
    if (!mission) {
      ui.objectiveType.textContent = "BAIRRO LIVRE";
      ui.objectiveName.textContent = "Atividades concluídas!";
      ui.objectiveHint.textContent = "Explore a cidade ou participe da corrida livre.";
      ui.reward.textContent = "completo";
    } else if (mission.kind === "race") {
      ui.objectiveType.textContent = `CORRIDA ${mission.courseIndex + 1} / 10`;
      ui.objectiveName.textContent = mission.name;
      ui.objectiveHint.textContent = "Entre no carro e siga o marcador R até a largada.";
      ui.reward.textContent = `+ $${mission.reward}`;
    } else {
      ui.objectiveType.textContent = mission.kind === "taxi" ? "PASSAGEIRO" : mission.kind === "tow" ? "PEDIDO DE AJUDA" : "ENTREGA";
      ui.objectiveName.textContent = mission.name;
      ui.objectiveHint.textContent = state.missionStage === "pickup" ? `Vá até ${mission.district} e pressione E para começar.` : "Leve o pedido até o marcador de destino e pressione E.";
      ui.reward.textContent = `+ $${mission.reward}`;
    }
  }

  let audioContext;
  function ensureAudioContext() {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume();
      return true;
    } catch (error) {
      console.warn("O navegador não disponibilizou áudio.", error);
      return false;
    }
  }

  function startEngineAudio() {
    if (state.engineOscillator || !ensureAudioContext()) return;
    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 48;
    filter.type = "lowpass";
    filter.frequency.value = 240;
    gain.gain.value = 0;
    oscillator.connect(filter).connect(gain).connect(audioContext.destination);
    oscillator.start();
    state.engineOscillator = oscillator;
    state.engineGain = gain;
  }

  function updateEngineAudio() {
    if (!state.engineGain || !audioContext) return;
    const inMotion = state.started && !state.paused && !state.storeOpen && state.inCar;
    const speed = Math.abs(state.car.speed);
    const maxSpeed = vehicles[state.vehicleIndex].speed;
    const pitch = 48 + Math.min(145, speed * .42) + (inMotion && state.keys.has("w") ? 12 : 0);
    const volume = inMotion ? .018 + speed / maxSpeed * .03 + (state.keys.has("w") ? .008 : 0) : 0;
    state.engineOscillator.frequency.setTargetAtTime(pitch, audioContext.currentTime, .08);
    state.engineGain.gain.setTargetAtTime(volume, audioContext.currentTime, .12);
  }

  function beep(frequency, duration) {
    try {
      if (!ensureAudioContext()) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(.055, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn("O navegador não disponibilizou áudio.", error);
    }
  }

  let toastTimerHandle;
  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("visible");
    state.toastTimer = 2.8;
    window.clearTimeout(toastTimerHandle);
    toastTimerHandle = window.setTimeout(() => ui.toast.classList.remove("visible"), 2800);
  }

  function clamp(value, low, high) {
    return Math.min(high, Math.max(low, value));
  }

  function angleDifference(first, second) {
    return (first - second + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  }

  function frame(timestamp) {
    const dt = Math.min(.05, Math.max(0, (timestamp - state.lastFrame) / 1000 || 0));
    state.lastFrame = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function beginGame() {
    state.started = true;
    ui.start.classList.add("hidden");
    startEngineAudio();
    toast("Boa diversão! Entre no carro amarelo ou explore a pé.");
    beep(440, .12);
  }

  function setKey(key, pressed) {
    const normalized = key.toLowerCase();
    if (pressed) state.keys.add(normalized);
    else state.keys.delete(normalized);
  }

  function keyDown(event) {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
    if (key === "escape") {
      if (state.storeOpen) closeStore();
      else togglePause();
      return;
    }
    if (key === "e" && !event.repeat) handleAction("interact");
    if (key === "f" && !event.repeat) eatFood();
    if (key === "g" && !event.repeat) changeVehicle();
    if (key === "b" && !event.repeat) buyVehicle();
    if (/^[1-3]$/.test(key)) { state.selectedFood = Number(key) - 1; refreshHud(); }
    if (key === "shift") state.keys.add("shift");
    if (key === "w" || key === "arrowup") state.keys.add("w");
    if (key === "a" || key === "arrowleft") state.keys.add("a");
    if (key === "s" || key === "arrowdown") state.keys.add("s");
    if (key === "d" || key === "arrowright") state.keys.add("d");
  }

  function keyUp(event) {
    const key = event.key.toLowerCase();
    if (key === "shift") state.keys.delete("shift");
    if (key === "w" || key === "arrowup") state.keys.delete("w");
    if (key === "a" || key === "arrowleft") state.keys.delete("a");
    if (key === "s" || key === "arrowdown") state.keys.delete("s");
    if (key === "d" || key === "arrowright") state.keys.delete("d");
  }

  function clearKeys() { state.keys.clear(); }

  async function toggleFullscreen() {
    if (document.fullscreenElement === $(".game-column")) {
      await document.exitFullscreen();
      screen.orientation?.unlock?.();
      return;
    }
    if (!document.fullscreenEnabled || typeof $(".game-column").requestFullscreen !== "function") {
      toast("Tela cheia não está disponível neste navegador.");
      return;
    }
    try {
      await $(".game-column").requestFullscreen();
    } catch (error) {
      console.warn("Não foi possível ativar a tela cheia.", error);
      toast("Não foi possível ativar a tela cheia neste navegador.");
      return;
    }
    try {
      await screen.orientation?.lock?.("landscape");
    } catch (error) {
      console.warn("O navegador não permitiu travar a orientação em paisagem.", error);
      toast("Tela cheia ativada. Se precisar, vire o celular de lado.");
    }
  }

  buildCity();
  resizeCanvas();
  refreshHud();
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === $(".game-column");
    $("#fullscreenButton").setAttribute("aria-label", isFullscreen ? "Sair da tela cheia" : "Ativar tela cheia");
    $("#fullscreenButton").title = isFullscreen ? "Sair da tela cheia" : "Tela cheia";
    if (!isFullscreen) screen.orientation?.unlock?.();
    resizeCanvas();
  });
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearKeys);
  $("#fullscreenButton").addEventListener("click", () => {
    toggleFullscreen().catch((error) => {
      console.error("Erro ao alternar tela cheia.", error);
      toast("Ocorreu um erro ao alternar a tela cheia.");
    });
  });
  $("#startButton").addEventListener("click", beginGame);
  $("#resetProgressButton").addEventListener("click", resetProgress);
  $("#pauseButton").addEventListener("click", togglePause);
  $("#resumeButton").addEventListener("click", togglePause);
  $("#closeStore").addEventListener("click", closeStore);
  $("#storePanel").addEventListener("click", (event) => { if (event.target === ui.store) closeStore(); });
  document.querySelectorAll("[data-key]").forEach((button) => {
    const key = button.dataset.key;
    button.addEventListener("pointerdown", (event) => { event.preventDefault(); setKey(key, true); });
    button.addEventListener("pointerup", () => setKey(key, false));
    button.addEventListener("pointerleave", () => setKey(key, false));
    button.addEventListener("pointercancel", () => setKey(key, false));
  });
  document.querySelectorAll("[data-tap]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.tap));
  });
  window.addEventListener("beforeunload", saveProgress);
  requestAnimationFrame(frame);
})();
