import { useEffect, useRef, useState } from "react";

function BookingDatePicker({
  id,
  label,
  value,
  min,
  rangeStart,
  rangeEnd,
  onChange,
  language = "es",
  translateText = (text) => text,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = value || min;
    return date ? new Date(`${date}T00:00:00`) : new Date();
  });
  const pickerRef = useRef(null);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const minimumDate = min ? new Date(`${min}T00:00:00`) : null;
  const minimumMonth = minimumDate
    ? new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1)
    : null;
  const monthStart = new Date(year, month, 1);
  const locale = language === "en" ? "en-US" : "es-CO";
  const monthLabel = visibleMonth.toLocaleDateString(locale, { month: "long", year: "numeric" });

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const openCalendar = () => {
    const selectedDate = value || min;
    if (selectedDate) setVisibleMonth(new Date(`${selectedDate}T00:00:00`));
    setIsOpen((current) => !current);
  };

  const selectDate = (day) => {
    const selected = new Date(year, month, day);
    const dateValue = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (minimumDate && selected < minimumDate) return;
    onChange(dateValue);
    setIsOpen(false);
  };

  return (
    <div className={`booking-date-picker${isOpen ? " is-open" : ""}`} ref={pickerRef}>
      <span className="booking-date-label" id={`${id}-label`}>{label}</span>
      <button
        className={`booking-date-trigger${isOpen ? " is-open" : ""}`}
        id={id}
        type="button"
        aria-labelledby={`${id}-label ${id}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-required={required}
        onClick={openCalendar}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
        </svg>
        <span>{value
          ? new Date(`${value}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
          : translateText("Seleccionar fecha")}
        </span>
        <span className="booking-date-trigger-hint">{translateText(value ? "Cambiar" : "Elegir")}</span>
      </button>
      {isOpen && (
        <div
          className="booking-calendar"
          role="dialog"
          aria-label={`${language === "en" ? "Calendar for" : "Calendario de"} ${label.toLowerCase()}`}
        >
          <div className="booking-calendar-header">
            <button
              type="button"
              aria-label={translateText("Mes anterior")}
              disabled={minimumMonth && monthStart <= minimumMonth}
              onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
            >
              ‹
            </button>
            <strong>{monthLabel}</strong>
            <button
              type="button"
              aria-label={translateText("Mes siguiente")}
              onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}
            >
              ›
            </button>
          </div>
          <div className="booking-calendar-grid booking-calendar-weekdays" aria-hidden="true">
            {(language === "en"
              ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
              : ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
            ).map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="booking-calendar-grid booking-calendar-days">
            {Array.from({ length: firstWeekday }, (_, index) => (
              <span className="booking-calendar-empty" key={`empty-${index}`} aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const dateValue = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isDisabled = Boolean(min && dateValue < min);
              const isRangeStart = Boolean(rangeStart && dateValue === rangeStart);
              const isRangeEnd = Boolean(rangeEnd && dateValue === rangeEnd);
              const isInRange = Boolean(
                rangeStart
                && dateValue >= rangeStart
                && (rangeEnd ? dateValue <= rangeEnd : dateValue === rangeStart)
              );
              const dayClasses = [
                isInRange && "is-in-range",
                isRangeStart && "is-range-start",
                isRangeEnd && "is-range-end",
                value === dateValue && "is-selected",
              ].filter(Boolean).join(" ");
              return (
                <button
                  key={dateValue}
                  type="button"
                  disabled={isDisabled}
                  className={dayClasses}
                  aria-pressed={value === dateValue}
                  aria-label={`${day}${isRangeStart ? language === "en" ? ", check-in date" : ", fecha de entrada" : ""}${isRangeEnd ? language === "en" ? ", check-out date" : ", fecha de salida" : ""}`}
                  onClick={() => selectDate(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="booking-calendar-footer">
            <span>{value
              ? `${translateText("Fecha seleccionada")}: ${new Date(`${value}T00:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" })}`
              : translateText("Selecciona un día")}
            </span>
            <button type="button" onClick={() => setIsOpen(false)}>{translateText("Cerrar")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingDatePicker;
