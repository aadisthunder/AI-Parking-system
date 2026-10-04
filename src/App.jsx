import { useEffect, useMemo, useState } from "react";
import {
  CarFront,
  CheckCircle,
  CircleParking,
  LogOut,
  MapPin,
  PlusCircle,
  Shield,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";

const STORAGE_KEY = "parking-app-state-v1";
const SESSION_KEY = "parking-app-session-v1";
const SELECTED_LOT_KEY = "parking-app-selected-lot-v1";
const ADMIN_CREDENTIALS = { name: "admin", password: "admin123" };
const DEFAULT_USERS = [{ name: "user", password: "user123" }];

const PARKING_LOTS = [
  {
    id: "tier-1-central",
    name: "Multi Level Car Parking (MLCP) Noida",
    tier: "Tier 1",
    address: "Road No. 18, Pocket L, Sector 18, Noida, Uttar Pradesh 201301, India",
    mapsUrl: "https://maps.google.com/?cid=18290796702792015725",
    totalSlots: 24,
  },
  {
    id: "tier-2-techpark",
    name: "Botanical Garden Metro Ground Parking",
    tier: "Tier 2",
    address:
      "Ground Floor, Metro Station Botanical Garden, Botanical Garden, Sector 38, Noida, Uttar Pradesh 201301, India",
    mapsUrl: "https://maps.google.com/?cid=5850919399519505826",
    totalSlots: 18,
  },
  {
    id: "tier-3-airport",
    name: "Noida City Centre Metro Vehicle Parking",
    tier: "Tier 3",
    address: "H9G4+4GC, Sector 32, Noida, Uttar Pradesh 201301, India",
    mapsUrl: "https://maps.google.com/?cid=16288879160551126182",
    totalSlots: 30,
  },
];

const buildGoogleMapsUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const getSlotsStats = (slots) => {
  const total = Array.isArray(slots) ? slots.length : 0;
  if (!Array.isArray(slots) || !slots.length) {
    return { total, vacant: 0, reserved: 0, occupied: 0 };
  }

  let vacant = 0;
  let reserved = 0;
  let occupied = 0;

  for (const slot of slots) {
    if (slot.status === "vacant") vacant += 1;
    else if (slot.status === "reserved") reserved += 1;
    else if (slot.status === "occupied") occupied += 1;
  }

  return { total, vacant, reserved, occupied };
};

const createDefaultSlots = (totalSlots) =>
  Array.from({ length: totalSlots }, (_, index) => ({
    id: index + 1,
    status: "vacant",
    reservedBy: null,
    reservationHistory: [],
  }));

const normalizeSlot = (slot, index) => ({
  id: Number(slot?.id) || index + 1,
  status:
    slot?.status === "vacant" ||
    slot?.status === "reserved" ||
    slot?.status === "occupied"
      ? slot.status
      : "vacant",
  reservedBy: slot?.reservedBy || null,
  reservationHistory: Array.isArray(slot?.reservationHistory)
    ? slot.reservationHistory
    : slot?.reservedBy
      ? [slot.reservedBy]
      : [],
});

const coerceSlots = (storedSlots, totalSlots) => {
  const defaults = createDefaultSlots(totalSlots);
  if (!Array.isArray(storedSlots) || !storedSlots.length) return defaults;

  const normalized = storedSlots.map((slot, index) => normalizeSlot(slot, index));
  for (let index = 0; index < defaults.length; index += 1) {
    if (!normalized[index]) continue;
    defaults[index] = { ...defaults[index], ...normalized[index], id: index + 1 };
  }
  return defaults;
};

const createDefaultLots = () =>
  Object.fromEntries(
    PARKING_LOTS.map((lot) => [lot.id, createDefaultSlots(lot.totalSlots)]),
  );

const readStorage = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const users =
      Array.isArray(parsed?.users) && parsed.users.length
        ? parsed.users
        : DEFAULT_USERS;

    const lots = createDefaultLots();

    if (parsed?.lots && typeof parsed.lots === "object") {
      for (const lot of PARKING_LOTS) {
        lots[lot.id] = coerceSlots(parsed.lots?.[lot.id], lot.totalSlots);
      }
    } else if (Array.isArray(parsed?.slots) && parsed.slots.length) {
      const primaryLot = PARKING_LOTS[0];
      if (primaryLot) {
        lots[primaryLot.id] = coerceSlots(parsed.slots, primaryLot.totalSlots);
      }
    }

    return { lots, users };
  } catch {
    return { lots: createDefaultLots(), users: DEFAULT_USERS };
  }
};

