import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import  UbicacionModal from "../components/UbicacionModal";

/* eslint-disable no-unused-vars */

import ConfirmDialog from "../components/ConfirmDialog";
import { obtenerCamas, obtenerCaracteristicas, obtenerHabitaciones, obtenerImagenes } from "../services/api";

const homeLogo = "http://localhost/ERPInnHub/backend/uploads/logo.png";

const galleryImages = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512915921949-053ae66b30b4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1501117716987-c8e5d6f35a0e?auto=format&fit=crop&w=1200&q=80",
];

// const _services = [
//   { name: "WiFi Premium", icon: "📶", description: "Conexión rápida en todas las áreas del hotel." },
//   { name: "Spa & Relax", icon: "🌿", description: "Zona de spa para desconectar y recargar energías." },
//   { name: "Parqueadero", icon: "🚗", description: "Estacionamiento seguro y cómodo para tu vehículo." },
//   { name: "Gimnasio", icon: "🏋️", description: "Espacio equipado para mantener tu rutina fitness." },
//   { name: "Comedor", icon: "🍽️", description: "Desayunos y cenas con sabores locales e internacionales." },
//   { name: "Zona Pet", icon: "🐾", description: "Ambiente acogedor para huéspedes con mascotas." },
// ];

const rooms = [
  {
    title: "Habitación Individual",
    category: "individual",
    price: "$180.000 COP / persona",
    description: "Un espacio confortable para una estadía tranquila y práctica.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    button: "Reservar ahora",
  },
  {
    title: "Habitación Doble",
    category: "doble",
    price: "$200.000 COP / persona",
    description: "Una opción cómoda para parejas o amigos.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    button: "Ver detalles",
  },
  {
    title: "Habitación Familiar",
    category: "familiar",
    price: "$280.000 COP / persona",
    description: "Más espacio y comodidad para compartir en familia.",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
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

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
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
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAdminAlert, setShowAdminAlert] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);

  const updateAdults = (value) => {
    setAdults((current) => Math.max(1, current + value));
  };

  const updateChildren = (value) => {
    setChildren((current) => Math.max(0, current + value));
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
            price: `$${precio} COP / persona`,
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
            const imagenesValidas = Array.isArray(imagenes) ? imagenes.filter((imagen) => imagen && imagen.url) : [];
            const video = imagenesValidas.find((imagen) => imagen.url_video)?.url_video;
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
      }
    };

    cargarHabitacionesPublicas();
  }, []);

  const handleOpenRoomModal = (room) => {
    setActiveRoom(room);
    setActiveRoomGalleryIndex(0);
  };

  const handleOpenCategory = (category) => {
    const room = publicRooms.find((item) => item.category === category);
    if (room) handleOpenRoomModal(room);
  };

  const handleCloseRoomModal = () => {
    setActiveRoom(null);
    setActiveRoomGalleryIndex(0);
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

          <aside className="hero-booking-card">
            <div className="booking-card-header">
              <span>Encuentra tu habitación ideal</span>
              <strong>Fechas y disponibilidad</strong>
            </div>
            <div className="booking-row">
              <label>Entrada</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="booking-row">
              <label>Salida</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="booking-row booking-row-inline">
              <div>
                <label>Adultos</label>
                <div className="counter">
                  <button type="button" onClick={() => updateAdults(-1)}>-</button>
                  <span>{adults}</span>
                  <button type="button" onClick={() => updateAdults(1)}>+</button>
                </div>
              </div>
              <div>
                <label>Niños</label>
                <div className="counter">
                  <button type="button" onClick={() => updateChildren(-1)}>-</button>
                  <span>{children}</span>
                  <button type="button" onClick={() => updateChildren(1)}>+</button>
                </div>
              </div>
            </div>
            <button className="btn btn-book">Buscar habitación</button>
            
          </aside>
        </div>
      </section>

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
              <p>Confort y privacidad para una persona.</p>
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
              <p>El espacio ideal para compartir.</p>
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
              <p>Amplitud y comodidad para toda la familia.</p>
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
              <button className="carousel-control prev" type="button" onClick={handlePrevSlide}>
                ‹
              </button>
              <div className="carousel-slide" style={{ backgroundImage: `url(${galleryImages[activeSlide]})` }} />
              <button className="carousel-control next" type="button" onClick={handleNextSlide}>
                ›
              </button>
            </div>
            <div className="carousel-indicators">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`carousel-indicator ${index === activeSlide ? "active" : ""}`}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {mostrarUbicacion && (
        <UbicacionModal onCerrar={() => setMostrarUbicacion(false)} />
      )}

      {activeRoom && (
        <div className="modal-backdrop modal-backdrop-show" onClick={handleCloseRoomModal}>
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
                      <video controls autoPlay={false} src={activeRoom.video} />
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
                    <span className="room-modal-play-icon">▶</span>
                    <span>Video</span>
                  </button>
                  {activeRoom.imagenesReales.map((image, index) => (
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
                <p className="room-modal-price">{activeRoom.price}</p>
                <button className="btn btn-secondary">{activeRoom.button}</button>
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
