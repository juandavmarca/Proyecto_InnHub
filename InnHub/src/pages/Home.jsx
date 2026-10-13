import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import  UbicacionModal from "../components/UbicacionModal";

import ConfirmDialog from "../components/ConfirmDialog";
import CenteredToast from "../components/CenteredToast";
import {
  obtenerCamas,
  obtenerCaracteristicas,
  obtenerHabitaciones,
  obtenerImagenes,
  solicitarCodigoWhatsapp,
  verificarCodigoWhatsapp,
} from "../services/api";

const homeLogo = "http://localhost/ERPInnHub/backend/uploads/logo.png";
const nightlyRatesByGuestCount = {
  1: 65000,
  2: 120000,
  3: 175000,
  4: 230000,
  5: 285000,
  6: 340000,
};
const phoneCountryCodes = [
  { country: "Argentina", code: "+54", flag: "🇦🇷" },
  { country: "Australia", code: "+61", flag: "🇦🇺" },
  { country: "Bolivia", code: "+591", flag: "🇧🇴" },
  { country: "Brasil", code: "+55", flag: "🇧🇷" },
  { country: "Canadá", code: "+1", flag: "🇨🇦" },
  { country: "Chile", code: "+56", flag: "🇨🇱" },
  { country: "China", code: "+86", flag: "🇨🇳" },
  { country: "Corea del Sur", code: "+82", flag: "🇰🇷" },
  { country: "Costa Rica", code: "+506", flag: "🇨🇷" },
  { country: "Cuba", code: "+53", flag: "🇨🇺" },
  { country: "Dinamarca", code: "+45", flag: "🇩🇰" },
  { country: "Djibouti", code: "+253", flag: "🇩🇯" },
  { country: "Dominica", code: "+1", flag: "🇩🇲" },
  { country: "República Dominicana", code: "+1", flag: "🇩🇴" },
  { country: "Ecuador", code: "+593", flag: "🇪🇨" },
  { country: "El Salvador", code: "+503", flag: "🇸🇻" },
  { country: "España", code: "+34", flag: "🇪🇸" },
  { country: "Estados Unidos", code: "+1", flag: "🇺🇸" },
  { country: "Francia", code: "+33", flag: "🇫🇷" },
  { country: "Guatemala", code: "+502", flag: "🇬🇹" },
  { country: "Honduras", code: "+504", flag: "🇭🇳" },
  { country: "India", code: "+91", flag: "🇮🇳" },
  { country: "Italia", code: "+39", flag: "🇮🇹" },
  { country: "Japón", code: "+81", flag: "🇯🇵" },
  { country: "México", code: "+52", flag: "🇲🇽" },
  { country: "Nicaragua", code: "+505", flag: "🇳🇮" },
  { country: "Panamá", code: "+507", flag: "🇵🇦" },
  { country: "Paraguay", code: "+595", flag: "🇵🇾" },
  { country: "Perú", code: "+51", flag: "🇵🇪" },
  { country: "Portugal", code: "+351", flag: "🇵🇹" },
  { country: "Puerto Rico", code: "+1", flag: "🇵🇷" },
  { country: "Reino Unido", code: "+44", flag: "🇬🇧" },
  { country: "Colombia", code: "+57", flag: "🇨🇴" },
  { country: "Uruguay", code: "+598", flag: "🇺🇾" },
  { country: "Venezuela", code: "+58", flag: "🇻🇪" },
].sort((first, second) => first.country.localeCompare(second.country, "es"));