const readSession = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
    return parsed?.role && parsed?.name ? parsed : null;
  } catch {
    return null;
  }
};

const readSelectedLotId = () => {
  try {
    const stored = localStorage.getItem(SELECTED_LOT_KEY);
    return PARKING_LOTS.some((lot) => lot.id === stored) ? stored : null;
  } catch {
    return null;
  }
};

function App() {
  const [initialData] = useState(() => readStorage());
  const [lots, setLots] = useState(initialData.lots);
  const [users, setUsers] = useState(initialData.users);
  const [activeRole, setActiveRole] = useState("user");
  const [userAuthMode, setUserAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [authError, setAuthError] = useState("");
  const [session, setSession] = useState(() => readSession());
  const [loginToast, setLoginToast] = useState(null);
  const [selectedLotId, setSelectedLotId] = useState(() => readSelectedLotId());

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, lots, users }),
    );
  }, [lots, users]);

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return;
    }
    localStorage.removeItem(SESSION_KEY);
  }, [session]);

  useEffect(() => {
    if (!loginToast) return undefined;

    const timeoutId = setTimeout(() => {
      setLoginToast(null);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [loginToast]);

  useEffect(() => {
    if (!selectedLotId) {
      localStorage.removeItem(SELECTED_LOT_KEY);
      return;
    }
    localStorage.setItem(SELECTED_LOT_KEY, selectedLotId);
  }, [selectedLotId]);

  const selectedLot = useMemo(
    () => PARKING_LOTS.find((lot) => lot.id === selectedLotId) || null,
    [selectedLotId],
  );

  const activeSlots = useMemo(
    () => (selectedLotId ? lots?.[selectedLotId] ?? [] : []),
    [lots, selectedLotId],
  );

  const stats = useMemo(() => {
    const { vacant, occupied, reserved } = getSlotsStats(activeSlots);
    return { vacant, occupied, reserved };
  }, [activeSlots]);

  const analytics = useMemo(() => {
    const perLot = PARKING_LOTS.map((lot) => {
      const lotSlots = lots?.[lot.id] ?? [];
      return { lot, stats: getSlotsStats(lotSlots) };
    });

    const overall = perLot.reduce(
      (acc, entry) => ({
        total: acc.total + entry.stats.total,
        vacant: acc.vacant + entry.stats.vacant,
        reserved: acc.reserved + entry.stats.reserved,
        occupied: acc.occupied + entry.stats.occupied,
      }),
      { total: 0, vacant: 0, reserved: 0, occupied: 0 },
    );

    return { perLot, overall };
  }, [lots]);

  const myReservations = useMemo(
    () =>
      session?.role === "user"
        ? activeSlots.filter(
            (slot) =>
              slot.status === "reserved" &&
              slot.reservedBy?.toLowerCase() === session.name.toLowerCase(),
          )
        : [],
    [activeSlots, session],
  );

  const login = (event) => {
    event.preventDefault();
    setAuthError("");

    if (activeRole === "admin") {
      if (
        name.trim().toLowerCase() !== ADMIN_CREDENTIALS.name.toLowerCase() ||
        password !== ADMIN_CREDENTIALS.password
      ) {
        setAuthError("Invalid admin credentials.");
        return;
      }
    } else {
      const matchedUser = users.find(
        (user) =>
          user.name.toLowerCase() === name.trim().toLowerCase() &&
          user.password === password,
      );
      if (!matchedUser) {
        setAuthError(
          "Invalid user credentials. Register first if you are a new user.",
        );
        return;
      }
    }

    const loggedInName = name.trim();
    const loggedInRole = activeRole;

    setSession({ role: loggedInRole, name: loggedInName });
    setLoginToast({ role: loggedInRole, name: loggedInName });
    setName("");
    setPassword("");
  };

  const registerUser = (event) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");

    const normalizedName = registerName.trim();
    if (!normalizedName || registerPassword.length < 4) {
      setRegisterError("Enter a username and password (min 4 characters).");
      return;
    }

    const exists = users.some(
      (user) => user.name.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (exists) {
      setRegisterError("Username already exists. Please choose another one.");
      return;
    }

    setUsers((prevUsers) => [
      ...prevUsers,
      { name: normalizedName, password: registerPassword },
    ]);
    setRegisterName("");
    setRegisterPassword("");
    setRegisterSuccess(
      "User registered successfully. You can now login as user.",
    );
  };

  const logout = () => {
    setSession(null);
    setSelectedLotId(null);
    setAuthError("");
  };

  const updateSlot = (lotId, slotId, updater) => {
    if (!lotId) return;
    setLots((prevLots) => {
      const prevSlots = Array.isArray(prevLots?.[lotId]) ? prevLots[lotId] : [];
      return {
        ...prevLots,
        [lotId]: prevSlots.map((slot) =>
          slot.id === slotId ? updater(slot) : slot,
        ),
      };
    });
  };

  const handleAdminToggleFilled = (slotId) => {
    if (!selectedLotId) return;
    updateSlot(selectedLotId, slotId, (slot) => {
      if (slot.status === "occupied") {
        return { ...slot, status: "vacant", reservedBy: null };
      }
      if (slot.status === "vacant") {
        return { ...slot, status: "occupied", reservedBy: null };
      }
      return { ...slot, status: "vacant", reservedBy: null };
    });
  };

  const handleUserReserve = (slotId) => {
    if (!session || !selectedLotId) return;
    updateSlot(selectedLotId, slotId, (slot) => {
      if (slot.status !== "vacant") return slot;
      const history = slot.reservationHistory.includes(session.name)
        ? slot.reservationHistory
        : [...slot.reservationHistory, session.name];

      return {
        ...slot,
        status: "reserved",
        reservedBy: session.name,
        reservationHistory: history,
      };
    });
  };

  const handleUserCancel = (slotId) => {
    if (!session || !selectedLotId) return;
    updateSlot(selectedLotId, slotId, (slot) => {
      const isMine =
        slot.reservedBy?.toLowerCase() === session.name.toLowerCase();
      if (slot.status === "reserved" && isMine) {
        return { ...slot, status: "vacant", reservedBy: null };
      }
      return slot;
    });
  };

  const resetLot = (lotId) => {
    const lot = PARKING_LOTS.find((candidate) => candidate.id === lotId);
    if (!lot) return;

    setLots((prevLots) => ({
      ...prevLots,
      [lot.id]: createDefaultSlots(lot.totalSlots),
    }));
  };

  const reservedUsers = useMemo(() => {
    const allUsers = activeSlots
      .flatMap((slot) => slot.reservationHistory)
      .filter((value, index, self) => self.indexOf(value) === index);

    return allUsers;
  }, [activeSlots]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      {loginToast ? (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle size={16} />
            Login successful: {loginToast.name} ({loginToast.role})
          </p>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-surface)]/90 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                <CircleParking size={16} />
                Smart Parking Control
              </p>
              <h1 className="text-3xl font-bold leading-tight text-[var(--text-main)] sm:text-4xl">
                {session
                  ? session.role === "admin"
                    ? "Admin Dashboard"
                    : "User Dashboard"
                  : "ParkSense"}
              </h1>
              
            </div>
            {session ? (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <LogOut size={16} />
                Logout ({session.name})
              </button>
            ) : null}
          </div>
        </header>

        {!session ? (
          <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-surface)] p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Login</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Select your role and enter credentials to continue.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg-soft)] p-1">
                {["user", "admin"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setActiveRole(role);
                      if (role === "admin") {
                        setUserAuthMode("login");
                      }
                      setAuthError("");
                      setRegisterError("");
                      setRegisterSuccess("");
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${
                      activeRole === role
                        ? "bg-white text-[var(--brand)] shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {role === "admin" ? (
                      <span className="inline-flex items-center gap-2">
                        <Shield size={15} /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <UserRound size={15} /> User
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {activeRole === "user" ? (
                <div className="mt-5">
                  <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg-soft)] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserAuthMode("login");
                        setAuthError("");
                        setRegisterError("");
                        setRegisterSuccess("");
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        userAuthMode === "login"
                          ? "bg-white text-[var(--brand)] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      User Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserAuthMode("register");
                        setAuthError("");
                        setRegisterError("");
                        setRegisterSuccess("");
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        userAuthMode === "register"
                          ? "bg-white text-[var(--brand)] shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      User Register
                    </button>
                  </div>

                  {userAuthMode === "login" ? (
                    <form onSubmit={login} className="space-y-3">
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Username"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-200"
                        required
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Password"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-200"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Continue to Dashboard
                      </button>
                    </form>
                  ) : (
                    <div className="border-t border-slate-200 pt-4">
                      <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <PlusCircle size={15} /> New User Registration
                      </p>
                      <form onSubmit={registerUser} className="space-y-3">
                        <input
                          type="text"
                          value={registerName}
                          onChange={(event) =>
                            setRegisterName(event.target.value)
                          }
                          placeholder="New username"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-200"
                          required
                        />
                        <input
                          type="password"
                          value={registerPassword}
                          onChange={(event) =>
                            setRegisterPassword(event.target.value)
                          }
                          placeholder="New password"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-200"
                          required
                        />
                        <button
                          type="submit"
                          className="w-full rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--brand)] transition hover:bg-blue-100"
                        >
                          Register User
                        </button>
                      </form>
                    </div>
                  )}

                  {authError ? (
                    <p className="mt-3 text-sm text-[var(--warn)]">
                      {authError}
                    </p>
                  ) : null}
                  {registerError ? (
                    <p className="mt-3 text-sm text-[var(--warn)]">
                      {registerError}
                    </p>
                  ) : null}
                  {registerSuccess ? (
                    <p className="mt-3 text-sm text-[var(--ok)]">
                      {registerSuccess}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-5">
                  <form onSubmit={login} className="space-y-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Username"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-200"
                      required
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-200"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Continue to Dashboard
                    </button>
                  </form>
                  {authError ? (
                    <p className="mt-3 text-sm text-[var(--warn)]">
                      {authError}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <aside className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-surface)] p-6 shadow-sm">
              <h3 className="text-xl font-bold">Demo Credentials</h3>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
                <p>
                  <strong className="text-slate-800">Admin:</strong> `admin /
                  admin123`
                </p>
                <p>
                  <strong className="text-slate-800">Starter User:</strong>{" "}
                  `user / user123`
                </p>
              </div>

              <div className="mt-6 rounded-xl bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-muted)]">
                Admin cannot register. New users can self-register from the user
                tab and reserve vacant slots.
              </div>
            </aside>
          </section>
	        ) : (
	          <section className="space-y-5">
	            {session.role === "admin" ? (
	              <AdminAnalyticsCard
	                analytics={analytics}
	                selectedLotId={selectedLotId}
	                onSelect={setSelectedLotId}
	              />
	            ) : null}

	            {session.role === "user" ? (
	              <ParkingSelectCard
	                lots={PARKING_LOTS}
	                selectedLotId={selectedLotId}
	                onSelect={setSelectedLotId}
	                selectedLot={selectedLot}
	              />
	            ) : null}

	            {selectedLotId ? (
	              <>
	                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
	                  <StatsCard
	                    label="Total Slots"
	                    value={activeSlots.length}
	                    tone="total"
	                  />
	                  <StatsCard
	                    label="Vacant"
	                    value={stats.vacant}
	                    tone="vacant"
	                  />
	                  <StatsCard
	                    label="Reserved"
	                    value={stats.reserved}
	                    tone="reserved"
	                  />
	                  <StatsCard
	                    label="Filled"
	                    value={stats.occupied}
	                    tone="occupied"
	                  />
	                </div>

	                {session.role === "user" ? (
	                  <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-muted)] shadow-sm">
	                    <p className="inline-flex items-center gap-2 font-semibold text-slate-700">
	                      <Ticket size={16} /> My Reservations:{" "}
	                      {myReservations.length}
	                    </p>
	                    <p className="mt-1">
	                      Tap a vacant slot to reserve. Tap your reserved slot
	                      again to cancel.
	                    </p>
	                    <p className="mt-1">
	                      Users who have reserved slots:{" "}
	                      {reservedUsers.length
	                        ? reservedUsers.join(", ")
	                        : "None yet"}
	                    </p>
	                  </div>
	                ) : (
	                  <div className="flex flex-wrap gap-3">
	                    <button
	                      type="button"
	                      onClick={() => resetLot(selectedLotId)}
	                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
	                    >
	                      Reset Selected Parking
	                    </button>
	                    <p className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-soft)] px-4 py-2 text-sm text-slate-700">
	                      <Users size={16} /> Click any slot to mark it filled or
	                      vacant.
	                    </p>
	                    <p className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
	                      <Ticket size={16} /> Reserved by users:{" "}
	                      {reservedUsers.length ? reservedUsers.join(", ") : "None"}
	                    </p>
	                  </div>
	                )}

	                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
	                  {activeSlots.map((slot) => (
	                    <SlotCard
	                      key={slot.id}
	                      slot={slot}
	                      role={session.role}
	                      sessionName={session.name}
	                      onAdminToggle={handleAdminToggleFilled}
	                      onUserReserve={handleUserReserve}
	                      onUserCancel={handleUserCancel}
	                    />
	                  ))}
	                </div>
	              </>
	            ) : (
	              <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-muted)] shadow-sm">
	                <p className="inline-flex items-center gap-2 font-semibold text-slate-700">
	                  <MapPin size={16} /> Select a parking location to view slots.
	                </p>
	                <p className="mt-1">
	                  Choose one of the parkings above; then vacancy and slot
	                  status will appear here.
	                </p>
	              </div>
	            )}
	          </section>
	        )}
	      </div>
	    </main>
	  );
	}

