import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import  UbicacionModal from "../components/UbicacionModal";

import ConfirmDialog from "../components/ConfirmDialog";
import BookingDatePicker from "../components/BookingDatePicker";
import CenteredToast from "../components/CenteredToast";
import SolicitudAtencionModal from "../components/SolicitudAtencionModal";
import {
  BASE_URL,
  actualizarReservasVerificadas,
  obtenerCamas,
  obtenerCaracteristicas,
  obtenerDisponibilidadPublica,
  obtenerHabitaciones,
  obtenerImagenes,
  reenviarCorreoAceptacion,
  consultarEstadoPago,
  iniciarPagoWompi,
  solicitarCodigoConsultaReserva,
  solicitarCodigoWhatsapp,
  verificarCodigoConsultaReserva,
  verificarCodigoWhatsapp,
} from "../services/api";

const homeLogo = `${BASE_URL}/uploads/logo.png`;
const termsDocumentUrl = `${BASE_URL}/Verificacion/terminos.php`;
const roomMediaUrl = (filename) => `${BASE_URL}/ImgHabitaciones/${encodeURIComponent(filename)}`;
const formatLookupDate = (value) => {
  if (!value) return "Pendiente";
  const rawDate = String(value).trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawDate);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(rawDate.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
};
const formatLookupMoney = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
}).format(Number(value) || 0);
const nightlyRatePerPerson = 65000;
const translations = {
  en: {
    "Hotel Ejecutivo": "Executive Hotel",
    Inicio: "Home",
    Habitaciones: "Rooms",
    Contacto: "Contact",
    "Verificar mi reserva": "Check my reservation",
    Administración: "Administration",
    "Bienvenido a Sonsón": "Welcome to Sonsón",
    "Elegancia, confort y servicio excepcional en un solo lugar.": "Elegance, comfort, and exceptional service in one place.",
    "Reserva ya": "Book now",
    "Encuentra tu habitación ideal": "Find your ideal room",
    "Fechas y disponibilidad": "Dates and availability",
    "Habitación seleccionada": "Selected room",
    Cambiar: "Change",
    Entrada: "Check-in",
    Salida: "Check-out",
    "Personas (máximo 6)": "Guests (maximum 6)",
    "Quitar una persona": "Remove one guest",
    "Agregar una persona": "Add one guest",
    "Resumen estimado": "Estimated summary",
    noche: "night",
    noches: "nights",
    persona: "guest",
    personas: "guests",
    "Tarifa por noche": "Nightly rate",
    "Total estimado": "Estimated total",
    "Buscar fechas y continuar": "Search dates and continue",
    "Buscar habitación": "Search rooms",
    "Buscar habitaciones": "Search rooms",
    "Seleccionar fecha": "Select date",
    Elegir: "Choose",
    "Mes anterior": "Previous month",
    "Mes siguiente": "Next month",
    "Fecha seleccionada": "Selected date",
    "Selecciona un día": "Select a day",
    Cerrar: "Close",
    "Ventajas del hotel": "Hotel benefits",
    "Servicio 24/7": "24/7 Service",
    "Estamos siempre disponibles para ti.": "We are always available for you.",
    Comodidad: "Comfort",
    "Habitaciones diseñadas para tu descanso.": "Rooms designed for your comfort.",
    Seguridad: "Safety",
    "Tu tranquilidad es nuestra prioridad.": "Your peace of mind is our priority.",
    Ubicación: "Location",
    "En el corazón de la ciudad, cerca de todo.": "In the heart of the city, close to everything.",
    "Beneficios del hotel": "Hotel benefits",
    "Ubicación estratégica": "Strategic location",
    "Acceso fácil a sitios turísticos, restaurantes y transporte local.": "Easy access to tourist attractions, restaurants, and local transportation.",
    "Atención 24/7": "24/7 Assistance",
    "Soporte para reservas, consultas y servicios personalizados.": "Support for reservations, inquiries, and personalized services.",
    "Experiencias únicas": "Unique experiences",
    "Planes especiales, cenas temáticas y actividades de bienestar.": "Special packages, themed dinners, and wellness activities.",
    "Encuentra el espacio perfecto para tu estadía": "Find the perfect space for your stay",
    "Habitaciones Individuales": "Single Rooms",
    "Habitaciones Dobles": "Double Rooms",
    "Habitaciones Familiares": "Family Rooms",
    "Un espacio confortable para una estadía tranquila y práctica.": "A comfortable space for a peaceful and practical stay.",
    "Una opción cómoda para parejas o amigos.": "A comfortable option for couples or friends.",
    "Más espacio y comodidad para compartir en familia.": "More space and comfort to enjoy with family.",
    "habitaciones disponibles": "rooms available",
    "habitación disponible": "room available",
    "Tu estadía": "Your stay",
    "Habitaciones para tu viaje": "Rooms for your trip",
    "Consultar disponibilidad…": "Checking availability…",
    "Reservar ahora": "Book now",
    "No disponible": "Unavailable",
    "En proceso": "In progress",
    "No se pudo actualizar la disponibilidad.": "Availability could not be updated.",
    "No se pudo actualizar la disponibilidad. Verifica nuevamente antes de reservar.": "Availability could not be updated. Check again before booking.",
    "Ver fotos, video y características": "View photos, video, and features",
    "Explora": "Explore",
    "Hospitalidad elegante en Sonsón, donde cada detalle está pensado para tu descanso.": "Elegant hospitality in Sonsón, where every detail is designed for your comfort.",
    "Todos los derechos reservados.": "All rights reserved.",
    "Tipo:": "Type:",
    "Camas:": "Beds:",
    Características: "Features",
    "Sin características registradas.": "No features registered.",
    "por persona": "per person",
    "Continuar": "Continue",
    "Ver detalles": "View details",
    "Recepción 24/7": "24/7 Front Desk",
    "Consulta segura": "Secure lookup",
    "Cerrar galería de experiencias": "Close experience gallery",
    "Imagen anterior": "Previous image",
    "Siguiente imagen": "Next image",
    "Seleccionar imagen": "Select image",
    Individual: "Single",
    Doble: "Double",
    Familiar: "Family",
  },
};
const translate = (language, text) => (
  language === "en" ? translations.en[text] || text : text
);
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
  roomMediaUrl("espacio_1.JPG"),
  roomMediaUrl("espacio_2.JPG"),
  roomMediaUrl("espacio_3.JPG"),
  roomMediaUrl("espacio_4.JPG"),
  roomMediaUrl("espacio_5.JPG"),
  roomMediaUrl("espacio_6.JPG"),
  roomMediaUrl("espacio_7.JPG"),
  roomMediaUrl("espacio_8.JPG"),
  roomMediaUrl("espacio_9.JPG"),
  roomMediaUrl("toalla.JPG"),
];

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
    price: "$65.000 COP / persona / noche",
    description: "Un espacio confortable para una estadía tranquila y práctica.",
    image: roomMediaUrl("individual_1.JPG"),
    video: roomMediaUrl("habitacion ind.mp4"),
    button: "Reservar ahora",
  },
  {
    title: "Habitación Doble",
    category: "doble",
    price: "$65.000 COP / persona / noche",
    description: "Una opción cómoda para parejas o amigos.",
    image: roomMediaUrl("doble_1.JPG"),
    video: roomMediaUrl("habitacion dob.mp4"),
    button: "Ver detalles",
  },
  {
    title: "Habitación Familiar",
    category: "familiar",
    price: "$65.000 COP / persona / noche",
    description: "Más espacio y comodidad para compartir en familia.",
    image: roomMediaUrl("familiar_1.JPG"),
    video: roomMediaUrl("habitacion fam.mp4"),
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
  const [language, setLanguage] = useState("es");
  const t = (text) => translate(language, text);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAdminAlert, setShowAdminAlert] = useState(false);
  const [showReservationLookup, setShowReservationLookup] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupCountry, setLookupCountry] = useState(
    () => phoneCountryCodes.find(({ country }) => country === "Colombia")
  );
  const [lookupCode, setLookupCode] = useState("");
  const [lookupCodeSent, setLookupCodeSent] = useState(false);
  const [lookupReservations, setLookupReservations] = useState(null);
  const [lookupRefreshError, setLookupRefreshError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupNotice, setLookupNotice] = useState("");
  const [publicRooms, setPublicRooms] = useState([]);
  const [availabilitySnapshot, setAvailabilitySnapshot] = useState({
    checkIn: "",
    checkOut: "",
    availability: null,
    error: "",
  });
  const hasValidAvailabilityDates = Boolean(checkIn && checkOut && checkOut > checkIn);
  const availabilityMatchesDates = availabilitySnapshot.checkIn === checkIn
    && availabilitySnapshot.checkOut === checkOut;
  const availabilityByCategory = availabilityMatchesDates ? availabilitySnapshot.availability : null;
  const availabilityError = availabilityMatchesDates ? availabilitySnapshot.error : "";
  const availabilityLoading = hasValidAvailabilityDates && !availabilityMatchesDates;
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);
  const [mostrarAtencion, setMostrarAtencion] = useState(false);
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
  const [verificationNotice, setVerificationNotice] = useState("");
  const [verificationNoticeType, setVerificationNoticeType] = useState("");
  const [retryingAcceptanceEmail, setRetryingAcceptanceEmail] = useState(false);
  const otpInputRefs = useRef([]);
  const [paymentPercentage, setPaymentPercentage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentReturnToast, setPaymentReturnToast] = useState({
    show: false,
    message: "",
    type: "info",
    status: "pending",
  });
  const [phoneCountry, setPhoneCountry] = useState(
    phoneCountryCodes.find(({ country }) => country === "Colombia")
  );
  const [guestDetails, setGuestDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const getRoomTitle = (title) => {
    if (language !== "en") return title;
    return String(title || "")
      .replace(/^Habitación\s*/i, "Room ")
      .replace(/\bIndividual\b/i, "Single")
      .replace(/\bDoble\b/i, "Double")
      .replace(/\bFamiliar\b/i, "Family");
  };

  const getAvailabilityLabel = (count) =>
    `${count} ${t(count === 1 ? "habitación disponible" : "habitaciones disponibles")}`;

  const getAvailableRoomCount = (room) => {
    if (!room) return 0;
    if (hasValidAvailabilityDates && !availabilityByCategory) return 0;
    const datedAvailability = availabilityByCategory?.[room.category];
    return Number(datedAvailability ?? room.habitacionesDisponibles ?? 0);
  };

  const getCategoryAvailabilityLabel = (category) => {
    if (availabilityError) return t("No se pudo actualizar la disponibilidad.");
    if (availabilityLoading) return t("Consultar disponibilidad…");
    const room = obtenerDatosCategoria(category);
    return getAvailabilityLabel(getAvailableRoomCount(room));
  };

  const getFullPhoneNumber = () => `${phoneCountry.code}${guestDetails.phone.replace(/\D/g, "")}`;

  const resetReservationLookup = () => {
    setShowReservationLookup(false);
    setLookupPhone("");
    setLookupCountry(phoneCountryCodes.find(({ country }) => country === "Colombia"));
    setLookupCode("");
    setLookupCodeSent(false);
    setLookupReservations(null);
    setLookupRefreshError("");
    setLookupLoading(false);
    setLookupError("");
    setLookupNotice("");
  };

  const getLookupFullPhone = () =>
    `${lookupCountry.code}${lookupPhone.replace(/\D/g, "")}`;

  const handleRequestReservationCode = async (event) => {
    event.preventDefault();
    setLookupLoading(true);
    setLookupError("");
    setLookupNotice("");

    try {
      const resultado = await solicitarCodigoConsultaReserva(getLookupFullPhone());
      setLookupCodeSent(true);
      setLookupNotice(resultado.mensaje);
    } catch (error) {
      setLookupError(error.message || "No se pudo enviar el código.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleVerifyReservationCode = async (event) => {
    event.preventDefault();
    setLookupLoading(true);
    setLookupError("");
    setLookupNotice("");

    try {
      const resultado = await verificarCodigoConsultaReserva(
        getLookupFullPhone(),
        lookupCode
      );
      setLookupReservations(resultado.reservas || []);
      setLookupRefreshError("");
      setLookupNotice(resultado.mensaje);
    } catch (error) {
      setLookupError(error.message || "No se pudo verificar el código.");
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    if (!showReservationLookup) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !lookupLoading) {
        setShowReservationLookup(false);
        setLookupPhone("");
        setLookupCountry(phoneCountryCodes.find(({ country }) => country === "Colombia"));
        setLookupCode("");
        setLookupCodeSent(false);
        setLookupReservations(null);
        setLookupRefreshError("");
        setLookupError("");
        setLookupNotice("");
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [showReservationLookup, lookupLoading]);

  const lookupHasResults = lookupReservations !== null;

  useEffect(() => {
    if (!showReservationLookup || !lookupHasResults) return undefined;

    let active = true;
    let interval;
    const actualizarReservas = async () => {
      try {
        const resultado = await actualizarReservasVerificadas();
        if (active) {
          setLookupReservations(Array.isArray(resultado.reservas) ? resultado.reservas : []);
          setLookupRefreshError("");
        }
      } catch (error) {
        if (active) {
          setLookupRefreshError(error.message || "No se pudieron actualizar los estados de tus reservas.");
        }
      }
    };

    interval = window.setInterval(actualizarReservas, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [showReservationLookup, lookupHasResults]);

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
          const precio = (Number(habitacion.precio_noche) || nightlyRatePerPerson).toLocaleString("es-CO");

          return {
            ...room,
            id_habitacion: habitacion.id_habitacion,
            tipo,
            numero,
            title: `Habitación ${tipo}`,
            price: `$${precio} COP / persona / noche`,
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

  useEffect(() => {
    if (!hasValidAvailabilityDates) return undefined;

    let active = true;
    let requestInProgress = false;

    const actualizarDisponibilidad = async () => {
      if (!active || requestInProgress || document.visibilityState !== "visible") return;
      requestInProgress = true;
      try {
        const resultado = await obtenerDisponibilidadPublica(checkIn, checkOut);
        if (active) {
          setAvailabilitySnapshot({
            checkIn,
            checkOut,
            availability: resultado.disponibilidad || {},
            error: "",
          });
        }
      } catch (error) {
        if (active) {
          setAvailabilitySnapshot((previous) => ({
            checkIn,
            checkOut,
            availability: previous.checkIn === checkIn && previous.checkOut === checkOut
              ? previous.availability
              : null,
            error: error.message || "No se pudo actualizar la disponibilidad.",
          }));
        }
      } finally {
        requestInProgress = false;
      }
    };

    actualizarDisponibilidad();
    const interval = window.setInterval(actualizarDisponibilidad, 5000);
    const actualizarAlVolver = () => {
      if (document.visibilityState === "visible") actualizarDisponibilidad();
    };
    document.addEventListener("visibilitychange", actualizarAlVolver);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", actualizarAlVolver);
    };
  }, [checkIn, checkOut, hasValidAvailabilityDates]);

  const nights = checkIn && checkOut
    ? Math.round((new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`)) / 86400000)
    : 0;
  const nightlyRate = nightlyRatePerPerson * guestCount;
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
      setPaymentPercentage("");
      setTermsAccepted(false);
      setPrivacyAccepted(false);
      setVerificationNotice("");
      setVerificationNoticeType("");
      return;
    }
    setShowSearchResults(true);
  };

  const handleContinueToDateSelection = (room) => {
    if (getAvailableRoomCount(room) < 1) return;

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
    if (getAvailableRoomCount(room) < 1) return;

    setSelectedRoom(room);
    setBookingOrigin("search");
    setShowSearchResults(false);
    setActiveRoom(null);
    setRoomPreviewFromSearch(false);
    setBookingStep(1);
    setBookingMessage("");
    setPaymentPercentage("");
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setVerificationNotice("");
    setVerificationNoticeType("");
    setPaymentLoading(false);
  };

  const handleCloseBooking = () => {
    setSelectedRoom(null);
    setBookingStep(1);
    setVerificationSuccess(false);
    setBookingMessage("");
    setBookingMessageType("");
    setVerificationNotice("");
    setVerificationNoticeType("");
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setWhatsappCode(["", "", "", ""]);
    setWhatsappCodeSent(false);
    setOtpExpiresAt(null);
    setOtpRemainingSeconds(0);
    setPaymentPercentage("");
    setPaymentLoading(false);
  };

  const handleBackToRoomResults = () => {
    setSelectedRoom(null);
    setActiveRoom(null);
    setRoomPreviewFromSearch(false);
    setBookingStep(1);
    setVerificationSuccess(false);
    setBookingMessage("");
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setVerificationNotice("");
    setVerificationNoticeType("");
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
    setVerificationNotice("");
    setVerificationNoticeType("");
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
      const resultado = await solicitarCodigoWhatsapp(
        telefono,
        guestDetails,
        termsAccepted,
        privacyAccepted
      );
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
      const resultado = await verificarCodigoWhatsapp(getFullPhoneNumber(), whatsappCode.join(""));
      setBookingMessage("");
      setBookingMessageType("");
      setVerificationNotice(resultado.correoEnviado
        ? `Enviamos la confirmación de aceptación y el PDF a ${guestDetails.email}.`
        : "El teléfono quedó verificado, pero no pudimos enviar el correo de confirmación. Comunícate con el hotel para solicitarlo.");
      setVerificationNoticeType(resultado.correoEnviado ? "success" : "warning");
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

  const handleRetryAcceptanceEmail = async () => {
    setRetryingAcceptanceEmail(true);
    try {
      const resultado = await reenviarCorreoAceptacion();
      setVerificationNotice(resultado.mensaje);
      setVerificationNoticeType("success");
    } catch (error) {
      setVerificationNotice(error.message || "No se pudo reenviar el correo. Inténtalo nuevamente.");
      setVerificationNoticeType("warning");
    } finally {
      setRetryingAcceptanceEmail(false);
    }
  };

  const handleStartWompiPayment = async () => {
    if (!paymentPercentage) {
      setBookingMessage("Selecciona si pagarás el 50% o el total de la estadía.");
      setBookingMessageType("error");
      return;
    }

    setPaymentLoading(true);
    setBookingMessage("");
    setBookingMessageType("");
    try {
      const resultado = await iniciarPagoWompi({
        fecha_entrada: checkIn,
        fecha_salida: checkOut,
        tipo_habitacion: selectedRoom.tipo || selectedRoom.category,
        numero_persona: guestCount,
        porcentaje_pago: Number(paymentPercentage),
      });
      const parametros = new URLSearchParams({
        "public-key": resultado.llavePublica,
        currency: "COP",
        "amount-in-cents": String(resultado.montoCentavos),
        reference: resultado.referencia,
        "signature:integrity": resultado.firmaIntegridad,
        "expiration-time": resultado.expiracion,
        "customer-data:email": resultado.cliente.email,
        "customer-data:full-name": resultado.cliente.nombreCompleto,
      });
      if (resultado.urlRetorno) {
        parametros.set("redirect-url", resultado.urlRetorno);
      }
      const codigoPais = phoneCountry.code.replace(/\D/g, "");
      const telefonoCompleto = String(resultado.cliente.telefono || "").replace(/\D/g, "");
      if (codigoPais && telefonoCompleto.startsWith(codigoPais)) {
        parametros.set("customer-data:phone-number", telefonoCompleto.slice(codigoPais.length));
        parametros.set("customer-data:phone-number-prefix", phoneCountry.code);
      }
      window.location.assign(`https://checkout.wompi.co/p/?${parametros.toString()}`);
    } catch (error) {
      setBookingMessage(error.message || "No se pudo iniciar el pago con Wompi.");
      setBookingMessageType("error");
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const referencia = parametros.get("pago");
    if (!referencia) return undefined;

    parametros.delete("pago");
    const query = parametros.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
    );

    let active = true;
    let timeout;
    let intentos = 0;
    const revisarPago = async () => {
      try {
        const resultado = await consultarEstadoPago(referencia);
        if (!active) return;

        const estado = String(resultado.estado || "").toUpperCase();
        if (estado === "APPROVED") {
          setPaymentReturnToast({
            show: true,
            message: "¡Pago aprobado! Recepción te asignará una habitación y confirmará tu reserva.",
            type: "success",
            status: "approved",
          });
          return;
        }
        if (["DECLINED", "VOIDED", "ERROR"].includes(estado)) {
          setPaymentReturnToast({
            show: true,
            message: "Wompi no aprobó el pago. Puedes volver a iniciar tu reserva.",
            type: "error",
            status: "rejected",
          });
          return;
        }
        if (intentos >= 14) {
          setPaymentReturnToast({
            show: true,
            message: "Tu pago sigue en confirmación. Consulta el estado de tu reserva en unos minutos.",
            type: "info",
            status: "pending",
          });
          return;
        }

        intentos += 1;
        timeout = window.setTimeout(revisarPago, 2000);
      } catch {
        if (active) {
          setPaymentReturnToast({
            show: true,
            message: "No pudimos consultar el pago todavía. Revisa el estado de tu reserva más tarde.",
            type: "error",
            status: "unknown",
          });
        }
      }
    };

    revisarPago();
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, []);

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
    <div className="home-page" lang={language}>
      <header className="home-header">
        <div className="home-brand">
          <img src={homeLogo} alt="Hotel Valencia logo" className="home-logo-image" />
          <span className="home-subtitle">{t("Hotel Ejecutivo")}</span>
        </div>
        <nav className="home-nav">
          <a href="#hero">{t("Inicio")}</a>
          {/* <a href="#services">Servicios</a> */}
          <a href="#rooms">{t("Habitaciones")}</a>
          {/* <a href="#reviews">Reseñas</a> */}
          <a href="#contact">{t("Contacto")}</a>
        </nav>
        <div className="home-actions">
          <button
            type="button"
            className="home-reservation-lookup-button"
            onClick={() => setShowReservationLookup(true)}
          >
            <i className="fa-solid fa-ticket" aria-hidden="true" />
            {t("Verificar mi reserva")}
          </button>
          <button
            type="button"
            className="btn btn-register"
            onClick={() => setShowAdminAlert(true)}
          >
            {t("Administración")}
          </button>
          <button
            className="btn btn-lang"
            type="button"
            aria-label={language === "es" ? "Change language to English" : "Cambiar idioma a español"}
            onClick={() => setLanguage((current) => current === "es" ? "en" : "es")}
          >
            {language.toUpperCase()}
          </button>
        </div>
      </header>

      <section className="hero-section" id="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">{t("Bienvenido a Sonsón")}</span>
            <br />
            <span className="smsprincipal">{t("Elegancia, confort y servicio excepcional en un solo lugar.")}</span>
            
            <div className="hero-buttons">
              <a href="#rooms" className="btn btn-cta">
                {t("Reserva ya")}
              </a>
             
            </div>
          </div>

          <form className="hero-booking-card" onSubmit={handleSearchRooms}>
            <div className="booking-card-header">
              <span>{t("Encuentra tu habitación ideal")}</span>
              <strong>{t("Fechas y disponibilidad")}</strong>
            </div>
            {roomForDateSelection && (
              <div className="booking-selected-room">
                <div>
                  <span>{t("Habitación seleccionada")}</span>
                  <strong>{getRoomTitle(roomForDateSelection.title)}</strong>
                </div>
                <button type="button" onClick={handleChangeRoomBeforeSearch}>{t("Cambiar")}</button>
              </div>
            )}
            <div className="booking-row">
              <BookingDatePicker
                id="booking-check-in"
                label={t("Entrada")}
                value={checkIn}
                min={todayInput}
                rangeStart={checkIn}
                rangeEnd={checkOut}
                language={language}
                translateText={(text) => translate(language, text)}
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
                label={t("Salida")}
                value={checkOut}
                min={checkIn || todayInput}
                rangeStart={checkIn}
                rangeEnd={checkOut}
                language={language}
                translateText={(text) => translate(language, text)}
                onChange={(date) => {
                  setCheckOut(date);
                  setSearchError("");
                }}
              />
            </div>
            <div className="booking-row">
              <label htmlFor="booking-guests">{t("Personas (máximo 6)")}</label>
              <div className="counter" id="booking-guests">
                <button type="button" onClick={() => updateGuestCount(-1)} disabled={guestCount <= 1} aria-label={t("Quitar una persona")}>−</button>
                <span>{guestCount}</span>
                <button type="button" onClick={() => updateGuestCount(1)} disabled={guestCount >= 6} aria-label={t("Agregar una persona")}>+</button>
              </div>
            </div>
            {nights > 0 && (
              <div className="booking-price-preview" aria-live="polite" aria-atomic="true">
                <div className="booking-price-preview-heading">
                  <span>{t("Resumen estimado")}</span>
                  <span>{nights} {t(nights === 1 ? "noche" : "noches")} · {guestCount} {t(guestCount === 1 ? "persona" : "personas")}</span>
                </div>
                <div className="booking-price-preview-row">
                  <span>{t("Tarifa por noche")} ({guestCount} {t(guestCount === 1 ? "persona" : "personas")})</span>
                  <strong>{formatCurrency(nightlyRate)}</strong>
                </div>
                <div className="booking-price-preview-total">
                  <span>{t("Total estimado")}</span>
                  <strong>{formatCurrency(bookingTotal)}</strong>
                </div>
                <small>{language === "en"
                  ? `Rate of ${formatCurrency(nightlyRatePerPerson)} per person per night.`
                  : `Tarifa de ${formatCurrency(nightlyRatePerPerson)} por persona y noche.`}
                </small>
              </div>
            )}
            {searchError && <p className="reservation-inline-error" role="alert">{searchError}</p>}
            <button className="btn btn-book" type="submit">
              {t(roomForDateSelection ? "Buscar fechas y continuar" : "Buscar habitación")}
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
            <span className="reservation-eyebrow">{t("Tu estadía")}</span>
            <h2 id="reservation-results-title">{t("Habitaciones para tu viaje")}</h2>
            <p className="reservation-results-dates">
              {checkIn} → {checkOut} · {nights} {t(nights === 1 ? "noche" : "noches")} · {guestCount} {t(guestCount === 1 ? "persona" : "personas")}
            </p>
            <div className="reservation-room-list">
              {rooms.map((room) => {
                const roomData = publicRooms.find((item) => item.category === room.category);
                const availableRooms = getAvailableRoomCount(roomData);
                const image = roomData?.imagenesReales?.[0] || roomData?.image || room.image;
                return (
                  <article className="reservation-room-card" key={room.category}>
                    <div className="reservation-room-image-wrap">
                      <img
                        src={image}
                        alt={getRoomTitle(roomData?.title || room.title)}
                        onError={(event) => { event.currentTarget.src = homeLogo; }}
                      />
                      <button
                        className="reservation-room-preview"
                        type="button"
                        disabled={!roomData || availabilityLoading || availabilityError || availableRooms < 1}
                        onClick={() => handlePreviewRoom({ ...room, ...roomData, image })}
                        aria-label={`${t("Ver fotos, video y características")} de ${getRoomTitle(roomData?.title || room.title)}`}
                        title={t("Ver fotos, video y características")}
                      >
                        <i className="fa-solid fa-eye" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="reservation-room-copy">
                      <h3>{getRoomTitle(roomData?.title || room.title)}</h3>
                      <p>{t(room.description)}</p>
                      <span className={availableRooms ? "reservation-availability" : "reservation-unavailable"}>
                        {roomsLoading || availabilityLoading
                          ? t("Consultar disponibilidad…")
                          : getAvailabilityLabel(availableRooms)}
                      </span>
                    </div>
                    <div className="reservation-room-action">
                      <strong>{formatCurrency(nightlyRate)} <small>/ {t("noche")}</small></strong>
                      <small>{formatCurrency(nightlyRatePerPerson)} {t("por persona")}</small>
                      <button
                        className="btn btn-book"
                        type="button"
                        disabled={!roomData || availabilityLoading || availabilityError || availableRooms < 1}
                        onClick={() => handleStartBooking({ ...room, ...roomData, image })}
                      >
                        {availabilityLoading
                          ? t("Consultar disponibilidad…")
                          : availableRooms
                            ? t("Reservar ahora")
                            : t("No disponible")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="reservation-disclaimer">
              {language === "en"
                ? "Availability updates for the selected stay dates and reflects active reservations automatically."
                : "La disponibilidad se calcula para las fechas elegidas y refleja automáticamente las reservas activas."}
            </p>
            {availabilityError && (
              <p className="reservation-disclaimer" role="alert">
                {t("No se pudo actualizar la disponibilidad. Verifica nuevamente antes de reservar.")}
              </p>
            )}
          </section>
        </div>
      )}

      <section className="feature-strip" aria-label={t("Ventajas del hotel")}>
        <div className="feature-strip-grid">
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🔔</div>
            <div className="feature-copy">
              <h3>{t("Servicio 24/7")}</h3>
              <p>{t("Estamos siempre disponibles para ti.")}</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🛏️</div>
            <div className="feature-copy">
              <h3>{t("Comodidad")}</h3>
              <p>{t("Habitaciones diseñadas para tu descanso.")}</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">🛡️</div>
            <div className="feature-copy">
              <h3>{t("Seguridad")}</h3>
              <p>{t("Tu tranquilidad es nuestra prioridad.")}</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">📍</div>
            <div className="feature-copy">
              <h3>{t("Ubicación")}</h3>
              <p>{t("En el corazón de la ciudad, cerca de todo.")}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="value-cards" aria-label={t("Beneficios del hotel")}>
        <button type="button" className="value-card value-card-button" onClick={() => setMostrarUbicacion(true)}>
          <h3>{t("Ubicación estratégica")}</h3>
          <p>{t("Acceso fácil a sitios turísticos, restaurantes y transporte local.")}</p>
        </button>

        <button
          type="button"
          className="value-card value-card-button"
          onClick={() => setMostrarAtencion(true)}
        >
          <h3>{t("Atención 24/7")}</h3>
          <p>{t("Soporte para reservas, consultas y servicios personalizados.")}</p>
        </button>

        <button type="button" className="value-card value-card-button" onClick={handleOpenExperienceModal}>
          <h3>{t("Experiencias únicas")}</h3>
          <p>{t("Planes especiales, cenas temáticas y actividades de bienestar.")}</p>
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
          <span>{t("Habitaciones")}</span>
          <h2>{t("Encuentra el espacio perfecto para tu estadía")}</h2>
        </div>
        <div className="room-categories">
          <button
            type="button"
            className="category-card image"
            onClick={() => handleOpenCategory("individual")}
            style={{ backgroundImage: `url(${publicRooms.find(r => r.category === "individual")?.image || rooms.find(r => r.category === "individual")?.image})` }}
          >
            <div className="category-overlay">
              <h3>{t("Habitaciones Individuales")}</h3>
              {/* <p>Confort y privacidad para una persona.</p> */}
              <div className="category-availability">
                <strong>{getCategoryAvailabilityLabel("individual")}</strong>
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
              <h3>{t("Habitaciones Dobles")}</h3>
              {/* <p>El espacio ideal para compartir.</p> */}
              <div className="category-availability">
                <strong>{getCategoryAvailabilityLabel("doble")}</strong>
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
              <h3>{t("Habitaciones Familiares")}</h3>
              {/* <p>Amplitud y comodidad para toda la familia.</p> */}
              <div className="category-availability">
                <strong>{getCategoryAvailabilityLabel("familiar")}</strong>
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
            <button className="modal-close" type="button" onClick={handleCloseExperienceModal} aria-label="Cerrar galería de experiencias">
              ×
            </button>
            <div className="experience-carousel">
              <button className="carousel-control prev" type="button" onClick={handlePrevSlide} aria-label="Imagen anterior">
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <div className="carousel-slide">
                <img src={galleryImages[activeSlide]} alt={`Imagen ${activeSlide + 1} de la experiencia`} />
              </div>
              <button className="carousel-control next" type="button" onClick={handleNextSlide} aria-label="Imagen siguiente">
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
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

      {mostrarAtencion && (
        <SolicitudAtencionModal onCerrar={() => setMostrarAtencion(false)} />
      )}

      {showReservationLookup && (
        <div
          className="reservation-lookup-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !lookupLoading) resetReservationLookup();
          }}
        >
          <section
            className="reservation-lookup-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-lookup-title"
          >
            <button
              className="reservation-lookup-close"
              type="button"
              aria-label="Cerrar"
              onClick={resetReservationLookup}
              disabled={lookupLoading}
            >
              ×
            </button>
            <div className="reservation-lookup-heading">
              <span className="reservation-lookup-icon">
                <i className="fa-solid fa-shield-halved" aria-hidden="true" />
              </span>
              <span className="reservation-eyebrow">Hotel Valencia · Consulta segura</span>
              <h2 id="reservation-lookup-title">Verificar mi reserva</h2>
              <p>Confirma tu número para consultar el estado y los detalles de tus reservas.</p>
            </div>

            {lookupReservations === null && !lookupCodeSent && (
              <form className="reservation-lookup-form" onSubmit={handleRequestReservationCode}>
                <label htmlFor="reservation-lookup-phone">Número de teléfono</label>
                <div className="reservation-lookup-phone-fields">
                  <PhoneCountryPicker country={lookupCountry} onChange={setLookupCountry} />
                  <div className="reservation-lookup-input-wrap">
                    <i className="fa-solid fa-phone" aria-hidden="true" />
                    <input
                      id="reservation-lookup-phone"
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      maxLength={15}
                      placeholder="300 123 4567"
                      value={lookupPhone}
                      onChange={(event) => setLookupPhone(event.target.value.replace(/\D/g, ""))}
                      required
                      disabled={lookupLoading}
                    />
                  </div>
                </div>
                <small>Selecciona el código de país e ingresa el número usado al hacer la reserva.</small>
                {lookupError && <p className="reservation-lookup-message is-error" role="alert">{lookupError}</p>}
                <button className="reservation-lookup-submit" type="submit" disabled={lookupLoading}>
                  {lookupLoading ? "Verificando número…" : "Enviar código por WhatsApp"}
                </button>
              </form>
            )}

            {lookupReservations === null && lookupCodeSent && (
              <form className="reservation-lookup-form" onSubmit={handleVerifyReservationCode}>
                <p className="reservation-lookup-code-hint">
                  Enviamos un código de 6 dígitos al WhatsApp asociado a <strong>{getLookupFullPhone()}</strong>.
                </p>
                <label htmlFor="reservation-lookup-code">Código de verificación</label>
                <div className="reservation-lookup-input-wrap">
                  <i className="fa-solid fa-key" aria-hidden="true" />
                  <input
                    id="reservation-lookup-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={lookupCode}
                    onChange={(event) => setLookupCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    minLength={6}
                    maxLength={6}
                    required
                    disabled={lookupLoading}
                  />
                </div>
                {lookupNotice && <p className="reservation-lookup-message is-success" role="status">{lookupNotice}</p>}
                {lookupError && <p className="reservation-lookup-message is-error" role="alert">{lookupError}</p>}
                <button className="reservation-lookup-submit" type="submit" disabled={lookupLoading || lookupCode.length !== 6}>
                  {lookupLoading ? "Validando código…" : "Ver mis reservas"}
                </button>
                <button
                  className="reservation-lookup-back"
                  type="button"
                  onClick={() => {
                    setLookupCodeSent(false);
                    setLookupCode("");
                    setLookupError("");
                    setLookupNotice("");
                  }}
                  disabled={lookupLoading}
                >
                  Cambiar número
                </button>
              </form>
            )}

            {lookupReservations !== null && (
              <div className="reservation-lookup-results">
                {lookupRefreshError && (
                  <p className="reservation-lookup-message is-error" role="alert">
                    {lookupRefreshError}
                  </p>
                )}
                {lookupReservations.length ? (
                  lookupReservations.map((reserva) => {
                    const estado = String(reserva.estado || "Pendiente").trim();
                    const estadoNormalizado = estado.toLowerCase();
                    const enEsperaRecepcion = estadoNormalizado.includes("pago aprobado")
                      || estadoNormalizado.includes("pendiente de confirmación")
                      || estadoNormalizado.includes("pendiente de confirmacion");
                    const estadoLabel = enEsperaRecepcion ? "En proceso" : estado;
                    const estadoClase = estadoNormalizado.includes("cancel")
                      ? "cancelada"
                      : estadoNormalizado.includes("rechaz")
                        ? "rechazada"
                        : estadoNormalizado.includes("confirmada")
                        ? "confirmada"
                        : "pendiente";
                    const estadoPagoOriginal = String(reserva.estado_pago || "").trim();
                    const estadoPagoNormalizado = estadoPagoOriginal.toUpperCase();
                    const estadoPago = estadoPagoNormalizado === "APPROVED"
                      ? "Pago aprobado"
                      : estadoPagoNormalizado === "PENDING"
                        ? "Pendiente"
                        : estadoPagoOriginal || "Sin pago registrado";
                    const pagoAprobado = estadoPagoNormalizado === "APPROVED";
                    const saldoPendiente = reserva.monto_total !== null && reserva.monto_total !== undefined
                      ? Math.max(Number(reserva.monto_total) - (pagoAprobado ? Number(reserva.monto || 0) : 0), 0)
                      : null;

                    return (
                      <article className="reservation-lookup-card" key={reserva.id_reserva}>
                        <header className="reservation-lookup-card-heading">
                          <div className="reservation-lookup-card-title">
                            <span>Reserva</span>
                            <strong>#{reserva.id_reserva}</strong>
                            {reserva.fecha_reserva && (
                              <small>Solicitada el {formatLookupDate(reserva.fecha_reserva)}</small>
                            )}
                          </div>
                          <span className={`reservation-lookup-status is-${estadoClase}`}>{estadoLabel}</span>
                        </header>
                        <div className="reservation-lookup-stay">
                          <div>
                            <span><i className="fa-solid fa-arrow-right-to-bracket" aria-hidden="true" />Entrada</span>
                            <strong>{formatLookupDate(reserva.fecha_entrada)}</strong>
                          </div>
                          <i className="fa-solid fa-arrow-right reservation-lookup-stay-arrow" aria-hidden="true" />
                          <div>
                            <span><i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />Salida</span>
                            <strong>{formatLookupDate(reserva.fecha_salida)}</strong>
                          </div>
                        </div>
                        <div className="reservation-lookup-room">
                          <span className="reservation-lookup-room-icon" aria-hidden="true">
                            <i className="fa-solid fa-bed" />
                          </span>
                          <div>
                            <span>Habitación</span>
                            <strong>
                              {reserva.numero_habitacion
                                ? `#${reserva.numero_habitacion} · ${reserva.tipo_habitacion || ""}`
                                : `Pendiente de asignación${reserva.tipo_habitacion ? ` · ${reserva.tipo_habitacion}` : ""}`}
                            </strong>
                          </div>
                          <span className="reservation-lookup-guests">
                            <i className="fa-solid fa-user-group" aria-hidden="true" />
                            {reserva.numero_persona || "—"}{" "}
                            {Number(reserva.numero_persona) === 1 ? "persona" : "personas"}
                          </span>
                        </div>
                        <section className="reservation-lookup-payment">
                          <div className="reservation-lookup-payment-heading">
                            <span>Estado del pago</span>
                            <strong className={pagoAprobado ? "is-approved" : ""}>{estadoPago}</strong>
                          </div>
                          <div className="reservation-lookup-payment-details">
                            {reserva.monto_total !== null && reserva.monto_total !== undefined && (
                              <div><span>Total de estadía</span><strong>{formatLookupMoney(reserva.monto_total)}</strong></div>
                            )}
                            {reserva.monto && (
                              <div><span>Valor del pago</span><strong>{formatLookupMoney(reserva.monto)}</strong></div>
                            )}
                            {pagoAprobado && saldoPendiente !== null && saldoPendiente > 0 && (
                              <div><span>Saldo en el hotel</span><strong>{formatLookupMoney(saldoPendiente)}</strong></div>
                            )}
                          </div>
                          {(reserva.metodo_pago || reserva.fecha_pago) && (
                            <div className="reservation-lookup-payment-meta">
                              {reserva.metodo_pago && <span><i className="fa-regular fa-credit-card" aria-hidden="true" />{reserva.metodo_pago}</span>}
                              {reserva.fecha_pago && <span><i className="fa-regular fa-clock" aria-hidden="true" />{formatLookupDate(reserva.fecha_pago)}</span>}
                            </div>
                          )}
                        </section>
                        {reserva.observacion && (
                          <p className="reservation-lookup-observation">
                            <strong>Nota:</strong> {reserva.observacion}
                          </p>
                        )}
                        {reserva.mensaje_cliente && (
                          <section className="reservation-lookup-hotel-message" aria-label="Mensaje de recepción">
                            <strong>
                              <i className="fa-regular fa-comment-dots" aria-hidden="true" />
                              Mensaje de recepción
                            </strong>
                            <p>{reserva.mensaje_cliente}</p>
                          </section>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="reservation-lookup-no-results">
                    <i className="fa-regular fa-calendar-xmark" aria-hidden="true" />
                    <strong>No encontramos reservas para este número</strong>
                    <span>Verifica que hayas ingresado el mismo teléfono usado al reservar.</span>
                  </div>
                )}
                <p className="reservation-lookup-payment-note">
                  Los pagos se reflejan cuando Wompi notifica y el servidor valida la transacción; una operación pendiente puede tardar unos minutos en actualizarse.
                </p>
                <button className="reservation-lookup-back" type="button" onClick={resetReservationLookup}>
                  Cerrar consulta
                </button>
              </div>
            )}
          </section>
        </div>
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
                    <label className="reservation-terms-consent">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(event) => setTermsAccepted(event.target.checked)}
                        required
                      />
                      <span>
                        He leído y acepto los{" "}
                        <a href={termsDocumentUrl} target="_blank" rel="noreferrer">
                          términos y condiciones del Hotel Valencia
                        </a>
                        . Recibiré una copia en el correo registrado.
                      </span>
                    </label>
                    <label className="reservation-terms-consent">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(event) => setPrivacyAccepted(event.target.checked)}
                        required
                      />
                      <span>
                        Autorizo el tratamiento de mis datos personales para gestionar mi solicitud, verificar mi contacto
                        y enviarme esta constancia por correo electrónico.
                      </span>
                    </label>
                    {bookingMessage && <p className={`reservation-integration-note is-${bookingMessageType}`} role="alert">{bookingMessage}</p>}
                    <button className="btn btn-book reservation-primary-action" type="submit" disabled={verificationLoading || !termsAccepted || !privacyAccepted}>
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
                      setTermsAccepted(false);
                      setPrivacyAccepted(false);
                      setWhatsappCode(["", "", "", ""]);
                      setWhatsappCodeSent(false);
                      setOtpExpiresAt(null);
                      setOtpRemainingSeconds(0);
                    }}>
                      Volver a mis datos
                    </button>
                    <div className="reservation-payment-preview">
                      <span>Paso 3</span>
                      <strong>Valor a pagar</strong>
                      <p>Después de verificar el teléfono podrás elegir entre pagar el 50% o el total.</p>
                    </div>
                  </section>
                )}

                {bookingStep === 3 && (
                  <section className="reservation-payment">
                    <span className="reservation-step-kicker">Paso 3 de 3</span>
                    <h3>Elige cuánto quieres pagar</h3>
                    <p>Selecciona el valor de tu pago y continúa al checkout seguro de Wompi.</p>
                    {verificationNotice && <p className={`reservation-integration-note is-${verificationNoticeType}`} role="status">{verificationNotice}</p>}
                    {verificationNoticeType === "warning" && (
                      <button
                        className="reservation-text-action"
                        type="button"
                        onClick={handleRetryAcceptanceEmail}
                        disabled={retryingAcceptanceEmail}
                      >
                        {retryingAcceptanceEmail ? "Reintentando envío..." : "Reintentar envío del correo"}
                      </button>
                    )}
                    <label className="reservation-payment-option">
                      <input
                        type="radio"
                        name="payment-percentage"
                        value="50"
                        checked={paymentPercentage === "50"}
                        onChange={(event) => setPaymentPercentage(event.target.value)}
                      />
                      <span>
                        <strong>Pagar el 50% ahora · {formatCurrency(Math.round(bookingTotal * 0.5))}</strong>
                        <small>El saldo restante se paga en el hotel al llegar.</small>
                      </span>
                    </label>
                    <label className="reservation-payment-option">
                      <input
                        type="radio"
                        name="payment-percentage"
                        value="100"
                        checked={paymentPercentage === "100"}
                        onChange={(event) => setPaymentPercentage(event.target.value)}
                      />
                      <span>
                        <strong>Pagar el total · {formatCurrency(bookingTotal)}</strong>
                        <small>Completa ahora el pago de toda la estadía.</small>
                      </span>
                    </label>
                    {bookingMessage && (
                      <p className={`reservation-integration-note is-${bookingMessageType}`} role="alert">
                        {bookingMessage}
                      </p>
                    )}
                    <button
                      className="btn btn-book reservation-primary-action"
                      type="button"
                      onClick={handleStartWompiPayment}
                      disabled={!paymentPercentage || paymentLoading}
                    >
                      {paymentLoading ? "Conectando con Wompi…" : "Continuar al pago"}
                    </button>
                    <small className="reservation-payment-security">
                      El pago se procesa de forma segura en Wompi. Cuando se apruebe, recepción asignará una habitación y confirmará tu reserva.
                    </small>
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
                {bookingStep === 3 && paymentPercentage && (
                  <div className="reservation-summary-payment">
                    <span>{paymentPercentage === "50" ? "Pago ahora (50%)" : "Pago ahora (total)"}</span>
                    <strong>
                      {formatCurrency(
                        paymentPercentage === "50"
                          ? Math.round(bookingTotal * 0.5)
                          : bookingTotal
                      )}
                    </strong>
                  </div>
                )}
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
            <button
              className="modal-close room-modal-close"
              type="button"
              onClick={handleCloseRoomModal}
              aria-label={language === "en" ? "Close room details" : "Cerrar detalles de la habitación"}
            >
              ×
            </button>
            <div className="room-modal-grid">
              <div className="room-modal-gallery">
                <div className="room-modal-gallery-main">
                  {activeRoomGalleryIndex === 0 ? (
                    videoYoutubeEmbed ? (
                      <iframe
                        src={videoYoutubeEmbed}
                        title={`${language === "en" ? "Video of" : "Video de"} ${getRoomTitle(activeRoom.title)}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <video controls autoPlay loop muted playsInline src={activeRoom.video} />
                    )
                  ) : (
                    <img
                      src={activeRoom.imagenesReales[activeRoomGalleryIndex - 1]}
                      alt={`${getRoomTitle(activeRoom.title)} ${language === "en" ? "image" : "imagen"} ${activeRoomGalleryIndex}`}
                    />
                  )}
                  {(activeRoom.imagenesReales?.length || 0) > 0 && (
                    <div className="room-modal-gallery-controls">
                      <button type="button" onClick={() => cambiarGaleria(-1)} aria-label={language === "en" ? "Previous item" : "Elemento anterior"}>‹</button>
                      <span>{activeRoomGalleryIndex + 1} / {1 + activeRoom.imagenesReales.length}</span>
                      <button type="button" onClick={() => cambiarGaleria(1)} aria-label={language === "en" ? "Next item" : "Siguiente elemento"}>›</button>
                    </div>
                  )}
                </div>
                <div className="room-modal-gallery-thumbs">
                  <button
                    type="button"
                    className={`room-modal-gallery-thumb room-modal-video-thumb ${activeRoomGalleryIndex === 0 ? "active" : ""}`}
                    onClick={() => setActiveRoomGalleryIndex(0)}
                    aria-label={language === "en" ? "View room video" : "Ver video de la habitación"}
                  >
                    <img src={homeLogo} alt="Hotel Valencia" />
                  </button>
                  {(activeRoom.imagenesReales || []).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={`room-modal-gallery-thumb ${activeRoomGalleryIndex === index + 1 ? "active" : ""}`}
                      onClick={() => setActiveRoomGalleryIndex(index + 1)}
                      aria-label={`${language === "en" ? "View image" : "Ver imagen"} ${index + 1}`}
                    >
                      <img src={image} alt={`${getRoomTitle(activeRoom.title)} ${language === "en" ? "thumbnail" : "miniatura"} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="room-modal-details">
                <h2>{getRoomTitle(activeRoom.title)}</h2>
                <p className="room-modal-type">
                  {t("Tipo:")} {language === "en"
                    ? getRoomTitle(`Habitación ${activeRoom.tipo || activeRoom.category}`).replace(/^Room /, "")
                    : activeRoom.tipo || activeRoom.category}
                </p>
                <p className="room-modal-registered-count">
                  {getAvailableRoomCount(activeRoom)}/{activeRoom.totalHabitaciones || 0} {t("habitaciones disponibles")}
                </p>
                <div className="room-modal-real-data">
                  <p><strong>{t("Camas:")}</strong> {activeRoom.numeroCamas || 0}</p>
                </div>
                <div className="room-modal-features">
                  <h3>{t("Características")}</h3>
                  {activeRoom.caracteristicasReales?.length > 0 ? (
                    activeRoom.caracteristicasReales.map((caracteristica, index) => (
                      <div key={`${caracteristica.idcarac || index}`} className="room-modal-feature">
                        <strong>{caracteristica.nombre}</strong>
                        <span>{caracteristica.descripcion || "Sin descripción registrada."}</span>
                      </div>
                    ))
                  ) : (
                    <span>{t("Sin características registradas.")}</span>
                  )}
                </div>
                <p className="room-modal-price">
                  {formatCurrency(nightlyRatePerPerson)} {t("por persona")}
                </p>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => (
                      roomPreviewFromSearch
                        ? handleStartBooking(activeRoom)
                        : handleContinueToDateSelection(activeRoom)
                    )}
                    disabled={availabilityLoading || availabilityError || getAvailableRoomCount(activeRoom) < 1}
                  >
                    {getAvailableRoomCount(activeRoom) > 0 ? t("Continuar") : t("No disponible")}
                  </button>
                  {roomPreviewFromSearch && (
                    <button
                      className="reservation-text-action room-preview-back"
                      type="button"
                      onClick={handleCloseRoomModal}
                    >
                      ← {language === "en" ? "Back to rooms" : "Volver a habitaciones"}
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

      {paymentReturnToast.show && (
        <div className={`payment-return-backdrop is-${paymentReturnToast.type}`} role="presentation">
          <section
            className="payment-return-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-return-title"
          >
            <span className="payment-return-icon" aria-hidden="true">
              <i className={`fa-solid ${
                paymentReturnToast.status === "approved"
                  ? "fa-check"
                  : paymentReturnToast.status === "rejected"
                    ? "fa-xmark"
                    : "fa-clock"
              }`} />
            </span>
            <h2 id="payment-return-title">
              {paymentReturnToast.status === "approved"
                ? "¡Pago aprobado!"
                : paymentReturnToast.status === "rejected"
                  ? "Pago no aprobado"
                  : paymentReturnToast.status === "pending"
                    ? "Pago en confirmación"
                    : "No pudimos confirmar el pago"}
            </h2>
            <p>{paymentReturnToast.message}</p>
            <button type="button" onClick={() => {
              setPaymentReturnToast((current) => ({ ...current, show: false }));
              navigate("/", { replace: true });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}>
              Volver al comercio
            </button>
          </section>
        </div>
      )}

      <footer className="home-footer" id="contact">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={homeLogo} alt="Hotel Valencia logo" className="footer-logo" />
            <div>
              <span className="footer-brand-name">Hotel Valencia</span>
              <p>{t("Hospitalidad elegante en Sonsón, donde cada detalle está pensado para tu descanso.")}</p>
            </div>
          </div>

          <div className="footer-links">
            <h4>{t("Explora")}</h4>
            <ul>
              <li><a href="#hero">{t("Inicio")}</a></li>
              <li><a href="#rooms">{t("Habitaciones")}</a></li>
              <li><a href="#contact">{t("Contacto")}</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>{t("Contacto")}</h4>
            <p>📍 Sonsón, Antioquia</p>
            <p>📞 +57 300 123 4567</p>
            <p>✉️ info@hotelvalencia.com</p>
            <p>🕒 {t("Recepción 24/7")}</p>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-copy">
          <span>© 2026 Hotel Valencia.</span>
          <span>{t("Todos los derechos reservados.")}</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
