/**
 * Events.tsx - Style Event Hub (Member Tab 4)
 *
 * Features:
 * - Filter: Live, Upcoming, Past
 * - RSVP toggle
 * - Location badges (Virtual Room / Online / Offline)
 */
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useEventStore, generateEventId } from "../../stores/useEventStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useGameStore } from "../../stores/useGameStore";
import type {
  EventItem,
  EventStatus,
  EventLocation,
} from "../../stores/useEventStore";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Monitor,
  Users,
  Check,
  Clock,
  Sparkles,
  Radio,
  ChevronRight,
  Zap,
  LayoutList,
  ChevronLeft,
  X,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const LOCATION_CONFIG: Record<
  EventLocation,
  { icon: React.ReactNode; label: string; color: string }
> = {
  "virtual-room": {
    icon: <Sparkles size={12} />,
    label: " Di Virtual Room TemuSpace",
    color: "#34D399",
  },
  "online-external": {
    icon: <ExternalLink size={12} />,
    label: " Online Eksternal",
    color: "#3B82F6",
  },
  offline: { icon: <MapPin size={12} />, label: " Offline", color: "#F59E0B" },
};

export default function Events() {
  const { t } = useTranslation();
  const { events, toggleRSVP, addEvent } = useEventStore();
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const [filter, setFilter] = useState<EventStatus | "all">("all");
  const [locationFilter, setLocationFilter] = useState<EventLocation | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const currentUser = useAuthStore((s) => s.currentUser);

  // Calendar Day Detail Modal State
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);

  // RSVP Form Modal State
  const [rsvpModalEvent, setRsvpModalEvent] = useState<EventItem | null>(null);
  const [rsvpAnswers, setRsvpAnswers] = useState<Record<string, string>>({});

  // Add Event Modal State
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventDate, setNewEventDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventLocation, setNewEventLocation] =
    useState<EventLocation>("virtual-room");
  const [newEventLocationDetail, setNewEventLocationDetail] = useState("");

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthName = new Date(calYear, calMonth).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const approvedEvents = events.filter((e) => e.approvalStatus === "approved");
  const getEventsForDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return approvedEvents.filter((e) => e.date === dateStr);
  };

  const filtered = approvedEvents.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (locationFilter !== "all" && e.location !== locationFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q) ||
      (e.organizer || "").toLowerCase().includes(q) ||
      (e.locationDetail || "").toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 16px 0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--text-primary)",
            paddingTop: 8,
          }}
        >
          Events
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => setShowAddEventModal(true)}
            style={{
              padding: "6px 16px",
              background: "var(--accent-green)",
              border: "none",
              borderRadius: "var(--radius-pill)",
              color: "#FFF",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Sparkles size={14} /> Ajukan Event
          </button>
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "var(--bg-elevated)",
              boxShadow: "var(--shadow-sm)",
              borderRadius: "var(--radius-xl)",
              padding: 3,
            }}
          >
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "6px 12px",
                background:
                  viewMode === "list" ? "var(--accent-blue)" : "transparent",
                border: "none",
                borderRadius: 6,
                color: viewMode === "list" ? "#FFF" : "var(--text-muted)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <LayoutList size={14} /> List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              style={{
                padding: "6px 12px",
                background:
                  viewMode === "calendar"
                    ? "var(--accent-blue)"
                    : "transparent",
                border: "none",
                borderRadius: 6,
                color: viewMode === "calendar" ? "#FFF" : "var(--text-muted)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Calendar size={14} /> Kalender
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div
          style={{
            background: "var(--bg-elevated)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-3xl)",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <button
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear(calYear - 1);
                } else setCalMonth(calMonth - 1);
              }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {monthName}
            </span>
            <button
              onClick={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear(calYear + 1);
                } else setCalMonth(calMonth + 1);
              }}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day Headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              marginBottom: 8,
            }}
          >
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  padding: 4,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
            }}
          >
            {Array.from({ length: firstDay }, (_, i) => (
              <div
                key={`empty-${i}`}
                style={{ aspectRatio: "1", padding: 4 }}
              />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === calMonth &&
                new Date().getFullYear() === calYear;
              return (
                <div
                  key={day}
                  onClick={() => setSelectedCalendarDay(day)}
                  style={{
                    aspectRatio: "1",
                    padding: 6,
                    background: isToday
                      ? "var(--bg-primary)"
                      : "var(--bg-card)",
                    border: isToday
                      ? "2px solid var(--accent-blue)"
                      : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-xl)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    e.currentTarget.style.zIndex = "2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.borderColor = isToday
                      ? "var(--accent-blue)"
                      : "var(--border-subtle)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.zIndex = "1";
                  }}
                  title={`Klik untuk melihat detail agenda tanggal ${day}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: isToday ? 800 : 600,
                        color: isToday
                          ? "var(--accent-blue)"
                          : "var(--text-primary)",
                      }}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "1px 5px",
                          borderRadius: "var(--radius-pill)",
                          background: isToday ? "rgba(59,130,246,0.15)" : "rgba(35,122,87,0.12)",
                          color: isToday ? "var(--accent-blue)" : "var(--accent-green)",
                        }}
                      >
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  {dayEvents.slice(0, 3).map((evt) => (
                    <div
                      key={evt.id}
                      style={{
                        fontSize: 10,
                        padding: "2px 4px",
                        background:
                          evt.status === "live" ? "#FEE2E2" : "var(--bg-card)",
                        border: `1px solid ${evt.status === "live" ? "#FCA5A5" : "var(--border-subtle)"}`,
                        color:
                          evt.status === "live"
                            ? "#B91C1C"
                            : "var(--text-primary)",
                        borderRadius: 4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                      }}
                    >
                      {evt.coverEmoji || "📅"} {evt.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                        paddingLeft: 2,
                      }}
                    >
                      +{dayEvents.length - 3} lainnya
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <>
          {/* Search & Location Filter Bar */}
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari event komunitas (judul, pembicara, topik, tags)..."
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 46px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-pill)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "var(--shadow-sm)",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-green)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  title="Hapus pencarian"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Combined Filter Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {/* Status Filter Chips */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  paddingBottom: 4,
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
                {(
                  [
                    { key: "all", label: "Semua Status" },
                    { key: "live", label: "🔴 Live Now" },
                    { key: "upcoming", label: "Mendatang" },
                    { key: "past", label: "Selesai" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    style={{
                      padding: "6px 14px",
                      background:
                        filter === key
                          ? key === "live"
                            ? "#EF4444"
                            : "var(--accent-green)"
                          : "var(--bg-elevated)",
                      border: `1px solid ${filter === key ? (key === "live" ? "#EF4444" : "var(--accent-green)") : "var(--border-subtle)"}`,
                      borderRadius: "var(--radius-pill)",
                      color: filter === key ? "#FFF" : "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      whiteSpace: "nowrap",
                      boxShadow: filter === key ? "var(--shadow-sm)" : "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Location Filter & Reset */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-elevated)", padding: "4px 10px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-subtle)" }}>
                  <MapPin size={13} color="var(--text-muted)" />
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value as any)}
                    style={{
                      padding: "2px 4px",
                      background: "transparent",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      outline: "none",
                      cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    <option value="all">Semua Lokasi</option>
                    <option value="virtual-room">Virtual Room TemuSpace</option>
                    <option value="online-external">Online Eksternal</option>
                    <option value="offline">Offline / Tatap Muka</option>
                  </select>
                </div>

                {(searchQuery || filter !== "all" || locationFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilter("all");
                      setLocationFilter("all");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "none",
                      border: "none",
                      color: "var(--accent-green)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Event Cards */}
          {filtered.map((event) => {
            const loc = LOCATION_CONFIG[event.location];
            return (
              <div
                key={event.id}
                style={{
                  background: "var(--bg-elevated)",
                  border: `1px solid ${event.status === "live" ? "rgba(239,68,68,0.3)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-3xl)",
                  padding: 24,
                  marginBottom: 16,
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                {/* Live indicator */}
                {event.status === "live" && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "var(--radius-pill)",
                      color: "#EF4444",
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 16,
                      animation: "pulse-ring 2s ease-in-out infinite",
                    }}
                  >
                    <Radio size={14} />
                    SEDANG BERLANGSUNG
                  </div>
                )}

                {/* Title & emoji */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "var(--radius-xl)",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      flexShrink: 0,
                    }}
                  >
                    {event.coverEmoji || "📅"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {event.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {event.description.slice(0, 120)}...
                    </p>
                  </div>
                </div>

                {/* Meta info */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginBottom: 20,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Calendar size={14} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>
                      {formatDate(event.date)}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Clock size={14} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>{event.time}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: loc.color,
                    }}
                  >
                    {loc.icon}
                    <span style={{ fontWeight: 600 }}>{loc.label}</span>
                    {event.location !== "virtual-room" && (
                      <span
                        style={{ color: "var(--text-muted)", fontWeight: 400 }}
                      >
                        - {event.locationDetail}
                      </span>
                    )}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Users size={14} color="var(--text-muted)" />
                    <span style={{ fontWeight: 500 }}>
                      {event.attendees}/{event.capacity} peserta
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>
                      {event.organizerAvatar}
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      oleh {event.organizer}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 20,
                  }}
                >
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 10px",
                        background: "rgba(35,122,87,0.1)",
                        borderRadius: "var(--radius-pill)",
                        color: "var(--accent-green)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      height: 6,
                      background: "var(--bg-primary)",
                      borderRadius: "var(--radius-pill)",
                      overflow: "hidden",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, (event.attendees / event.capacity) * 100)}%`,
                        height: "100%",
                        background:
                          event.attendees / event.capacity > 0.9
                            ? "#EF4444"
                            : "var(--accent-green)",
                        borderRadius: "var(--radius-pill)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 12 }}>
                  {event.status !== "past" && (
                    <button
                      onClick={() => {
                        if (event.isRSVPed) {
                          toggleRSVP(event.id);
                        } else if (
                          event.formFields &&
                          event.formFields.length > 0
                        ) {
                          setRsvpModalEvent(event);
                          setRsvpAnswers({});
                        } else {
                          toggleRSVP(event.id, {
                            userId: currentUser!.id,
                            userName: currentUser!.name,
                            userAvatar: currentUser!.avatar,
                            answers: {},
                            timestamp: Date.now(),
                          });
                        }
                      }}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "12px 16px",
                        background: event.isRSVPed
                          ? "rgba(35,122,87,0.1)"
                          : "var(--accent-green)",
                        border: event.isRSVPed
                          ? "1px solid var(--accent-green)"
                          : "none",
                        borderRadius: "var(--radius-pill)",
                        color: event.isRSVPed ? "var(--accent-green)" : "#FFF",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: event.isRSVPed ? "none" : "var(--shadow-sm)",
                        transition: "all 0.2s",
                      }}
                    >
                      {event.isRSVPed ? <Check size={18} /> : <Zap size={18} />}
                      {event.isRSVPed ? "Terdaftar" : "Daftar / RSVP"}
                    </button>
                  )}
                  {event.location === "virtual-room" &&
                    event.status === "live" && (
                      <button
                        onClick={() => setActiveTab("virtual-room")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px 20px",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-medium)",
                          borderRadius: "var(--radius-pill)",
                          color: "var(--text-primary)",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "var(--shadow-sm)",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <Monitor size={18} />
                        Join Virtual Room
                      </button>
                    )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                background: "var(--bg-elevated)",
                border: "1px dashed var(--border-subtle)",
                borderRadius: "var(--radius-3xl)",
                color: "var(--text-muted)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Calendar size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                Tidak ada event ditemukan
              </div>
              <div style={{ fontSize: 13, maxWidth: 360, margin: "0 auto 16px" }}>
                {searchQuery || filter !== "all" || locationFilter !== "all"
                  ? "Coba sesuaikan kata kunci pencarian atau reset filter untuk melihat event lainnya."
                  : "Belum ada event yang dijadwalkan saat ini."}
              </div>
              {(searchQuery || filter !== "all" || locationFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                    setLocationFilter("all");
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "var(--accent-green)",
                    border: "none",
                    borderRadius: "var(--radius-pill)",
                    color: "#FFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* RSVP Form Modal */}
      {rsvpModalEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              width: "100%",
              maxWidth: 500,
              borderRadius: "var(--radius-3xl)",
              padding: 24,
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                Your Info
              </h2>
              <button
                onClick={() => setRsvpModalEvent(null)}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--bg-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  overflow: "hidden",
                }}
              >
                {currentUser?.avatar.startsWith("http") ||
                  currentUser?.avatar.startsWith("data:image") ? (
                  <img
                    src={currentUser.avatar}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  currentUser?.avatar
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {currentUser?.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {currentUser?.id.toLowerCase()}@temuspace.com
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 24,
                maxHeight: "50vh",
                overflowY: "auto",
              }}
            >
              {rsvpModalEvent.formFields?.map((field) => (
                <div key={field.id}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: 8,
                    }}
                  >
                    {field.label}{" "}
                    {field.required && (
                      <span style={{ color: "#EF4444" }}>*</span>
                    )}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={rsvpAnswers[field.id] || ""}
                      onChange={(e) =>
                        setRsvpAnswers({
                          ...rsvpAnswers,
                          [field.id]: e.target.value,
                        })
                      }
                      placeholder="Your answer..."
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-xl)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={rsvpAnswers[field.id] || ""}
                      onChange={(e) =>
                        setRsvpAnswers({
                          ...rsvpAnswers,
                          [field.id]: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-xl)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                      }}
                    >
                      <option value="">Select option...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={rsvpAnswers[field.id] || ""}
                      onChange={(e) =>
                        setRsvpAnswers({
                          ...rsvpAnswers,
                          [field.id]: e.target.value,
                        })
                      }
                      placeholder="Your answer..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-xl)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const requiredFields =
                  rsvpModalEvent.formFields?.filter((f) => f.required) || [];
                const missing = requiredFields.find(
                  (f) => !rsvpAnswers[f.id] || !rsvpAnswers[f.id].trim(),
                );
                if (missing) {
                  alert(`Please fill in required field: ${missing.label}`);
                  return;
                }

                toggleRSVP(rsvpModalEvent.id, {
                  userId: currentUser!.id,
                  userName: currentUser!.name,
                  userAvatar: currentUser!.avatar,
                  answers: rsvpAnswers,
                  timestamp: Date.now(),
                });
                setRsvpModalEvent(null);
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "#EC4899",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: "var(--radius-xl)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Register
            </button>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              width: "100%",
              maxWidth: 500,
              borderRadius: "var(--radius-3xl)",
              padding: 24,
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                Ajukan Event Baru
              </h2>
              <button
                onClick={() => setShowAddEventModal(false)}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <input
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Judul Event *"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <textarea
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                placeholder="Deskripsi..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical",
                }}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  type="date"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-xl)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <input
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  placeholder="Waktu (cth: 19:00 WITA)"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-xl)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { key: "virtual-room" as const, label: "Virtual Room" },
                  { key: "online-external" as const, label: "Online" },
                  { key: "offline" as const, label: "Offline" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setNewEventLocation(key)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background:
                        newEventLocation === key
                          ? "rgba(59, 130, 246,0.1)"
                          : "var(--bg-primary)",
                      border: `1px solid ${newEventLocation === key ? "rgba(59, 130, 246,0.3)" : "var(--border-subtle)"}`,
                      borderRadius: "var(--radius-lg)",
                      color:
                        newEventLocation === key
                          ? "var(--accent-terracotta)"
                          : "var(--text-muted)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                value={newEventLocationDetail}
                onChange={(e) => setNewEventLocationDetail(e.target.value)}
                placeholder="Detail Lokasi"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <button
              onClick={() => {
                if (!newEventTitle.trim()) {
                  alert("Judul Event harus diisi!");
                  return;
                }
                const evt: EventItem = {
                  id: generateEventId(),
                  title: newEventTitle,
                  description: newEventDesc,
                  organizer: currentUser?.name || "Unknown",
                  organizerAvatar: currentUser?.avatar || "",
                  date: newEventDate,
                  time: newEventTime,
                  status: "upcoming",
                  location: newEventLocation,
                  locationDetail: newEventLocationDetail,
                  coverEmoji: "✨",
                  capacity: 50,
                  attendees: 0,
                  isRSVPed: false,
                  tags: [],
                  createdAt: Date.now(),
                  approvalStatus: "pending",
                };
                addEvent(evt);
                setShowAddEventModal(false);
                setNewEventTitle("");
                setNewEventDesc("");
                alert("Event berhasil diajukan! Menunggu persetujuan Admin.");
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--accent-green)",
                border: "none",
                borderRadius: "var(--radius-xl)",
                color: "#FFF",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Ajukan Event
            </button>
          </div>
        </div>
      )}

      {/* Calendar Day Details Modal */}
      {selectedCalendarDay !== null && (() => {
        const selectedDateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedCalendarDay).padStart(2, "0")}`;
        const dayEvents = getEventsForDay(selectedCalendarDay);
        const formattedDate = formatDate(selectedDateStr);

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              padding: 20,
            }}
            onClick={() => setSelectedCalendarDay(null)}
          >
            <div
              style={{
                background: "var(--bg-elevated)",
                width: "100%",
                maxWidth: 600,
                maxHeight: "88vh",
                borderRadius: "var(--radius-3xl)",
                padding: 0,
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-xl)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-primary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--radius-2xl)",
                      background: "rgba(59, 130, 246, 0.12)",
                      color: "var(--accent-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      {formattedDate}
                    </h2>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        margin: "3px 0 0 0",
                        fontWeight: 500,
                      }}
                    >
                      {dayEvents.length > 0
                        ? `${dayEvents.length} event dijadwalkan pada hari ini`
                        : "Tidak ada event dijadwalkan pada hari ini"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCalendarDay(null)}
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.background = "var(--border-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "var(--bg-elevated)";
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content List */}
              <div
                style={{
                  padding: 24,
                  overflowY: "auto",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {dayEvents.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "rgba(100, 116, 139, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Calendar size={32} />
                    </div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      Agenda Masih Kosong
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        maxWidth: 340,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      Belum ada event yang dijadwalkan untuk tanggal ini. Ingin mengadakan meetup, webinar, atau sesi belajar bersama?
                    </p>
                    <button
                      onClick={() => {
                        setNewEventDate(selectedDateStr);
                        setSelectedCalendarDay(null);
                        setShowAddEventModal(true);
                      }}
                      style={{
                        marginTop: 8,
                        padding: "10px 20px",
                        background: "var(--accent-green)",
                        border: "none",
                        borderRadius: "var(--radius-pill)",
                        color: "#FFF",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <Sparkles size={16} /> Usulkan Event pada Tanggal Ini
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {dayEvents.map((evt) => {
                        const loc = LOCATION_CONFIG[evt.location];
                        return (
                          <div
                            key={evt.id}
                            style={{
                              background: "var(--bg-primary)",
                              border: `1px solid ${evt.status === "live" ? "rgba(239,68,68,0.3)" : "var(--border-subtle)"}`,
                              borderRadius: "var(--radius-2xl)",
                              padding: 18,
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                              boxShadow: "var(--shadow-sm)",
                            }}
                          >
                            {/* Title & Status */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: 12,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 24 }}>{evt.coverEmoji || "📅"}</span>
                                <div>
                                  <h3
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: "var(--text-primary)",
                                      margin: 0,
                                    }}
                                  >
                                    {evt.title}
                                  </h3>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      marginTop: 4,
                                    }}
                                  >
                                    <span style={{ fontSize: 13 }}>{evt.organizerAvatar}</span>
                                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                      oleh {evt.organizer}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Status Badge */}
                              {evt.status === "live" ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 8px",
                                    background: "rgba(239,68,68,0.15)",
                                    color: "#EF4444",
                                    borderRadius: "var(--radius-pill)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  <Radio size={12} /> LIVE
                                </span>
                              ) : evt.status === "upcoming" ? (
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    background: "rgba(59,130,246,0.12)",
                                    color: "var(--accent-blue)",
                                    borderRadius: "var(--radius-pill)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  Mendatang
                                </span>
                              ) : (
                                <span
                                  style={{
                                    padding: "4px 8px",
                                    background: "rgba(107,114,128,0.12)",
                                    color: "var(--text-muted)",
                                    borderRadius: "var(--radius-pill)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  Selesai
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {evt.description && (
                              <p
                                style={{
                                  fontSize: 13,
                                  color: "var(--text-secondary)",
                                  lineHeight: 1.5,
                                  margin: 0,
                                }}
                              >
                                {evt.description}
                              </p>
                            )}

                            {/* Details Row: Time, Location, Capacity */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                gap: 8,
                                padding: "10px 12px",
                                background: "var(--bg-elevated)",
                                borderRadius: "var(--radius-xl)",
                                fontSize: 12,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Clock size={14} color="var(--text-muted)" />
                                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                  {evt.time || "Waktu belum ditentukan"}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  color: loc.color,
                                }}
                              >
                                {loc.icon}
                                <span style={{ fontWeight: 600 }}>{loc.label}</span>
                                {evt.location !== "virtual-room" && evt.locationDetail && (
                                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                                    ({evt.locationDetail})
                                  </span>
                                )}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Users size={14} color="var(--text-muted)" />
                                <span style={{ color: "var(--text-secondary)" }}>
                                  <strong style={{ color: "var(--text-primary)" }}>
                                    {evt.attendees}
                                  </strong>{" "}
                                  / {evt.capacity} peserta
                                </span>
                              </div>
                            </div>

                            {/* Tags */}
                            {evt.tags && evt.tags.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {evt.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    style={{
                                      padding: "2px 8px",
                                      background: "rgba(35,122,87,0.1)",
                                      borderRadius: "var(--radius-pill)",
                                      color: "var(--accent-green)",
                                      fontSize: 11,
                                      fontWeight: 600,
                                    }}
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                              {evt.status !== "past" && (
                                <button
                                  onClick={() => {
                                    if (evt.isRSVPed) {
                                      toggleRSVP(evt.id);
                                    } else if (evt.formFields && evt.formFields.length > 0) {
                                      setSelectedCalendarDay(null);
                                      setRsvpModalEvent(evt);
                                      setRsvpAnswers({});
                                    } else {
                                      toggleRSVP(evt.id, {
                                        userId: currentUser!.id,
                                        userName: currentUser!.name,
                                        userAvatar: currentUser!.avatar,
                                        answers: {},
                                        timestamp: Date.now(),
                                      });
                                    }
                                  }}
                                  style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                    padding: "9px 14px",
                                    background: evt.isRSVPed
                                      ? "rgba(35,122,87,0.1)"
                                      : "var(--accent-green)",
                                    border: evt.isRSVPed
                                      ? "1px solid var(--accent-green)"
                                      : "none",
                                    borderRadius: "var(--radius-pill)",
                                    color: evt.isRSVPed ? "var(--accent-green)" : "#FFF",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  {evt.isRSVPed ? <Check size={16} /> : <Zap size={16} />}
                                  {evt.isRSVPed ? "Terdaftar (Batalkan)" : "Daftar / RSVP"}
                                </button>
                              )}

                              {evt.location === "virtual-room" && evt.status === "live" && (
                                <button
                                  onClick={() => {
                                    setSelectedCalendarDay(null);
                                    setActiveTab("virtual-room");
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                    padding: "9px 16px",
                                    background: "var(--accent-blue)",
                                    border: "none",
                                    borderRadius: "var(--radius-pill)",
                                    color: "#FFF",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  <Sparkles size={14} /> Masuk Virtual Room
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Propose new event on this date button */}
                    <div
                      style={{
                        paddingTop: 12,
                        borderTop: "1px dashed var(--border-subtle)",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => {
                          setNewEventDate(selectedDateStr);
                          setSelectedCalendarDay(null);
                          setShowAddEventModal(true);
                        }}
                        style={{
                          background: "transparent",
                          border: "1px dashed var(--accent-green)",
                          color: "var(--accent-green)",
                          borderRadius: "var(--radius-pill)",
                          padding: "8px 18px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Sparkles size={14} /> + Ajukan Event Tambahan di Tanggal Ini
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