function normalizarNombrePais(country) {
  return country.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function PhoneCountryPicker({ country, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const pickerRef = useRef(null);
  const queryRef = useRef("");
  const queryTimeoutRef = useRef(null);
  const normalizedQuery = normalizarNombrePais(query);
  const filteredCountries = phoneCountryCodes.filter(({ country: name }) =>
    normalizarNombrePais(name).startsWith(normalizedQuery)
  );

  const closePicker = () => {
    setIsOpen(false);
    setQuery("");
    queryRef.current = "";
    window.clearTimeout(queryTimeoutRef.current);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
        queryRef.current = "";
        window.clearTimeout(queryTimeoutRef.current);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isOpen]);

  useEffect(() => () => window.clearTimeout(queryTimeoutRef.current), []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      closePicker();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setQuery("");
        queryRef.current = "";
        setActiveIndex(0);
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => Math.max(0, Math.min(filteredCountries.length - 1, current + direction)));
      return;
    }
    if (event.key === "Enter" && isOpen && filteredCountries[activeIndex]) {
      event.preventDefault();
      onChange(filteredCountries[activeIndex]);
      closePicker();
      return;
    }
    if (event.key.length !== 1 || !/^[\p{L}]$/u.test(event.key)) return;

    const nextQuery = `${queryRef.current}${normalizarNombrePais(event.key)}`;
    queryRef.current = nextQuery;
    setQuery(nextQuery);
    setActiveIndex(0);
    setIsOpen(true);
    window.clearTimeout(queryTimeoutRef.current);
    queryTimeoutRef.current = window.setTimeout(() => {
      queryRef.current = "";
      setQuery("");
    }, 2500);
  };

  return (
    <div className={`reservation-country-picker${isOpen ? " is-open" : ""}`} ref={pickerRef}>
      <button
        className="reservation-country-code"
        type="button"
        aria-label={`País del teléfono: ${country.country} (${country.code})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen) closePicker();
          else setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="reservation-country-flag" aria-hidden="true">{country.flag}</span>
        <span className="reservation-country-dial">{country.code}</span>
      </button>
      {isOpen && (
        <div className="reservation-country-options" role="listbox" aria-label="Países">
          {filteredCountries.length ? filteredCountries.map((option, index) => (
            <button
              key={option.country}
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              role="option"
              aria-selected={country.country === option.country}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onChange(option);
                closePicker();
              }}
            >
              <span aria-hidden="true">{option.flag}</span>
              <span>{option.country}</span>
              <span>{option.code}</span>
            </button>
          )) : (
            <p className="reservation-country-empty">No hay países con esa letra.</p>
          )}
        </div>
      )}
    </div>
  );
}

//arreglo para almacenar las imágenes de la galería de experiencias
const galleryImages = [
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_1.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_2.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_3.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_4.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_5.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_6.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_7.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_8.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/espacio_9.JPG",
  "http://localhost/ERPInnHub/backend/ImgHabitaciones/toalla.JPG",
];

function BookingDatePicker({ id, label, value, min, rangeStart, rangeEnd, onChange }) {
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
  const monthLabel = visibleMonth.toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
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
        onClick={openCalendar}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
        </svg>
        <span>{value
          ? new Date(`${value}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
          : "Seleccionar fecha"}
        </span>
        <span className="booking-date-trigger-hint">{value ? "Cambiar" : "Elegir"}</span>
      </button>
      {isOpen && (
        <div className="booking-calendar" role="dialog" aria-label={`Calendario de ${label.toLowerCase()}`}>
          <div className="booking-calendar-header">
            <button
              type="button"
              aria-label="Mes anterior"
              disabled={minimumMonth && monthStart <= minimumMonth}
              onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}
            >
              ‹
            </button>
            <strong>{monthLabel}</strong>
            <button type="button" aria-label="Mes siguiente" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}>
              ›
            </button>
          </div>
          <div className="booking-calendar-grid booking-calendar-weekdays" aria-hidden="true">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
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
                  aria-label={`${day}${isRangeStart ? ", fecha de entrada" : ""}${isRangeEnd ? ", fecha de salida" : ""}`}
                  onClick={() => selectDate(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="booking-calendar-footer">
            <span>{value ? `Fecha seleccionada: ${new Date(`${value}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}` : "Selecciona un día"}</span>
            <button type="button" onClick={() => setIsOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// const _services = [
//   { name: "WiFi Premium", icon: "📶", description: "Conexión rápida en todas las áreas del hotel." },
//   { name: "Spa & Relax", icon: "🌿", description: "Zona de spa para desconectar y recargar energías." },
//   { name: "Parqueadero", icon: "🚗", description: "Estacionamiento seguro y cómodo para tu vehículo." },
//   { name: "Gimnasio", icon: "🏋️", description: "Espacio equipado para mantener tu rutina fitness." },
//   { name: "Comedor", icon: "🍽️", description: "Desayunos y cenas con sabores locales e internacionales." },
//   { name: "Zona Pet", icon: "🐾", description: "Ambiente acogedor para huéspedes con mascotas." },
// ];

//imagenes de habitaciones y videos 
const rooms = [
  {
    title: "Habitación Individual",
    category: "individual",
    price: "$65.000 COP / noche",
    description: "Un espacio confortable para una estadía tranquila y práctica.",
    image: "http://localhost/ERPInnHub/backend/ImgHabitaciones/individual_1.jpg",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    button: "Reservar ahora",
  },
  {
    title: "Habitación Doble",
    category: "doble",
    price: "$120.000 COP / noche",
    description: "Una opción cómoda para parejas o amigos.",
    image: "http://localhost/ERPInnHub/backend/ImgHabitaciones/familiar_3.jpg",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    button: "Ver detalles",
  },
  {
    title: "Habitación Familiar",
    category: "familiar",
    price: "$175.000 COP / noche",
    description: "Más espacio y comodidad para compartir en familia.",
    image: "http://localhost/ERPInnHub/backend/ImgHabitaciones/familiar_1.jpg",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    button: "Reservar ahora",
  },
];

const obtenerUrlYoutubeEmbed = (url) => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    let videoId = "";

    if (parsedUrl.hostname === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1);
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      videoId = parsedUrl.searchParams.get("v") || parsedUrl.pathname.split("/").pop();
    }

    if (!videoId) return null;

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    embedUrl.searchParams.set("autoplay", "1");
    embedUrl.searchParams.set("mute", "1");
    embedUrl.searchParams.set("loop", "1");
    embedUrl.searchParams.set("playlist", videoId);
    embedUrl.searchParams.set("playsinline", "1");

    return embedUrl.toString();
  } catch {
    return null;
  }
};

// tarjetas de reseña
// const _testimonials = [
//   {
//     name: "María González",
//     location: "Madrid, España",
//     quote: "Una experiencia increíble. El personal es muy amable y las instalaciones impecables.",
//   },
//   {
//     name: "John Smith",
//     location: "New York, USA",
//     quote: "El mejor hotel en el que me he hospedado. La habitación era espaciosa y la vista espectacular.",
//   },
//   {
//     name: "Sophie Laurent",
//     location: "Paris, France",
//     quote: "Perfecto para unas vacaciones relajantes. El spa es maravilloso y la comida excelente.",
//   },
// ];

function Home() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAdminAlert, setShowAdminAlert] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomForDateSelection, setRoomForDateSelection] = useState(null);
  const [bookingOrigin, setBookingOrigin] = useState("search");
  const [roomPreviewFromSearch, setRoomPreviewFromSearch] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingMessageType, setBookingMessageType] = useState("");
  const [whatsappCode, setWhatsappCode] = useState(["", "", "", ""]);
  const [whatsappCodeSent, setWhatsappCodeSent] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpRemainingSeconds, setOtpRemainingSeconds] = useState(0);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const otpInputRefs = useRef([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(
    phoneCountryCodes.find(({ country }) => country === "Colombia")
  );
  const [guestDetails, setGuestDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const getFullPhoneNumber = () => `${phoneCountry.code}${guestDetails.phone.replace(/\D/g, "")}`;

  const updateGuestCount = (value) => {
    setGuestCount((current) => Math.min(6, Math.max(1, current + value)));
  };

  const handleOpenExperienceModal = () => {
    setShowExperienceModal(true);
    setActiveSlide(0);
  };

  const handleCloseExperienceModal = () => {
    setShowExperienceModal(false);
  };

  const handleNextSlide = () => {
    setActiveSlide((current) => (current + 1) % galleryImages.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    if (!showExperienceModal) return undefined;

    const slideTimer = setTimeout(() => {
      setActiveSlide((current) => (current + 1) % galleryImages.length);
    }, 3000);

    return () => clearTimeout(slideTimer);
  }, [showExperienceModal, activeSlide]);

  const [activeRoom, setActiveRoom] = useState(null);
  const [activeRoomGalleryIndex, setActiveRoomGalleryIndex] = useState(0);

  useEffect(() => {
    const cargarHabitacionesPublicas = async () => {
      try {
        const habitaciones = await obtenerHabitaciones();
        const camas = await obtenerCamas();
        const habitacionesPublicas = rooms.map((room) => {
          const habitacionesDeCategoria = habitaciones.filter(
            (item) => String(item.tipo || "").trim().toLowerCase() === room.category
          );
          const habitacion = habitacionesDeCategoria.find(
            (item) => String(item.estado || "").trim().toLowerCase() === "disponible"
          ) || habitacionesDeCategoria.find(
            (item) => String(item.estado || "").trim().toLowerCase() !== "no disponible"
          ) || habitacionesDeCategoria[0];

          if (!habitacion) return null;

          const habitacionesDisponibles = habitacionesDeCategoria.filter(
            (item) => String(item.estado || "").trim().toLowerCase() === "disponible"
          );
          const obtenerCamasDeHabitacion = (idHabitacion) => camas
            .filter((cama) => String(cama.habitaciones_id_habitacion) === String(idHabitacion))
            .reduce((total, cama) => total + Number(cama.cantidad || 0), 0);

          const tipo = String(habitacion.tipo || room.category).trim();
          const numero = String(habitacion.numero || "").trim();
          const precio = Number(habitacion.precio_noche || 0).toLocaleString("es-CO");

          return {
            ...room,
            id_habitacion: habitacion.id_habitacion,
            tipo,
            numero,
            title: `Habitación ${tipo}`,
            price: `$${precio} COP / noche`,
            totalHabitaciones: habitacionesDeCategoria.length,
            habitacionesDisponibles: habitacionesDisponibles.length,
            totalCamas: habitacionesDeCategoria.reduce(
              (total, item) => total + obtenerCamasDeHabitacion(item.id_habitacion),
              0
            ),
            camasDisponibles: habitacionesDisponibles.reduce(
              (total, item) => total + obtenerCamasDeHabitacion(item.id_habitacion),
              0
            ),
          };
        }).filter(Boolean);
        const habitacionesConVideo = await Promise.all(habitacionesPublicas.map(async (room) => {
          try {
            const [imagenes, camas, caracteristicas] = await Promise.all([
              obtenerImagenes(room.id_habitacion),
              obtenerCamas(room.id_habitacion),
              obtenerCaracteristicas(room.id_habitacion),
            ]);
            const imagenesRegistradas = Array.isArray(imagenes) ? imagenes.filter(Boolean) : [];
            const imagenesValidas = imagenesRegistradas.filter((imagen) => imagen.url);
            const video = imagenesRegistradas.find((imagen) => imagen.url_video)?.url_video;
            const imagenesReales = imagenesValidas.slice(0, 3).map((imagen) => imagen.url);
            const numeroCamas = Array.isArray(camas)
              ? camas.reduce((total, cama) => total + Number(cama.cantidad || 0), 0)
              : 0;
            const caracteristicasReales = Array.isArray(caracteristicas)
              ? caracteristicas.filter((caracteristica) => caracteristica && caracteristica.nombre)
              : [];

            return {
              ...room,
              ...(video ? { video } : {}),
              imagenesReales,
              numeroCamas,
              caracteristicasReales,
            };
          } catch (error) {
            console.error("Error cargando imágenes públicas:", error);
            return {
              ...room,
              numeroCamas: 0,
              caracteristicasReales: [],
              imagenesReales: [],
            };
          }
        }));

        setPublicRooms(habitacionesConVideo);
      } catch (error) {
        console.error("Error cargando habitaciones públicas:", error);
      } finally {
        setRoomsLoading(false);
      }
    };

    cargarHabitacionesPublicas();
  }, []);

  const nights = checkIn && checkOut
    ? Math.round((new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`)) / 86400000)
    : 0;
  const nightlyRate = nightlyRatesByGuestCount[guestCount];
  const bookingTotal = nightlyRate * nights;
  const formatCurrency = (amount) => `$${Number(amount).toLocaleString("es-CO")} COP`;
  const formatStayDate = (date) => date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const currentDate = new Date();
  const todayInput = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

  const handleSearchRooms = (event) => {
    event.preventDefault();
    setSearchError("");
    if (!checkIn || !checkOut) {
      setSearchError("Selecciona las fechas de entrada y salida.");
      return;
    }
    if (new Date(`${checkIn}T00:00:00`) < new Date(new Date().toDateString())) {
      setSearchError("La fecha de entrada no puede estar en el pasado.");
      return;
    }
    if (nights < 1) {
      setSearchError("La salida debe ser posterior a la entrada.");
      return;
    }
    if (roomsLoading) {
      setSearchError("Estamos consultando las habitaciones. Inténtalo de nuevo en unos segundos.");
      return;
    }
    if (roomForDateSelection) {
      setSelectedRoom(roomForDateSelection);
      setRoomForDateSelection(null);
      setBookingOrigin("catalog");
      setBookingStep(1);
      setBookingMessage("");
      setPaymentMethod("");
      return;
    }
    setShowSearchResults(true);
  };

  const handleContinueToDateSelection = (room) => {
    if (Number(room.habitacionesDisponibles || 0) < 1) return;

    setRoomForDateSelection(room);
    setSelectedRoom(null);
    setShowSearchResults(false);
    setActiveRoom(null);
    setRoomPreviewFromSearch(false);
    setSearchError("");
    document.querySelector(".hero-booking-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleStartBooking = (room) => {
    if (!checkIn || !checkOut || nights < 1) {
      setSearchError("Selecciona fechas válidas antes de reservar.");
      setActiveRoom(null);
      document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (Number(room.habitacionesDisponibles || 0) < 1) return;

    setSelectedRoom(room);
    setBookingOrigin("search");
    setShowSearchResults(false);
    setActiveRoom(null);
    setRoomPreviewFromSearch(false);
    setBookingStep(1);
    setBookingMessage("");
    setPaymentMethod("");
  };

  const handleCloseBooking = () => {
    setSelectedRoom(null);
    setBookingStep(1);
    setVerificationSuccess(false);
    setBookingMessage("");
    setBookingMessageType("");
    setWhatsappCode(["", "", "", ""]);
    setWhatsappCodeSent(false);
    setOtpExpiresAt(null);
    setOtpRemainingSeconds(0);
  };

  const handleBackToRoomResults = () => {
    setSelectedRoom(null);
    setActiveRoom(null);
    setRoomPreviewFromSearch(false);
    setBookingStep(1);
    setVerificationSuccess(false);
    setBookingMessage("");
    if (bookingOrigin === "catalog") {
      setShowSearchResults(false);
      document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setShowSearchResults(true);
  };

  const handleChangeRoomBeforeSearch = () => {
    setRoomForDateSelection(null);
    setSearchError("");
    document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGuestDetailsSubmit = (event) => {
    event.preventDefault();
    const telefono = getFullPhoneNumber();
    if (!/^\+[1-9]\d{7,14}$/.test(telefono)) {
      setBookingMessage("Ingresa un número de teléfono válido.");
      setBookingMessageType("error");
      return;
    }

    setBookingMessage("");
    setBookingMessageType("");
    setWhatsappCode(["", "", "", ""]);
    setWhatsappCodeSent(false);
    setOtpExpiresAt(null);
    setOtpRemainingSeconds(0);
    setBookingStep(2);
    handleRequestWhatsappCode(telefono);
  };

  const handleRequestWhatsappCode = async (telefono = getFullPhoneNumber()) => {
    setVerificationLoading(true);
    setBookingMessage("");
    setBookingMessageType("");
    setWhatsappCodeSent(false);
    setOtpExpiresAt(null);
    setOtpRemainingSeconds(0);

    try {
      const resultado = await solicitarCodigoWhatsapp(telefono, guestDetails);
      setWhatsappCodeSent(true);
      setWhatsappCode(["", "", "", ""]);
      setOtpExpiresAt(Date.parse(resultado.expiresAt));
      setBookingMessage(resultado.mensaje);
      setBookingMessageType("success");
    } catch (error) {
      setBookingMessage(error.message || "No se pudo enviar el código por WhatsApp.");
      setBookingMessageType("error");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyWhatsappCode = async (event) => {
    event.preventDefault();
    setVerificationLoading(true);
    setBookingMessage("");
    setBookingMessageType("");

    try {
      await verificarCodigoWhatsapp(getFullPhoneNumber(), whatsappCode.join(""));
      setBookingMessage("");
      setBookingMessageType("");
      setVerificationSuccess(true);
    } catch (error) {
      if (/expir[oó]|vencid/i.test(error.message || "")) {
        setOtpExpiresAt(Date.now());
        setOtpRemainingSeconds(0);
        setWhatsappCode(["", "", "", ""]);
        setBookingMessage("El código expiró. Solicita uno nuevo para continuar.");
      } else {
        setBookingMessage(error.message || "No se pudo verificar el código.");
      }
      setBookingMessageType("error");
    } finally {
      setVerificationLoading(false);
    }
  };

  useEffect(() => {
    if (!whatsappCodeSent || !otpExpiresAt) return undefined;

    let timer;
    const actualizarCuentaRegresiva = () => {
      const segundosRestantes = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setOtpRemainingSeconds(segundosRestantes);
      if (segundosRestantes === 0) {
        clearInterval(timer);
        setBookingMessage("El código expiró. Solicita uno nuevo para continuar.");
        setBookingMessageType("error");
      }
    };

    actualizarCuentaRegresiva();
    timer = setInterval(actualizarCuentaRegresiva, 1000);
    return () => clearInterval(timer);
  }, [whatsappCodeSent, otpExpiresAt]);

  useEffect(() => {
    if (!verificationSuccess) return undefined;

    const timeout = setTimeout(() => {
      setBookingStep(3);
      setVerificationSuccess(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [verificationSuccess]);

  useEffect(() => {
    if (bookingStep === 2 && whatsappCodeSent) {
      otpInputRefs.current[0]?.focus();
    }
  }, [bookingStep, whatsappCodeSent]);

  const handleWhatsappCodeChange = (index, value) => {
    const digits = value.replace(/\D/g, "");
    const nextCode = [...whatsappCode];

    if (digits.length > 1) {
      digits.slice(0, 4 - index).split("").forEach((digit, offset) => {
        nextCode[index + offset] = digit;
      });
      setWhatsappCode(nextCode);
      otpInputRefs.current[Math.min(index + digits.length, 3)]?.focus();
      return;
    }

    const digit = digits.slice(-1);
    nextCode[index] = digit;
    setWhatsappCode(nextCode);

    if (digit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleWhatsappCodePaste = (event) => {
    event.preventDefault();
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    setWhatsappCode(Array.from({ length: 4 }, (_, index) => pastedCode[index] || ""));
    otpInputRefs.current[Math.min(pastedCode.length, 3)]?.focus();
  };

  const handleOpenRoomModal = (room) => {
    setActiveRoom(room);
    setActiveRoomGalleryIndex(0);
  };

  const handlePreviewRoom = (room) => {
    setRoomPreviewFromSearch(true);
    handleOpenRoomModal(room);
  };

  const handleOpenCategory = (category) => {
    const room = publicRooms.find((item) => item.category === category);
    if (room) handleOpenRoomModal(room);
  };

  const handleCloseRoomModal = () => {
    setActiveRoom(null);
    setActiveRoomGalleryIndex(0);
    setRoomPreviewFromSearch(false);
  };

  const videoYoutubeEmbed = obtenerUrlYoutubeEmbed(activeRoom?.video);

  const obtenerDatosCategoria = (category) => publicRooms.find((room) => room.category === category);

  const cambiarGaleria = (cantidad) => {
    const total = 1 + (activeRoom?.imagenesReales?.length || 0);
    setActiveRoomGalleryIndex((current) => (current + cantidad + total) % total);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <img src={homeLogo} alt="Hotel Valencia logo" className="home-logo-image" />
          <span className="home-subtitle">Hotel Ejecutivo</span>
        </div>
        <nav className="home-nav">
          <a href="#hero">Inicio</a>
          {/* <a href="#services">Servicios</a> */}
          <a href="#rooms">Habitaciones</a>
          {/* <a href="#reviews">Reseñas</a> */}
          <a href="#contact">Contacto</a>
        </nav>
        <div className="home-actions">
          <button
            type="button"
            className="btn btn-register"
            onClick={() => setShowAdminAlert(true)}
          >
            Administración
          </button>
          <button className="btn btn-lang">ES</button>
        </div>
      </header>

      <section className="hero-section" id="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">Bienvenido a Sonsón</span>
            <br />
            <span className="smsprincipal">Elegancia, confort y servicio excepcional en un solo lugar.</span>
            
            <div className="hero-buttons">
              <a href="#rooms" className="btn btn-cta">
                Reserva ya
              </a>
             
            </div>
          </div>

          <form className="hero-booking-card" onSubmit={handleSearchRooms}>
            <div className="booking-card-header">
              <span>Encuentra tu habitación ideal</span>
              <strong>Fechas y disponibilidad</strong>
            </div>
            {roomForDateSelection && (
              <div className="booking-selected-room">
                <div>
                  <span>Habitación seleccionada</span>
                  <strong>{roomForDateSelection.title}</strong>
                </div>
                <button type="button" onClick={handleChangeRoomBeforeSearch}>Cambiar</button>
              </div>
            )}
            <div className="booking-row">
              <BookingDatePicker
                id="booking-check-in"
                label="Entrada"
                value={checkIn}
                min={todayInput}
                rangeStart={checkIn}
                rangeEnd={checkOut}
                onChange={(date) => {
                  setCheckIn(date);
                  if (checkOut && checkOut <= date) setCheckOut("");
                  setSearchError("");
                }}
              />
            </div>
            <div className="booking-row">
              <BookingDatePicker
                id="booking-check-out"
                label="Salida"
                value={checkOut}
                min={checkIn || todayInput}
                rangeStart={checkIn}
                rangeEnd={checkOut}
                onChange={(date) => {
                  setCheckOut(date);
                  setSearchError("");
                }}
              />
            </div>
            <div className="booking-row">
              <label htmlFor="booking-guests">Personas (máximo 6)</label>
              <div className="counter" id="booking-guests">
                <button type="button" onClick={() => updateGuestCount(-1)} disabled={guestCount <= 1} aria-label="Quitar una persona">−</button>
                <span>{guestCount}</span>
                <button type="button" onClick={() => updateGuestCount(1)} disabled={guestCount >= 6} aria-label="Agregar una persona">+</button>
              </div>
            </div>
            {nights > 0 && (
              <div className="booking-price-preview" aria-live="polite" aria-atomic="true">
                <div className="booking-price-preview-heading">
                  <span>Resumen estimado</span>
                  <span>{nights} {nights === 1 ? "noche" : "noches"} · {guestCount} {guestCount === 1 ? "persona" : "personas"}</span>
                </div>
                <div className="booking-price-preview-row">
                  <span>Tarifa por noche</span>
                  <strong>{formatCurrency(nightlyRate)}</strong>
                </div>
                <div className="booking-price-preview-total">
                  <span>Total estimado</span>
                  <strong>{formatCurrency(bookingTotal)}</strong>
                </div>
                <small>El valor final se confirma al completar la reserva.</small>
              </div>
            )}
            {searchError && <p className="reservation-inline-error" role="alert">{searchError}</p>}
            <button className="btn btn-book" type="submit">
              {roomForDateSelection ? "Buscar fechas y continuar" : "Buscar habitación"}
            </button>
          </form>
        </div>
      </section>

      {showSearchResults && (
        <div
          className={`reservation-backdrop ${activeRoom ? "reservation-backdrop-preview-open" : ""}`}
          onClick={() => setShowSearchResults(false)}
        >
          <section
            className="reservation-results"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-results-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="reservation-close" type="button" onClick={() => setShowSearchResults(false)} aria-label="Cerrar resultados">×</button>
            <span className="reservation-eyebrow">Tu estadía</span>
            <h2 id="reservation-results-title">Habitaciones para tu viaje</h2>
            <p className="reservation-results-dates">
              {checkIn} → {checkOut} · {nights} {nights === 1 ? "noche" : "noches"} · {guestCount} {guestCount === 1 ? "persona" : "personas"}
            </p>
            <div className="reservation-room-list">
              {rooms.map((room) => {
                const roomData = publicRooms.find((item) => item.category === room.category);
                const availableRooms = Number(roomData?.habitacionesDisponibles || 0);
                const image = roomData?.imagenesReales?.[0] || roomData?.image || room.image;
                return (
                  <article className="reservation-room-card" key={room.category}>
                    <div className="reservation-room-image-wrap">
                      <img
                        src={image}
                        alt={roomData?.title || room.title}
                        onError={(event) => { event.currentTarget.src = homeLogo; }}
                      />
                      <button
                        className="reservation-room-preview"
                        type="button"
                        disabled={!roomData || availableRooms < 1}
                        onClick={() => handlePreviewRoom({ ...room, ...roomData, image })}
                        aria-label={`Ver fotos, video y características de ${roomData?.title || room.title}`}
                        title="Ver fotos, video y características"
                      >
                        <i className="fa-solid fa-eye" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="reservation-room-copy">
                      <h3>{roomData?.title || room.title}</h3>
                      <p>{room.description}</p>
                      <span className={availableRooms ? "reservation-availability" : "reservation-unavailable"}>
                        {roomsLoading ? "Consultando disponibilidad…" : `${availableRooms} ${availableRooms === 1 ? "habitación disponible" : "habitaciones disponibles"}`}
                      </span>
                    </div>
                    <div className="reservation-room-action">
                      <strong>{formatCurrency(nightlyRate)} <small>/ noche</small></strong>
                      <button
                        className="btn btn-book"
                        type="button"
                        disabled={!roomData || availableRooms < 1}
                        onClick={() => handleStartBooking({ ...room, ...roomData, image })}
                      >
                        {availableRooms ? "Reservar ahora" : "No disponible"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="reservation-disclaimer">
              La disponibilidad corresponde al estado actual registrado en el hotel; la consulta de ocupación por fechas requiere conectar el módulo de reservas.
            </p>
          </section>
        </div>
      )}

      <section className="feature-strip" aria-label="Ventajas del hotel">
        <div className="feature-strip-grid">
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🔔</div>
            <div className="feature-copy">
              <h3>Servicio 24/7</h3>
              <p>Estamos siempre disponibles para ti.</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🛏️</div>
            <div className="feature-copy">
              <h3>Comodidad</h3>
              <p>Habitaciones diseñadas para tu descanso.</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🛡️</div>
            <div className="feature-copy">
              <h3>Seguridad</h3>
              <p>Tu tranquilidad es nuestra prioridad.</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">📍</div>
            <div className="feature-copy">
              <h3>Ubicación</h3>
              <p>En el corazón de la ciudad, cerca de todo.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="value-cards" aria-label="Beneficios del hotel">
        <button type="button" className="value-card value-card-button" onClick={() => setMostrarUbicacion(true)}>
          <h3>Ubicación estratégica</h3> 
          <p>Acceso fácil a sitios turísticos, restaurantes y transporte local.</p>
        </button>

        <article className="value-card">
          <h3>Atención 24/7</h3>
          <p>Soporte para reservas, consultas y servicios personalizados.</p>
        </article>

        <button type="button" className="value-card value-card-button" onClick={handleOpenExperienceModal}>
          <h3>Experiencias únicas</h3>
          <p>Planes especiales, cenas temáticas y actividades de bienestar.</p>
        </button>
      </section>

      {/* <section className="services-section home-section" id="services">
        <div className="section-title">
          <span>Servicios exclusivos</span>
          <h2>Todo lo que necesitas para una estadía inolvidable</h2>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <article key={service.name} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section> */}

      <section className="rooms-section home-section" id="rooms">
        <div className="section-title align-left">
          <span>Habitaciones</span>
          <h2>Encuentra el espacio perfecto para tu estadía</h2>
        </div>
        <div className="room-categories">
          <button
            type="button"
            className="category-card image"
            onClick={() => handleOpenCategory("individual")}
            style={{ backgroundImage: `url(${publicRooms.find(r => r.category === "individual")?.image || rooms.find(r => r.category === "individual")?.image})` }}
          >
            <div className="category-overlay">
              <h3>Habitaciones Individuales</h3>
              {/* <p>Confort y privacidad para una persona.</p> */}
              <div className="category-availability">
                <strong>{obtenerDatosCategoria("individual")?.habitacionesDisponibles || 0}/{obtenerDatosCategoria("individual")?.totalHabitaciones || 0} habitaciones disponibles</strong>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="category-card image"
            onClick={() => handleOpenCategory("doble")}
            style={{ backgroundImage: `url(${publicRooms.find(r => r.category === "doble")?.image || rooms.find(r => r.category === "doble")?.image})` }}
          >
            <div className="category-overlay">
              <h3>Habitaciones Dobles</h3>
              {/* <p>El espacio ideal para compartir.</p> */}
              <div className="category-availability">
                <strong>{obtenerDatosCategoria("doble")?.habitacionesDisponibles || 0}/{obtenerDatosCategoria("doble")?.totalHabitaciones || 0} habitaciones disponibles</strong>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="category-card image"
            onClick={() => handleOpenCategory("familiar")}
            style={{ backgroundImage: `url(${publicRooms.find(r => r.category === "familiar")?.image || rooms.find(r => r.category === "familiar")?.image})` }}
          >
            <div className="category-overlay">
              <h3>Habitaciones Familiares</h3>
              {/* <p>Amplitud y comodidad para toda la familia.</p> */}
              <div className="category-availability">
                <strong>{obtenerDatosCategoria("familiar")?.habitacionesDisponibles || 0}/{obtenerDatosCategoria("familiar")?.totalHabitaciones || 0} habitaciones disponibles</strong>
              </div>
            </div>
          </button>
        </div>

      </section>

      {/* <section className="reviews-section home-section" id="reviews">
        <div className="section-title">
          <span>Reseñas reales</span>
          <h2>Lo que dicen nuestros huéspedes</h2>
        </div>
        <div className="reviews-grid">
          {testimonials.map((review) => (
            <article key={review.name} className="review-card">
              <div className="review-avatar">{review.name.charAt(0)}</div>
              <div>
                <strong>{review.name}</strong>
                <span>{review.location}</span>
              </div>
              <p>“{review.quote}”</p>
              <div className="rating">★★★★★</div>
            </article>
          ))}
        </div>
      </section> */}

      {showExperienceModal && (
        <div className="modal-backdrop modal-backdrop-show" onClick={handleCloseExperienceModal}>
          <div className="experience-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={handleCloseExperienceModal}>
              ×
            </button>
            <div className="experience-carousel">
              <button className="carousel-control prev" type="button" onClick={handlePrevSlide} aria-label="Imagen anterior">
                ‹
              </button>
              <div className="carousel-slide">
                <img src={galleryImages[activeSlide]} alt={`Imagen ${activeSlide + 1} de la experiencia`} />
              </div>
              <button className="carousel-control next" type="button" onClick={handleNextSlide} aria-label="Imagen siguiente">
                ›
              </button>
            </div>
            <div className="experience-gallery-footer">
              <div className="experience-progress" aria-hidden="true">
                <span style={{ width: `${((activeSlide + 1) / galleryImages.length) * 100}%` }} />
              </div>
              <div className="experience-thumbnails" aria-label="Seleccionar imagen">
                {galleryImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={`experience-thumbnail ${index === activeSlide ? "active" : ""}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Ver imagen ${index + 1}`}
                    aria-pressed={index === activeSlide}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarUbicacion && (
        <UbicacionModal onCerrar={() => setMostrarUbicacion(false)} />
      )}

      {selectedRoom && (
        <div className="reservation-backdrop reservation-flow-backdrop">
          <section
            className="reservation-flow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-flow-title"
          >
            <button className="reservation-close" type="button" onClick={handleCloseBooking} aria-label="Cerrar reserva">×</button>
            <div className="reservation-flow-heading">
              <span className="reservation-eyebrow">Hotel Valencia · Reserva segura</span>
              <h2 id="reservation-flow-title">Completa tu reserva</h2>
              <button className="reservation-text-action reservation-back-to-rooms" type="button" onClick={handleBackToRoomResults}>
                ← Volver a habitaciones
              </button>
              <div className="reservation-steps" aria-label="Pasos de la reserva">
                <div className={bookingStep >= 1 ? "reservation-step active" : "reservation-step"}>
                  <span>1</span><strong>Datos del huésped</strong>
                </div>
                <div className={bookingStep >= 2 ? "reservation-step active" : "reservation-step"}>
                  <span>2</span><strong>Verificar teléfono</strong>
                </div>
                <div className={bookingStep >= 3 ? "reservation-step active" : "reservation-step"}>
                  <span>3</span><strong>Método de pago</strong>
                </div>
              </div>
            </div>

            <div className="reservation-flow-grid">
              <div className="reservation-flow-main">
                {bookingStep === 1 && (
                  <form className="reservation-form" onSubmit={handleGuestDetailsSubmit}>
                    <h3>¿Quién hará el check-in?</h3>
                    <p>Ingresa los datos de la persona responsable de la reserva.</p>
                    <div className="reservation-form-grid">
                      <label>
                        Nombres
                        <input
                          type="text"
                          autoComplete="given-name"
                          value={guestDetails.firstName}
                          onChange={(event) => setGuestDetails({ ...guestDetails, firstName: event.target.value })}
                          required
                        />
                      </label>
                      <label>
                        Apellidos
                        <input
                          type="text"
                          autoComplete="family-name"
                          value={guestDetails.lastName}
                          onChange={(event) => setGuestDetails({ ...guestDetails, lastName: event.target.value })}
                          required
                        />
                      </label>
                      <label>
                        Correo electrónico
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder="tucorreo@ejemplo.com"
                          value={guestDetails.email}
                          onChange={(event) => setGuestDetails({ ...guestDetails, email: event.target.value })}
                          required
                        />
                      </label>
                      <label>
                        Teléfono / WhatsApp
                        <div className="reservation-phone-fields">
                          <PhoneCountryPicker country={phoneCountry} onChange={setPhoneCountry} />
                          <input
                            type="tel"
                            aria-label="Número de teléfono"
                            autoComplete="tel-national"
                            inputMode="numeric"
                            maxLength={14}
                            placeholder="300 000 0000"
                            value={guestDetails.phone}
                            onChange={(event) => setGuestDetails({ ...guestDetails, phone: event.target.value })}
                            required
                          />
                        </div>
                      </label>
                    </div>
                    {bookingMessage && <p className={`reservation-integration-note is-${bookingMessageType}`} role="alert">{bookingMessage}</p>}
                    <button className="btn btn-book reservation-primary-action" type="submit" disabled={verificationLoading}>
                      Continuar a la verificación
                    </button>
                  </form>
                )}

                {bookingStep === 2 && (
                  <section className="reservation-verification">
                    <span className="reservation-step-kicker">Paso 2 de 3</span>
                    <h3>Confirma tu número de teléfono</h3>
                    <p>Enviaremos un código de verificación por WhatsApp al número que registraste.</p>
                    <strong className="reservation-phone">{getFullPhoneNumber()}</strong>
                    <div className="reservation-code-status" role="status" aria-live="polite">
                      <span>{verificationLoading ? "Enviando código por WhatsApp..." : whatsappCodeSent && otpRemainingSeconds > 0 ? "Código enviado por WhatsApp" : whatsappCodeSent ? "El código expiró" : "Preparando el envío del código..."}</span>
                      {whatsappCodeSent && otpRemainingSeconds > 0 && (
                        <strong className="reservation-code-countdown">
                          Vence en {Math.floor(otpRemainingSeconds / 60)}:{String(otpRemainingSeconds % 60).padStart(2, "0")}
                        </strong>
                      )}
                    </div>
                    {(!whatsappCodeSent || otpRemainingSeconds === 0) && (
                      <button className="btn btn-book reservation-primary-action" type="button" onClick={() => handleRequestWhatsappCode()} disabled={verificationLoading}>
                        {verificationLoading ? "Enviando..." : whatsappCodeSent && otpRemainingSeconds === 0 ? "Solicitar nuevo código" : bookingMessageType === "error" ? "Reintentar envío" : "Reenviar código por WhatsApp"}
                      </button>
                    )}
                    {bookingMessage && <p className={`reservation-integration-note is-${bookingMessageType}`} role={bookingMessageType === "error" ? "alert" : "status"}>{bookingMessage}</p>}
                    <form onSubmit={handleVerifyWhatsappCode}>
                      <span className="reservation-code-label">Código de verificación</span>
                      <div className="reservation-code-inputs" role="group" aria-label="Código de verificación de cuatro dígitos">
                        {Array.from({ length: 4 }, (_, index) => (
                          <input
                            key={index}
                            ref={(element) => { otpInputRefs.current[index] = element; }}
                            className="reservation-code-input"
                            type="text"
                            inputMode="numeric"
                            autoComplete={index === 0 ? "one-time-code" : "off"}
                            pattern="[0-9]"
                            maxLength={index === 0 ? 4 : 1}
                            aria-label={`Dígito ${index + 1} de 4`}
                            value={whatsappCode[index]}
                            onChange={(event) => handleWhatsappCodeChange(index, event.target.value)}
                            onPaste={handleWhatsappCodePaste}
                            onKeyDown={(event) => {
                              if (event.key === "Backspace" && !whatsappCode[index] && index > 0) {
                                otpInputRefs.current[index - 1]?.focus();
                              } else if (event.key === "ArrowLeft" && index > 0) {
                                otpInputRefs.current[index - 1]?.focus();
                              } else if (event.key === "ArrowRight" && index < 3) {
                                otpInputRefs.current[index + 1]?.focus();
                              }
                            }}
                            aria-describedby="reservation-code-help"
                            disabled={!whatsappCodeSent || otpRemainingSeconds === 0 || verificationLoading || verificationSuccess}
                            required
                          />
                        ))}
                      </div>
                      <small id="reservation-code-help">Ingresa los 4 dígitos enviados a tu WhatsApp. También puedes pegarlos juntos.</small>
                      <button className="btn btn-book reservation-primary-action" type="submit" disabled={!whatsappCodeSent || otpRemainingSeconds === 0 || !whatsappCode.every(Boolean) || verificationLoading || verificationSuccess}>
                        {verificationLoading ? "Verificando..." : verificationSuccess ? "Código verificado" : "Verificar y continuar"}
                      </button>
                    </form>
                    <button className="reservation-text-action" type="button" disabled={verificationSuccess} onClick={() => {
                      setBookingStep(1);
                      setBookingMessage("");
                      setBookingMessageType("");
                      setWhatsappCode(["", "", "", ""]);
                      setWhatsappCodeSent(false);
                      setOtpExpiresAt(null);
                      setOtpRemainingSeconds(0);
                    }}>
                      Volver a mis datos
                    </button>
                    <div className="reservation-payment-preview">
                      <span>Paso 3</span>
                      <strong>Método de pago</strong>
                      <p>Se habilitará después de verificar el teléfono.</p>
                    </div>
                  </section>
                )}

                {bookingStep === 3 && (
                  <section className="reservation-payment">
                    <span className="reservation-step-kicker">Paso 3 de 3</span>
                    <h3>Elige cómo quieres pagar</h3>
                    <p>Selecciona el método de pago para completar tu solicitud.</p>
                    <label className="reservation-payment-option">
                      <input
                        type="radio"
                        name="payment-method"
                        value="recepcion"
                        checked={paymentMethod === "recepcion"}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                      />
                      <span><strong>Pago en recepción</strong><small>Paga directamente al llegar al hotel.</small></span>
                    </label>
                    <label className="reservation-payment-option">
                      <input
                        type="radio"
                        name="payment-method"
                        value="transferencia"
                        checked={paymentMethod === "transferencia"}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                      />
                      <span><strong>Transferencia bancaria</strong><small>Los datos de pago se compartirán al confirmar la reserva.</small></span>
                    </label>
                    <p className="reservation-integration-note">
                      La confirmación final y el registro de la reserva requieren conectar el servicio de reservas del hotel.
                    </p>
                    <button className="btn btn-book reservation-primary-action" type="button" disabled>
                      Confirmar reserva
                    </button>
                  </section>
                )}
              </div>

              <aside className="reservation-summary">
                <h3>Resumen de tu estadía</h3>
                <img
                  className="reservation-summary-image"
                  src={selectedRoom.imagenesReales?.[0] || selectedRoom.image}
                  alt={selectedRoom.title}
                  onError={(event) => { event.currentTarget.src = homeLogo; }}
                />
                <h4>{selectedRoom.title}</h4>
                <p>{guestCount} {guestCount === 1 ? "persona" : "personas"} · {nights} {nights === 1 ? "noche" : "noches"}</p>
                <dl className="reservation-summary-dates">
                  <div><dt>Entrada</dt><dd>{formatStayDate(checkIn)}</dd></div>
                  <div><dt>Salida</dt><dd>{formatStayDate(checkOut)}</dd></div>
                  <div><dt>Tarifa por noche</dt><dd>{formatCurrency(nightlyRate)}</dd></div>
                </dl>
                <div className="reservation-summary-total">
                  <span>Total de estadía</span>
                  <strong>{formatCurrency(bookingTotal)}</strong>
                </div>
                <small>El total se calcula según el número de personas y las noches seleccionadas.</small>
              </aside>
            </div>
          </section>
        </div>
      )}

      {activeRoom && (
        <div
          className={`modal-backdrop modal-backdrop-show ${roomPreviewFromSearch ? "room-preview-backdrop" : ""}`}
          onClick={handleCloseRoomModal}
        >
          <div className="room-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={handleCloseRoomModal}>
              ×
            </button>
            <div className="room-modal-grid">
              <div className="room-modal-gallery">
                <div className="room-modal-gallery-main">
                  {activeRoomGalleryIndex === 0 ? (
                    videoYoutubeEmbed ? (
                      <iframe
                        src={videoYoutubeEmbed}
                        title={`Video de ${activeRoom.title}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <video controls autoPlay loop muted playsInline src={activeRoom.video} />
                    )
                  ) : (
                    <img
                      src={activeRoom.imagenesReales[activeRoomGalleryIndex - 1]}
                      alt={`${activeRoom.title} imagen ${activeRoomGalleryIndex}`}
                    />
                  )}
                  {(activeRoom.imagenesReales?.length || 0) > 0 && (
                    <div className="room-modal-gallery-controls">
                      <button type="button" onClick={() => cambiarGaleria(-1)} aria-label="Elemento anterior">‹</button>
                      <span>{activeRoomGalleryIndex + 1} / {1 + activeRoom.imagenesReales.length}</span>
                      <button type="button" onClick={() => cambiarGaleria(1)} aria-label="Siguiente elemento">›</button>
                    </div>
                  )}
                </div>
                <div className="room-modal-gallery-thumbs">
                  <button
                    type="button"
                    className={`room-modal-gallery-thumb room-modal-video-thumb ${activeRoomGalleryIndex === 0 ? "active" : ""}`}
                    onClick={() => setActiveRoomGalleryIndex(0)}
                    aria-label="Ver video de la habitación"
                  >
                    <img src={homeLogo} alt="Hotel Valencia" />
                  </button>
                  {(activeRoom.imagenesReales || []).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={`room-modal-gallery-thumb ${activeRoomGalleryIndex === index + 1 ? "active" : ""}`}
                      onClick={() => setActiveRoomGalleryIndex(index + 1)}
                      aria-label={`Ver imagen ${index + 1}`}
                    >
                      <img src={image} alt={`${activeRoom.title} miniatura ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="room-modal-details">
                <h2>{activeRoom.title}</h2>
                <p className="room-modal-type">Tipo: {activeRoom.tipo || activeRoom.category}</p>
                <p className="room-modal-registered-count">
                  {activeRoom.habitacionesDisponibles || 0}/{activeRoom.totalHabitaciones || 0} habitaciones disponibles
                </p>
                <div className="room-modal-real-data">
                  <p><strong>Camas:</strong> {activeRoom.numeroCamas || 0}</p>
                </div>
                <div className="room-modal-features">
                  <h3>Características</h3>
                  {activeRoom.caracteristicasReales?.length > 0 ? (
                    activeRoom.caracteristicasReales.map((caracteristica, index) => (
                      <div key={`${caracteristica.idcarac || index}`} className="room-modal-feature">
                        <strong>{caracteristica.nombre}</strong>
                        <span>{caracteristica.descripcion || "Sin descripción registrada."}</span>
                      </div>
                    ))
                  ) : (
                    <span>Sin características registradas.</span>
                  )}
                </div>
                <p className="room-modal-price">{formatCurrency(nightlyRate)} / noche</p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => (
                      roomPreviewFromSearch
                        ? handleStartBooking(activeRoom)
                        : handleContinueToDateSelection(activeRoom)
                    )}
                    disabled={Number(activeRoom.habitacionesDisponibles || 0) < 1}
                  >
                    {Number(activeRoom.habitacionesDisponibles || 0) > 0 ? "Continuar" : "No disponible"}
                  </button>
                  {roomPreviewFromSearch && (
                    <button
                      className="reservation-text-action room-preview-back"
                      type="button"
                      onClick={handleCloseRoomModal}
                    >
                      ← Volver a habitaciones
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={showAdminAlert}
        title="Espacio administrativo"
        message="¿Deseas continuar? Este espacio es solo para personal administrativo."
        confirmText="Continuar"
        cancelText="Cancelar"
        onConfirm={() => {
          setShowAdminAlert(false);
          navigate("/login");
        }}
        onCancel={() => setShowAdminAlert(false)}
      />

      <CenteredToast
        show={verificationSuccess}
        message="¡Código verificado con éxito!"
        type="success"
        duration={2000}
        className="toast-verification-success"
      />

      <footer className="home-footer" id="contact">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={homeLogo} alt="Hotel Valencia logo" className="footer-logo" />
            <div>
              <span className="footer-brand-name">Hotel Valencia</span>
              <p>Hospitalidad elegante en Sonsón, donde cada detalle está pensado para tu descanso.</p>
            </div>
          </div>

          <div className="footer-links">
            <h4>Explora</h4>
            <ul>
              <li><a href="#hero">Inicio</a></li>
              <li><a href="#rooms">Habitaciones</a></li>
              <li><a href="#contact">Contacto</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contacto</h4>
            <p>📍 Sonsón, Antioquia</p>
            <p>📞 +57 300 123 4567</p>
            <p>✉️ info@hotelvalencia.com</p>
            <p>🕒 Recepción 24/7</p>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-copy">
          <span>© 2026 Hotel Valencia.</span>
          <span>Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