function ParkingSelectCard({ lots, selectedLotId, onSelect, selectedLot }) {
  const visibleLots = selectedLotId
    ? lots.filter((lot) => lot.id === selectedLotId)
    : lots;

  return (
    <article className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-main)]">
            Select Parking
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Pick a location to view vacancy and slots.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-2 text-sm text-[var(--text-muted)] sm:justify-end">
          {selectedLot ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-soft)] px-3 py-2">
                <MapPin size={16} />
                Viewing:{" "}
                <span className="font-semibold text-slate-800">
                  {selectedLot.name}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Change Location
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-soft)] px-3 py-2">
              <MapPin size={16} />
              No parking selected
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {visibleLots.map((lot) => {
          const selected = lot.id === selectedLotId;
          const mapsUrl =
            lot.mapsUrl ?? buildGoogleMapsUrl(`${lot.name}, ${lot.address}`);
          const nextSelection = selected ? null : lot.id;

          return (
            <div
              key={lot.id}
              onClick={() => onSelect(nextSelection)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(nextSelection);
                }
              }}
              role="button"
              tabIndex={0}
              className={`group cursor-pointer rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                selected
                  ? "border-blue-300 bg-[var(--brand-soft)]"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-400"
              }`}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {lot.tier}
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {lot.name}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {lot.totalSlots} slots
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">{lot.address}</p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className={`text-xs font-semibold ${
                    selected ? "text-blue-800" : "text-slate-500"
                  }`}
                >
                  {selected ? "Selected" : "Select"}
                </span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Google Maps
                  <span className="text-slate-400">↗</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function AdminAnalyticsCard({ analytics, selectedLotId, onSelect }) {
  const visibleLots = selectedLotId
    ? analytics.perLot.filter(({ lot }) => lot.id === selectedLotId)
    : analytics.perLot;

  return (
    <article className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-main)]">
            All Locations Analytics
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Live totals across all three parkings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            Total: {analytics.overall.total}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            Vacant: {analytics.overall.vacant}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            Reserved: {analytics.overall.reserved}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            Filled: {analytics.overall.occupied}
          </span>
          {selectedLotId ? (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Change Location
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {visibleLots.map(({ lot, stats }) => {
          const selected = lot.id === selectedLotId;
          const nextSelection = selected ? null : lot.id;
          const mapsUrl =
            lot.mapsUrl ?? buildGoogleMapsUrl(`${lot.name}, ${lot.address}`);

          return (
            <div
              key={lot.id}
              onClick={() => onSelect(nextSelection)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(nextSelection);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              className={`cursor-pointer rounded-2xl border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                selected
                  ? "border-blue-300 bg-[var(--brand-soft)]"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-400"
              }`}
            >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {lot.tier}
            </p>
            <p className="mt-1 text-base font-bold text-slate-900">{lot.name}</p>
            <p className="mt-1 text-sm text-slate-600">{lot.address}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-xl bg-slate-50 px-3 py-1.5 text-slate-700">
                Total {stats.total}
              </span>
              <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-700">
                Vacant {stats.vacant}
              </span>
              <span className="rounded-xl bg-amber-50 px-3 py-1.5 text-amber-700">
                Reserved {stats.reserved}
              </span>
              <span className="rounded-xl bg-rose-50 px-3 py-1.5 text-rose-700">
                Filled {stats.occupied}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span
                className={`text-xs font-semibold ${
                  selected ? "text-blue-800" : "text-slate-500"
                }`}
              >
                {selected ? "Selected" : "Select"}
              </span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Google Maps
                <span className="text-slate-400">↗</span>
              </a>
            </div>
          </div>
          );
        })}
      </div>
    </article>
  );
}

function StatsCard({ label, value, tone }) {
  const toneMap = {
    total: "bg-slate-50 border-slate-200 text-slate-700",
    vacant: "bg-emerald-50 border-emerald-200 text-emerald-700",
    reserved: "bg-amber-50 border-amber-200 text-amber-700",
    occupied: "bg-rose-50 border-rose-200 text-rose-700",
  };

  return (
    <article
      className={`rounded-2xl border px-4 py-3 shadow-sm ${toneMap[tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </article>
  );
}

function SlotCard({
  slot,
  role,
  sessionName,
  onAdminToggle,
  onUserReserve,
  onUserCancel,
}) {
  const isVacant = slot.status === "vacant";
  const isOccupied = slot.status === "occupied";
  const isReserved = slot.status === "reserved";
  const mine = slot.reservedBy?.toLowerCase() === sessionName.toLowerCase();

  let slotClasses =
    "border-slate-200 bg-white text-slate-700 hover:border-slate-400";
  if (isVacant)
    slotClasses =
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400";
  if (isOccupied)
    slotClasses =
      "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400";
  if (isReserved)
    slotClasses =
      "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400";

  const onClick = () => {
    if (role === "admin") {
      onAdminToggle(slot.id);
      return;
    }
    if (isVacant) {
      onUserReserve(slot.id);
      return;
    }
    if (isReserved && mine) {
      onUserCancel(slot.id);
    }
  };

  const disabledForUser =
    role === "user" && (isOccupied || (isReserved && !mine));

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabledForUser}
      className={`group rounded-2xl border p-3 text-left shadow-sm transition ${slotClasses} ${
        disabledForUser
          ? "cursor-not-allowed opacity-60"
          : "hover:-translate-y-1"
      }`}
      aria-label={`Parking slot ${slot.id}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold">Slot {slot.id}</span>
        <CarFront
          size={18}
          className={`transition group-hover:scale-110 ${isVacant ? "opacity-65" : "opacity-100"}`}
        />
      </div>
      <p className="text-sm font-semibold capitalize">{slot.status}</p>
      <p className="mt-1 min-h-5 text-xs">
        {isReserved ? `Reserved by ${slot.reservedBy}` : "Ready"}
      </p>
      <p className="mt-1 min-h-5 text-[11px] opacity-85">
        {slot.reservationHistory.length
          ? `Users reserved: ${slot.reservationHistory.join(", ")}`
          : "No reservations yet"}
      </p>
    </button>
  );
}

export default App;
